import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as net from 'net';

type CounterState = { count: number; expiresAt: number };

type AntiAbuseSnapshot = {
  now: number;
  counters: Array<{ key: string; count: number; expiresAt: number; remainingMs: number }>;
  cooldowns: Array<{ key: string; until: number; remainingMs: number }>;
  distinct: Array<{ key: string; size: number }>;
  totals: { counters: number; cooldowns: number; distinctKeys: number };
};

@Injectable()
export class AntiAbuseService {
  private readonly counters = new Map<string, CounterState>();
  private readonly cooldowns = new Map<string, number>();
  private readonly distinct = new Map<string, Map<string, number>>();

  now() {
    return Date.now();
  }

  hash(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  getClientIp(req: any) {
    const cfConnectingIp = this.getHeader(req, 'cf-connecting-ip');
    if (cfConnectingIp) return this.normalizeIp(cfConnectingIp);

    const xRealIp = this.getHeader(req, 'x-real-ip');
    if (xRealIp) return this.normalizeIp(xRealIp);

    const xForwardedFor = this.getHeader(req, 'x-forwarded-for');
    if (xForwardedFor) {
      const first = xForwardedFor.split(',')[0]?.trim();
      if (first) return this.normalizeIp(first);
    }

    const ip = (req?.ip || req?.connection?.remoteAddress || '').toString();
    return this.normalizeIp(ip) || 'unknown';
  }

  getUserAgent(req: any) {
    const ua = this.getHeader(req, 'user-agent') || '';
    return ua.slice(0, 200);
  }

  getClientAsn(req: any) {
    const candidates = [
      this.getHeader(req, 'cf-asn'),
      this.getHeader(req, 'x-asn'),
      this.getHeader(req, 'fastly-client-asn'),
      this.getHeader(req, 'x-vercel-ip-asn'),
    ].filter(Boolean) as string[];

    for (const v of candidates) {
      const n = parseInt(String(v).trim(), 10);
      if (Number.isFinite(n) && n > 0) return String(n);
    }

    return undefined;
  }

  getNetworkKey(ip: string, asn?: string) {
    if (asn) return `asn:${asn}`;

    const ipVersion = net.isIP(ip);
    if (ipVersion === 4) {
      const parts = ip.split('.');
      if (parts.length === 4) return `ipv4:/24:${parts.slice(0, 3).join('.')}`;
      return `ipv4:${ip}`;
    }

    if (ipVersion === 6) {
      const parts = ip.split(':').filter(Boolean);
      if (parts.length >= 4) return `ipv6:/64:${parts.slice(0, 4).join(':')}`;
      return `ipv6:${ip}`;
    }

    return `ip:${ip}`;
  }

  isCoolingDown(key: string) {
    const until = this.cooldowns.get(key);
    if (!until) return 0;
    const remaining = until - this.now();
    if (remaining <= 0) {
      this.cooldowns.delete(key);
      return 0;
    }
    return remaining;
  }

  setCooldown(key: string, durationMs: number) {
    this.cooldowns.set(key, this.now() + durationMs);
  }

  clearCooldown(key: string) {
    this.cooldowns.delete(key);
  }

  increment(key: string, windowMs: number) {
    const now = this.now();
    const existing = this.counters.get(key);
    if (!existing || existing.expiresAt <= now) {
      const state: CounterState = { count: 1, expiresAt: now + windowMs };
      this.counters.set(key, state);
      return state;
    }
    existing.count += 1;
    return existing;
  }

  checkLimit(key: string, limit: number, windowMs: number) {
    const state = this.increment(key, windowMs);
    return state.count <= limit;
  }

  addDistinct(key: string, value: string, ttlMs: number) {
    const now = this.now();
    let bucket = this.distinct.get(key);
    if (!bucket) {
      bucket = new Map<string, number>();
      this.distinct.set(key, bucket);
    }

    for (const [k, exp] of bucket.entries()) {
      if (exp <= now) bucket.delete(k);
    }

    bucket.set(value, now + ttlMs);

    if (bucket.size > 500) {
      const entries = Array.from(bucket.entries()).sort((a, b) => a[1] - b[1]);
      for (let i = 0; i < entries.length - 300; i += 1) {
        bucket.delete(entries[i][0]);
      }
    }

    return bucket.size;
  }

  recordAuthSuccess(action: string, input: { ip: string; networkKey: string; accountKey?: string }) {
    this.clearCounter(`fail:${action}:ip:${input.ip}`);
    this.clearCounter(`fail:${action}:net:${input.networkKey}`);
    this.clearCooldown(`cd:${action}:ip:${input.ip}`);
    this.clearCooldown(`cd:${action}:net:${input.networkKey}`);

    if (input.accountKey) {
      this.clearCounter(`fail:${action}:acct:${input.accountKey}`);
      this.clearCooldown(`cd:${action}:acct:${input.accountKey}`);
    }
  }

  recordAuthFailure(action: string, input: { ip: string; networkKey: string; accountKey?: string }) {
    const windowMs = 15 * 60 * 1000;
    const cooldownMs = 10 * 60 * 1000;

    const ipState = this.increment(`fail:${action}:ip:${input.ip}`, windowMs);
    const netState = this.increment(`fail:${action}:net:${input.networkKey}`, windowMs);
    if (ipState.count >= 20 || netState.count >= 60) {
      this.setCooldown(`cd:${action}:ip:${input.ip}`, cooldownMs);
      this.setCooldown(`cd:${action}:net:${input.networkKey}`, cooldownMs);
    }

    if (input.accountKey) {
      const acctState = this.increment(`fail:${action}:acct:${input.accountKey}`, windowMs);
      if (acctState.count >= 6) {
        this.setCooldown(`cd:${action}:acct:${input.accountKey}`, cooldownMs);
      }
    }
  }

  recordLoginSuccess(input: { ip: string; networkKey: string; accountKey?: string }) {
    this.recordAuthSuccess('login', input);
  }

  recordLoginFailure(input: { ip: string; networkKey: string; accountKey?: string }) {
    this.recordAuthFailure('login', input);
  }

  clearCounter(key: string) {
    this.counters.delete(key);
  }

  getSnapshot(): AntiAbuseSnapshot {
    const now = this.now();
    this.purgeExpired(now);

    const counters = Array.from(this.counters.entries())
      .map(([key, state]) => ({
        key,
        count: state.count,
        expiresAt: state.expiresAt,
        remainingMs: Math.max(0, state.expiresAt - now),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const cooldowns = Array.from(this.cooldowns.entries())
      .map(([key, until]) => ({
        key,
        until,
        remainingMs: Math.max(0, until - now),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const distinct = Array.from(this.distinct.entries())
      .map(([key, bucket]) => ({ key, size: bucket.size }))
      .sort((a, b) => a.key.localeCompare(b.key));

    return {
      now,
      counters,
      cooldowns,
      distinct,
      totals: { counters: counters.length, cooldowns: cooldowns.length, distinctKeys: distinct.length },
    };
  }

  private purgeExpired(now: number) {
    for (const [key, state] of this.counters.entries()) {
      if (state.expiresAt <= now) this.counters.delete(key);
    }

    for (const [key, until] of this.cooldowns.entries()) {
      if (until <= now) this.cooldowns.delete(key);
    }

    for (const [key, bucket] of this.distinct.entries()) {
      for (const [v, exp] of bucket.entries()) {
        if (exp <= now) bucket.delete(v);
      }
      if (bucket.size === 0) this.distinct.delete(key);
    }
  }

  private normalizeIp(ip: string) {
    const cleaned = ip.trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('::ffff:')) return cleaned.replace('::ffff:', '');
    return cleaned;
  }

  private getHeader(req: any, name: string) {
    const v = req?.headers?.[name];
    if (Array.isArray(v)) return v[0];
    if (typeof v === 'string') return v;
    return v ? String(v) : '';
  }
}

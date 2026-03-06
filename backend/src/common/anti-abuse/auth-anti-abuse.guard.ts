import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AntiAbuseService } from './anti-abuse.service';

type AntiAbuseAction = 'login' | 'register' | 'forgot' | 'reset' | 'oauth_google' | 'oauth_apple';

const ANTI_ABUSE_ACTION = 'antiAbuseAction';

export const AntiAbuse = (action: AntiAbuseAction) => SetMetadata(ANTI_ABUSE_ACTION, action);

type AuthContext = {
  action: AntiAbuseAction;
  ip: string;
  networkKey: string;
  ua: string;
  accountKey?: string;
};

@Injectable()
export class AuthAntiAbuseGuard implements CanActivate {
  constructor(
    private readonly antiAbuse: AntiAbuseService,
    private readonly reflector: Reflector,
  ) { }

  canActivate(context: ExecutionContext) {
    if (!this.isEnabled()) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    const action = this.getAction(context);
    const ip = this.antiAbuse.getClientIp(req);
    const ua = this.antiAbuse.getUserAgent(req);
    const asn = this.antiAbuse.getClientAsn(req);
    const networkKey = this.antiAbuse.getNetworkKey(ip, asn);

    const email = (req?.body?.email || '').toString().trim().toLowerCase();
    const accountKey = email ? this.antiAbuse.hash(email) : undefined;

    const ctx: AuthContext = {
      action,
      ip,
      networkKey,
      ua,
      accountKey: action === 'reset' || action === 'oauth_google' || action === 'oauth_apple' ? undefined : accountKey,
    };

    this.assertNotCoolingDown(ctx);
    this.applyRateLimits(ctx);
    this.applyStuffingDetection(ctx);

    return true;
  }

  private isEnabled() {
    const raw = process.env.AUTH_ANTI_ABUSE_ENABLED;
    if (raw === undefined) return true;
    return ['true', '1', 'yes', 'on'].includes(String(raw).toLowerCase());
  }

  private getAction(context: ExecutionContext): AntiAbuseAction {
    const action = this.reflector.getAllAndOverride<AntiAbuseAction>(ANTI_ABUSE_ACTION, [
      context.getHandler(),
      context.getClass(),
    ]);
    return action || 'login';
  }

  private assertNotCoolingDown(ctx: AuthContext) {
    const blocked =
      this.antiAbuse.isCoolingDown(`cd:${ctx.action}:ip:${ctx.ip}`) ||
      this.antiAbuse.isCoolingDown(`cd:${ctx.action}:net:${ctx.networkKey}`) ||
      (ctx.accountKey ? this.antiAbuse.isCoolingDown(`cd:${ctx.action}:acct:${ctx.accountKey}`) : 0);

    if (blocked) {
      throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private applyRateLimits(ctx: AuthContext) {
    const config = this.getConfig(ctx.action);
    const okIp = this.antiAbuse.checkLimit(`rl:${ctx.action}:ip:${ctx.ip}`, config.ipLimit, config.windowMs);
    if (!okIp) throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);

    const okNet = this.antiAbuse.checkLimit(`rl:${ctx.action}:net:${ctx.networkKey}`, config.netLimit, config.windowMs);
    if (!okNet) throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);

    if (ctx.accountKey && config.acctLimit) {
      const okAcct = this.antiAbuse.checkLimit(`rl:${ctx.action}:acct:${ctx.accountKey}`, config.acctLimit, config.windowMs);
      if (!okAcct) throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const okIpUa = this.antiAbuse.checkLimit(`rl:${ctx.action}:ipua:${ctx.ip}:${this.antiAbuse.hash(ctx.ua)}`, config.ipUaLimit, config.windowMs);
    if (!okIpUa) throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
  }

  private applyStuffingDetection(ctx: AuthContext) {
    const config = this.getConfig(ctx.action);
    if (!config.stuffing) return;
    if (!ctx.accountKey) return;

    const distinctOnNet = this.antiAbuse.addDistinct(`ds:${ctx.action}:net:${ctx.networkKey}`, ctx.accountKey, config.windowMs);
    if (distinctOnNet > config.stuffing.netDistinctLimit) {
      this.antiAbuse.setCooldown(`cd:${ctx.action}:net:${ctx.networkKey}`, config.stuffing.cooldownMs);
      this.antiAbuse.setCooldown(`cd:${ctx.action}:ip:${ctx.ip}`, config.stuffing.cooldownMs);
      throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const uaKey = this.antiAbuse.hash(ctx.ua);
    const distinctOnNetUa = this.antiAbuse.addDistinct(`ds:${ctx.action}:netua:${ctx.networkKey}:${uaKey}`, ctx.accountKey, config.windowMs);
    if (distinctOnNetUa > config.stuffing.netUaDistinctLimit) {
      this.antiAbuse.setCooldown(`cd:${ctx.action}:net:${ctx.networkKey}`, config.stuffing.cooldownMs);
      throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private getConfig(action: AntiAbuseAction) {
    if (action === 'login') {
      return {
        windowMs: 10 * 60 * 1000,
        ipLimit: 30,
        netLimit: 120,
        acctLimit: 12,
        ipUaLimit: 60,
        stuffing: { netDistinctLimit: 25, netUaDistinctLimit: 18, cooldownMs: 30 * 60 * 1000 },
      };
    }

    if (action === 'register') {
      return {
        windowMs: 30 * 60 * 1000,
        ipLimit: 10,
        netLimit: 30,
        acctLimit: 3,
        ipUaLimit: 20,
        stuffing: { netDistinctLimit: 20, netUaDistinctLimit: 12, cooldownMs: 30 * 60 * 1000 },
      };
    }

    if (action === 'forgot') {
      return {
        windowMs: 15 * 60 * 1000,
        ipLimit: 20,
        netLimit: 60,
        acctLimit: 3,
        ipUaLimit: 40,
        stuffing: { netDistinctLimit: 25, netUaDistinctLimit: 18, cooldownMs: 30 * 60 * 1000 },
      };
    }

    if (action === 'reset') {
      return {
        windowMs: 15 * 60 * 1000,
        ipLimit: 15,
        netLimit: 45,
        ipUaLimit: 30,
        stuffing: undefined,
        acctLimit: undefined,
      };
    }

    return {
      windowMs: 10 * 60 * 1000,
      ipLimit: 30,
      netLimit: 100,
      ipUaLimit: 60,
      stuffing: undefined,
      acctLimit: undefined,
    };
  }
}

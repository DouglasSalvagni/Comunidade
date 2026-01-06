import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { Partnership } from './entities/partnership.entity';
import { UserActiveCoupon } from './entities/user-active-coupon.entity';

@Injectable()
export class SubscriptionsCouponsService {
  constructor(
    @InjectRepository(Partnership)
    private readonly partnershipRepository: Repository<Partnership>,
    @InjectRepository(UserActiveCoupon)
    private readonly userActiveCouponRepository: Repository<UserActiveCoupon>,
  ) { }

  async getActiveCoupon(userId: string): Promise<UserActiveCoupon | null> {
    const now = new Date();
    const coupon = await this.userActiveCouponRepository.findOne({
      where: {
        userId,
        status: In(['ACTIVE', 'PENDING_CHECKOUT']),
      },
      relations: ['partnership'],
      order: { createdAt: 'DESC' },
    });

    if (!coupon) {
      return null;
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      coupon.status = 'EXPIRED';
      await this.userActiveCouponRepository.save(coupon);
      return null;
    }

    return coupon;
  }

  async activateCoupon(userId: string, code: string): Promise<UserActiveCoupon> {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (!normalizedCode) {
      throw new BadRequestException('Código inválido');
    }

    const partnership = await this.partnershipRepository.findOne({
      where: { code: normalizedCode },
    });
    if (!partnership) {
      throw new NotFoundException('Cupom não encontrado');
    }
    if (partnership.status !== 'ACTIVE') {
      throw new ConflictException('Cupom inativo');
    }

    const now = new Date();
    if (partnership.startsAt && partnership.startsAt > now) {
      throw new ConflictException('Cupom fora da vigência');
    }
    if (partnership.endsAt && partnership.endsAt < now) {
      throw new ConflictException('Cupom expirado');
    }

    if (partnership.maxRedemptions) {
      const usedCount = await this.userActiveCouponRepository.count({
        where: { partnershipId: partnership.id, status: 'USED' },
      });
      if (usedCount >= partnership.maxRedemptions) {
        throw new ConflictException('Cupom esgotado');
      }
    }

    await this.cancelActiveCoupon(userId);

    const newCoupon = this.userActiveCouponRepository.create({
      userId,
      partnershipId: partnership.id,
      status: 'ACTIVE',
      activatedAt: now,
      expiresAt: partnership.endsAt || null,
      usedAt: null,
      lastCheckoutId: null,
      snapshotDiscountType: partnership.discountType,
      snapshotDiscountValue: partnership.discountValue,
      snapshotSplitsJson: null,
    });

    const saved = await this.userActiveCouponRepository.save(newCoupon);
    return this.userActiveCouponRepository.findOne({
      where: { id: saved.id },
      relations: ['partnership'],
    }) as Promise<UserActiveCoupon>;
  }

  async cancelActiveCoupon(userId: string): Promise<void> {
    const coupons = await this.userActiveCouponRepository.find({
      where: {
        userId,
        status: In(['ACTIVE', 'PENDING_CHECKOUT']),
      },
    });

    if (coupons.length === 0) {
      return;
    }

    for (const c of coupons) {
      c.status = 'CANCELLED';
    }
    await this.userActiveCouponRepository.save(coupons);
  }

  async markPendingCheckout(userId: string, checkoutId: string, snapshotSplits: any): Promise<UserActiveCoupon | null> {
    const coupon = await this.getActiveCoupon(userId);
    if (!coupon) {
      return null;
    }

    if (coupon.status === 'PENDING_CHECKOUT' && coupon.lastCheckoutId) {
      throw new ConflictException('Checkout pendente');
    }

    coupon.status = 'PENDING_CHECKOUT';
    coupon.lastCheckoutId = checkoutId;
    coupon.snapshotSplitsJson = snapshotSplits;

    return this.userActiveCouponRepository.save(coupon);
  }

  async markActiveAfterCheckoutFailure(userId: string): Promise<void> {
    const coupon = await this.userActiveCouponRepository.findOne({
      where: { userId, status: 'PENDING_CHECKOUT' },
      order: { updatedAt: 'DESC' },
    });
    if (!coupon) {
      return;
    }

    coupon.status = 'ACTIVE';
    coupon.lastCheckoutId = null;
    await this.userActiveCouponRepository.save(coupon);
  }

  async markUsedByUser(userId: string): Promise<void> {
    const coupon = await this.userActiveCouponRepository.findOne({
      where: {
        userId,
        status: In(['ACTIVE', 'PENDING_CHECKOUT']),
      },
      order: { updatedAt: 'DESC' },
    });
    if (!coupon) {
      return;
    }

    if (coupon.status === 'USED') {
      return;
    }

    coupon.status = 'USED';
    coupon.usedAt = new Date();
    await this.userActiveCouponRepository.save(coupon);
  }
}


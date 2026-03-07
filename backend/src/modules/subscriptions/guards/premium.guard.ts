import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private subscriptionsService: SubscriptionsService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const isValid = await this.subscriptionsService.isSubscriptionValid(userId);

    if (!isValid) {
      throw new ForbiddenException('Assinatura premium ativa necessária ou pagamento pendente');
    }

    return true;
  }
}

export interface IPaymentGateway {
  /**
   * Nome do gateway (asaas, stripe, etc)
   */
  readonly name: string;

  /**
   * Cria um link de pagamento para checkout
   * @param userId ID do usuário local
   * @param planValue Valor do plano em reais
   * @param cycle Ciclo de cobrança (MONTHLY, YEARLY)
   * @param planName Nome do plano
   * @param planDescription Descrição do plano
   */
  createCheckoutLink(
    userId: string,
    planValue: number,
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY',
    planName: string,
    planDescription: string,
    options?: {
      splits?: Array<{ walletId: string; fixedValue?: number; percentageValue?: number }>;
    },
  ): Promise<{ checkoutUrl: string; checkoutId: string }>;

  cancelCheckout?(checkoutId: string): Promise<void>;

  /**
   * Busca pagamentos de uma subscription no gateway
   * @param subscriptionId ID da subscription no gateway
   */
  getSubscriptionPayments?(subscriptionId: string): Promise<any>;

  /**
   * Cancela uma subscription no gateway
   * @param subscriptionId ID da subscription no gateway
   */
  cancelSubscription?(subscriptionId: string): Promise<void>;
}

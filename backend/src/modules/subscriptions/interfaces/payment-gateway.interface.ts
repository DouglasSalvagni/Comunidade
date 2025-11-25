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
    cycle: 'MONTHLY' | 'YEARLY',
    planName: string,
    planDescription: string,
  ): Promise<{ checkoutUrl: string; checkoutId: string }>;

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

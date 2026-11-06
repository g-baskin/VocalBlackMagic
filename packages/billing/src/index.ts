/** Planning interfaces only — NO payments or balances are processed. */
export type ProductId = 'vocal-fix' | 'ttb-studio';
export interface CreditLedgerEntry {
  id: string;
  tenantId: string;
  product: ProductId;
  delta: number;
  reason: string;
  idempotencyKey: string;
  createdAt: string;
}
export interface SubscriptionEntitlement {
  tenantId: string;
  planId: string;
  active: boolean;
  monthlyCredits: number;
}

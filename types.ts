
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  DEBT = 'DEBT',
  DEBT_PAYMENT = 'DEBT_PAYMENT'
}

export interface BusinessAccount {
  id: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  counterparty: string;
  description: string;
  date: string;
}

export interface Profile {
  id: string;
  business_name: string; // Default or primary business name
  currency: string;
  active_account_id?: string;
}

export interface AIResponse {
  intent: 'RECORD' | 'QUERY' | 'UNKNOWN';
  transaction?: {
    type: TransactionType;
    amount: number;
    category: string;
    counterparty: string;
    description: string;
  };
  query_answer?: string;
}

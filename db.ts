
import { Transaction, Profile, TransactionType, BusinessAccount } from "./types";

const STORAGE_KEY_TRANSACTIONS = "kazi_transactions_v2";
const STORAGE_KEY_ACCOUNTS = "kazi_accounts";
const STORAGE_KEY_PROFILE = "kazi_profile_v2";

const DEFAULT_ACCOUNTS: BusinessAccount[] = [
  { id: "default-1", name: "My Business", currency: "UGX", created_at: new Date().toISOString() }
];

export const db = {
  getAccounts: (): BusinessAccount[] => {
    const data = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    return data ? JSON.parse(data) : DEFAULT_ACCOUNTS;
  },

  saveAccount: (account: Omit<BusinessAccount, "id" | "created_at">): BusinessAccount => {
    const accounts = db.getAccounts();
    const newAcc: BusinessAccount = {
      ...account,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    accounts.push(newAcc);
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    return newAcc;
  },

  updateAccount: (id: string, data: Partial<Omit<BusinessAccount, "id" | "created_at">>): BusinessAccount => {
    const accounts = db.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Account not found");
    
    accounts[index] = { ...accounts[index], ...data };
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    return accounts[index];
  },

  deleteAccount: (id: string) => {
    const accounts = db.getAccounts();
    if (accounts.length <= 1) throw new Error("Cannot delete the only remaining account");
    const filtered = accounts.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(filtered));
    
    // Also cleanup transactions for this account
    db.clearTransactions(id);
    return filtered[0];
  },

  getTransactions: (accountId: string): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const allTxs: Transaction[] = data ? JSON.parse(data) : [];
    return allTxs.filter(t => t.account_id === accountId);
  },

  clearTransactions: (accountId: string) => {
    const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const allTxs: Transaction[] = data ? JSON.parse(data) : [];
    const filtered = allTxs.filter(t => t.account_id !== accountId);
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(filtered));
  },

  saveTransaction: (transaction: Omit<Transaction, "id" | "user_id" | "account_id">, accountId: string, userId: string = "demo-user"): Transaction => {
    const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const allTxs: Transaction[] = data ? JSON.parse(data) : [];
    const newTx: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      user_id: userId,
      account_id: accountId,
    };
    allTxs.unshift(newTx);
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(allTxs));
    return newTx;
  },

  getProfile: (): Profile => {
    const data = localStorage.getItem(STORAGE_KEY_PROFILE);
    const accounts = db.getAccounts();
    const defaultProfile = { 
      id: "1", 
      business_name: accounts[0].name, 
      currency: accounts[0].currency,
      active_account_id: accounts[0].id
    };
    return data ? JSON.parse(data) : defaultProfile;
  },

  updateProfile: (profile: Profile) => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  },

  getStats: (accountId: string, timeframe: 'today' | 'weekly' | 'monthly' = 'today') => {
    const txs = db.getTransactions(accountId);
    const now = new Date();
    
    const isToday = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toDateString() === now.toDateString();
    };

    const isThisWeek = (dateStr: string) => {
      const d = new Date(dateStr);
      const diff = now.getTime() - d.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    };

    const isThisMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const filterFn = timeframe === 'today' ? isToday : timeframe === 'weekly' ? isThisWeek : isThisMonth;
    
    const filteredTxs = txs.filter(t => filterFn(t.date));
    
    const inflow = filteredTxs.filter(t => t.type === TransactionType.INCOME || t.type === TransactionType.DEBT_PAYMENT)
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    const outflow = filteredTxs.filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const netDebt = txs.reduce((acc, curr) => {
      if (curr.type === TransactionType.DEBT) return acc + curr.amount;
      if (curr.type === TransactionType.DEBT_PAYMENT) return acc - curr.amount;
      return acc;
    }, 0);

    return { inflow, outflow, profit: inflow - outflow, debt: netDebt };
  }
};

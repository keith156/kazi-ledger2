
import { auth, db as firestore, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Transaction, Profile, TransactionType, BusinessAccount } from "./types";

const generateId = () => crypto.randomUUID();

export const dbInit = async () => {
    // Basic connectivity check handled by firebase initialization
};

export const db = {
  getAccounts: async (userId: string): Promise<BusinessAccount[]> => {
    try {
      const q = query(collection(firestore, 'accounts'), where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      const accounts: BusinessAccount[] = [];
      snapshot.forEach(doc => {
        accounts.push({ id: doc.id, ...doc.data() } as BusinessAccount);
      });
      return accounts;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'accounts');
      return [];
    }
  },

  subscribeToAccounts: (userId: string, callback: (accounts: BusinessAccount[]) => void) => {
    const q = query(collection(firestore, 'accounts'), where('ownerId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const accounts: BusinessAccount[] = [];
      snapshot.forEach(doc => accounts.push({ id: doc.id, ...doc.data() } as BusinessAccount));
      callback(accounts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'accounts');
    });
  },

  saveAccount: async (account: Omit<BusinessAccount, "id" | "created_at">, userId: string): Promise<BusinessAccount> => {
    try {
      const id = generateId();
      const newAcc = {
        ownerId: userId,
        name: account.name,
        currency: account.currency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, 'accounts', id), newAcc);
      return { id, created_at: new Date().toISOString(), name: account.name, currency: account.currency };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `accounts`);
      throw error;
    }
  },

  updateAccount: async (id: string, data: Partial<Omit<BusinessAccount, "id" | "created_at">>, userId: string): Promise<void> => {
    try {
      await updateDoc(doc(firestore, 'accounts', id), {
        name: data.name,
        currency: data.currency,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `accounts/${id}`);
      throw error;
    }
  },

  deleteAccount: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, 'accounts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `accounts/${id}`);
      throw error;
    }
  },

  subscribeToTransactions: (accountId: string, userId: string, callback: (txs: Transaction[]) => void) => {
    const q = Object.keys(firestore).length ? query(collection(firestore, `accounts/${accountId}/transactions`), where('ownerId', '==', userId)) : null;
    if (!q) return () => {};
    return onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        txs.push({ ...data, id: doc.id } as Transaction);
      });
      // Sort by date desc locally since we can't do complex querying easily without index
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `accounts/${accountId}/transactions`);
    });
  },

  saveTransaction: async (transaction: Omit<Transaction, "id" | "user_id" | "account_id">, accountId: string, userId: string): Promise<void> => {
    try {
      const id = generateId();
      const newTx = {
        ownerId: userId,
        accountId: accountId,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        counterparty: transaction.counterparty,
        description: transaction.description,
        date: transaction.date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(firestore, `accounts/${accountId}/transactions`, id), newTx);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `accounts/${accountId}/transactions`);
      throw error;
    }
  },

  getProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const docRef = doc(firestore, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: userId,
          business_name: data.business_name,
          currency: data.currency,
          active_account_id: data.active_account_id
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      return null;
    }
  },

  saveProfile: async (profile: Profile, userId: string): Promise<void> => {
      try {
          const newProf = {
            userId: userId,
            business_name: profile.business_name,
            currency: profile.currency,
            active_account_id: profile.active_account_id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(doc(firestore, 'users', userId), newProf);
      } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${userId}`);
          throw error;
      }
  },

  updateProfile: async (profile: Profile, userId: string): Promise<void> => {
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        business_name: profile.business_name,
        currency: profile.currency,
        active_account_id: profile.active_account_id,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  getStats: (txs: Transaction[], timeframe: 'today' | 'weekly' | 'monthly' = 'today') => {
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


import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, UserCircle, ReceiptText } from 'lucide-react';

interface HistoryListProps {
  transactions: Transaction[];
  currency: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({ transactions, currency }) => {
  const format = (val: number) => new Intl.NumberFormat().format(val);

  if (transactions.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-64 opacity-60">
        <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center text-center w-full">
          <ReceiptText className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-slate-600 font-medium">No records yet.</p>
          <p className="text-slate-400 text-xs mt-1 italic">Try typing "Sold a shirt for 20k" below.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-32 animate-slide-up">
      <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Recent Transactions</h2>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div 
            key={tx.id} 
            className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                tx.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' :
                tx.type === TransactionType.EXPENSE ? 'bg-rose-50 text-rose-600' :
                'bg-indigo-50 text-indigo-600'
              }`}>
                {tx.type === TransactionType.INCOME && <ArrowUpRight className="w-6 h-6" />}
                {tx.type === TransactionType.EXPENSE && <ArrowDownLeft className="w-6 h-6" />}
                {(tx.type === TransactionType.DEBT || tx.type === TransactionType.DEBT_PAYMENT) && <UserCircle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 leading-tight">{tx.description}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {tx.category} • {tx.counterparty || 'General'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${
                tx.type === TransactionType.INCOME ? 'text-emerald-600' :
                tx.type === TransactionType.EXPENSE ? 'text-rose-600' :
                'text-indigo-600'
              }`}>
                {tx.type === TransactionType.EXPENSE ? '-' : '+'}{currency} {format(tx.amount)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

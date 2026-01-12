
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';

interface BentoGridProps {
  stats: {
    inflow: number;
    outflow: number;
    profit: number;
    debt: number;
  };
  currency: string;
  timeframe: 'today' | 'weekly' | 'monthly';
}

export const BentoGrid: React.FC<BentoGridProps> = ({ stats, currency, timeframe }) => {
  const format = (val: number) => new Intl.NumberFormat().format(val);
  
  const label = timeframe === 'today' ? "Today's" : timeframe === 'weekly' ? "Weekly" : "Monthly";

  const renderStatCard = (
    title: string, 
    value: number, 
    bgColor: string, 
    borderColor: string, 
    icon: React.ReactNode, 
    textColor: string,
    valueColor: string,
    iconBgColor: string,
    isIndigo: boolean = false
  ) => {
    const formattedValue = format(value);
    const valueLength = formattedValue.length + currency.length;
    // Dynamic font size based on length to prevent overflow for large numbers
    const fontSize = valueLength > 12 ? 'text-lg' : valueLength > 8 ? 'text-xl' : 'text-2xl';

    return (
      <div className={`${bgColor} ${borderColor} p-4 rounded-3xl flex flex-col justify-between h-40 shadow-sm transition-transform active:scale-95 overflow-hidden`}>
        <div className={`${isIndigo ? 'bg-white/25' : iconBgColor} w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors`}>
          {icon}
        </div>
        <div className="mt-2">
          <p className={`${textColor} text-[10px] font-bold uppercase tracking-wider truncate mb-0.5`}>{title}</p>
          <h3 className={`${fontSize} font-black ${valueColor} leading-tight break-all`}>
            <span className="text-[10px] font-bold opacity-70 mr-0.5">{currency}</span>
            {formattedValue}
          </h3>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-4 animate-slide-up">
      {renderStatCard(
        `${label} Inflow`, 
        stats.inflow, 
        "bg-emerald-50", 
        "border border-emerald-100", 
        <TrendingUp className="text-emerald-700 w-6 h-6 stroke-[2.5px]" />, 
        "text-emerald-700", 
        "text-emerald-900",
        "bg-emerald-100"
      )}
      
      {renderStatCard(
        `${label} Outflow`, 
        stats.outflow, 
        "bg-rose-50", 
        "border border-rose-100", 
        <TrendingDown className="text-rose-700 w-6 h-6 stroke-[2.5px]" />, 
        "text-rose-700", 
        "text-rose-900",
        "bg-rose-100"
      )}

      {renderStatCard(
        `${label} Profit`, 
        stats.profit, 
        "bg-indigo-600", 
        "border-transparent", 
        <Wallet className="text-white w-6 h-6 stroke-[2.5px]" />, 
        "text-indigo-100", 
        "text-white",
        "bg-white/20",
        true
      )}

      {renderStatCard(
        `Total Debt`, 
        stats.debt, 
        "bg-white", 
        "border border-slate-200", 
        <Users className="text-indigo-600 w-6 h-6 stroke-[2.5px]" />, 
        "text-slate-500", 
        "text-slate-900",
        "bg-indigo-50"
      )}
    </div>
  );
};


import React from 'react';
import { Sparkles, ShieldCheck, Mic, Camera, LayoutDashboard, ArrowRight, Zap, Lock, Globe } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center overflow-x-hidden">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-6 w-full text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="inline-flex items-center space-x-2 bg-white border border-indigo-100 px-4 py-2 rounded-full mb-6 shadow-sm animate-slide-up">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">The Future of Accounting</span>
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[0.9] mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Kazi <span className="text-indigo-600">Ledger</span>
        </h1>
        
        <p className="text-lg text-slate-600 font-medium max-w-sm mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Accounting that understands you. Record transactions just by talking or typing naturally.
        </p>
      </section>

      {/* Bento Feature Grid */}
      <section className="px-6 pb-12 w-full max-w-md space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Feature 1: AI Power */}
          <div className="col-span-2 bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Voice First</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Simply say "Sold 5 shirts for 50k" or "Paid rent 200k". Kazi handles the rest.
            </p>
          </div>

          {/* Feature 2: Vision */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-5 shadow-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Receipt Scan</h3>
            <p className="text-slate-500 text-[11px] leading-tight mt-1">
              Snap a photo and Kazi extracts amounts instantly.
            </p>
          </div>

          {/* Feature 3: Insights */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-5 shadow-sm animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Daily Insights</h3>
            <p className="text-slate-500 text-[11px] leading-tight mt-1">
              AI-driven tips to grow your business profit.
            </p>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden animate-slide-up shadow-2xl" style={{ animationDelay: '0.6s' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-500 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Bank-Grade Privacy</h3>
          </div>
          
          <ul className="space-y-4">
            <li className="flex items-start space-x-3">
              <div className="bg-white/10 p-1 rounded-full mt-0.5">
                <Lock className="w-3 h-3 text-indigo-300" />
              </div>
              <p className="text-sm text-slate-300">
                <span className="font-bold text-white">Local Storage:</span> Your financial data never leaves your device unless you choose to sync.
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="bg-white/10 p-1 rounded-full mt-0.5">
                <Globe className="w-3 h-3 text-indigo-300" />
              </div>
              <p className="text-sm text-slate-300">
                <span className="font-bold text-white">Anonymous AI:</span> We use Google Gemini to process sentences without storing your personal info.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section className="px-8 pb-32 w-full max-w-md">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">How it works</h4>
        <div className="space-y-10 relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
          
          {[
            { step: 1, title: "Tell Kazi what happened", desc: "Type or speak like you're texting a friend.", icon: Mic },
            { step: 2, title: "AI Parses the data", desc: "Amount, Category, and Counterparty are extracted in 0.5s.", icon: Zap },
            { step: 3, title: "Review & Save", desc: "Confirm the details and see your dashboard update instantly.", icon: LayoutDashboard },
          ].map((item, i) => (
            <div key={i} className="flex items-start space-x-6 relative z-10 animate-slide-up" style={{ animationDelay: `${0.7 + (i * 0.1)}s` }}>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-md flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h5 className="font-bold text-slate-800 text-base leading-none mb-1">{item.title}</h5>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-50/80 backdrop-blur-xl border-t border-slate-200/50 safe-pb">
        <button 
          onClick={onStart}
          className="w-full max-w-md mx-auto py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-3"
        >
          <span>Get Started</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

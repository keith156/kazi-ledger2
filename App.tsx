
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './db.ts';
import { supabase, isSupabaseConfigured } from './supabase.ts';
import { Transaction, Profile, TransactionType, BusinessAccount } from './types.ts';
import { BentoGrid } from './components/BentoGrid.tsx';
import { HistoryList } from './components/HistoryList.tsx';
import { CommandBar } from './components/CommandBar.tsx';
import { AIInsights } from './components/AIInsights.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { Auth } from './components/Auth.tsx';
import { generateInsights } from './geminiService.ts';
import { Settings, BarChart3, LayoutDashboard, Search, ChevronDown, Plus, X, Building2, Save, Trash2, Info, LogOut, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [hasStarted, setHasStarted] = useState(() => {
    return localStorage.getItem('kazi_has_started') === 'true';
  });
  
  const [accounts, setAccounts] = useState<BusinessAccount[]>(db.getAccounts());
  const [profile, setProfile] = useState<Profile>(db.getProfile());
  const [currentAccount, setCurrentAccount] = useState<BusinessAccount>(
    accounts.find(a => a.id === profile.active_account_id) || accounts[0]
  );
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [stats, setStats] = useState(db.getStats(currentAccount.id, timeframe));
  const [view, setView] = useState<'dashboard' | 'debts'>('dashboard');
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountCurrency, setNewAccountCurrency] = useState("UGX");

  const [editName, setEditName] = useState(currentAccount.name);
  const [editCurrency, setEditCurrency] = useState(currentAccount.currency);

  useEffect(() => {
    if (!supabase) {
        setAuthChecking(false);
        return;
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecking(false);
    }).catch(err => {
        console.error("Auth session error:", err);
        setAuthChecking(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasStarted || !session) return;
    const txs = db.getTransactions(currentAccount.id);
    setTransactions(txs);
    setStats(db.getStats(currentAccount.id, timeframe));
    setEditName(currentAccount.name);
    setEditCurrency(currentAccount.currency);
  }, [currentAccount, timeframe, hasStarted, session]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!hasStarted || !session || transactions.length === 0) {
        setInsights([]);
        return;
      }
      setLoadingInsights(true);
      const context = `Business: ${currentAccount.name}. Currency: ${currentAccount.currency}. Timeframe: ${timeframe}. 
        Stats: Inflow ${stats.inflow}, Outflow ${stats.outflow}, Debt ${stats.debt}. 
        Sample Transactions: ${transactions.slice(0, 5).map(t => `${t.description} (${t.amount})`).join(', ')}`;
      
      const newInsights = await generateInsights(context);
      setInsights(newInsights);
      setLoadingInsights(false);
    };

    const timeoutId = setTimeout(fetchInsights, 500);
    return () => clearTimeout(timeoutId);
  }, [transactions.length, timeframe, currentAccount.id, hasStarted, session]);

  const handleStart = () => {
    setHasStarted(true);
    localStorage.setItem('kazi_has_started', 'true');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsSettingsOpen(false);
  };

  const handleNewRecord = (txData: Omit<Transaction, "id" | "user_id" | "account_id">) => {
    db.saveTransaction(txData, currentAccount.id, session?.user?.id || "demo-user");
    const updatedTxs = db.getTransactions(currentAccount.id);
    setTransactions(updatedTxs);
    setStats(db.getStats(currentAccount.id, timeframe));
  };

  const switchAccount = (account: BusinessAccount) => {
    setCurrentAccount(account);
    setProfile(prev => {
      const updated = { ...prev, active_account_id: account.id };
      db.updateProfile(updated);
      return updated;
    });
    setIsAccountMenuOpen(false);
  };

  const createNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    
    const newAcc = db.saveAccount({ name: newAccountName, currency: newAccountCurrency });
    setAccounts(db.getAccounts());
    switchAccount(newAcc);
    setIsAddingAccount(false);
    setNewAccountName("");
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db.updateAccount(currentAccount.id, { name: editName, currency: editCurrency });
    setCurrentAccount(updated);
    setAccounts(db.getAccounts());
    setIsSettingsOpen(false);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear ALL transaction history for this business? This cannot be undone.")) {
      db.clearTransactions(currentAccount.id);
      setTransactions([]);
      setStats(db.getStats(currentAccount.id, timeframe));
      setIsSettingsOpen(false);
    }
  };

  const handleDeleteAccount = () => {
    if (accounts.length <= 1) {
      alert("You must have at least one business ledger. Create a new one before deleting this one.");
      return;
    }
    if (confirm(`Are you sure you want to delete "${currentAccount.name}" and all its data? This action is permanent.`)) {
      const nextAcc = db.deleteAccount(currentAccount.id);
      setAccounts(db.getAccounts());
      switchAccount(nextAcc);
      setIsSettingsOpen(false);
    }
  };

  const contextString = useMemo(() => {
    return `Business: ${currentAccount.name}. Stats: Inflow ${stats.inflow}, Outflow ${stats.outflow}. Debt: ${stats.debt}. Recent tx: ${transactions.slice(0, 3).map(t => t.description).join(", ")}.`;
  }, [currentAccount, stats, transactions]);

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (view === 'debts') {
      list = list.filter(t => t.type === TransactionType.DEBT || t.type === TransactionType.DEBT_PAYMENT);
    } else {
      const now = new Date();
      list = list.filter(t => {
        const d = new Date(t.date);
        if (timeframe === 'today') return d.toDateString() === now.toDateString();
        if (timeframe === 'weekly') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        if (timeframe === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      });
    }
    return list;
  }, [transactions, view, timeframe]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasStarted) {
    return <LandingPage onStart={handleStart} />;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden ring-1 ring-slate-200">
      {/* Header */}
      <header className="glass sticky top-0 z-40 safe-pt border-b border-slate-200/50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="relative">
            <button 
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex flex-col items-start group active:scale-95 transition-all"
            >
              <h1 className="text-xl font-extrabold text-indigo-600 tracking-tight flex items-center">
                {currentAccount.name}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kazi Ledger • {currentAccount.currency}</p>
            </button>

            {/* Account Switcher Menu */}
            {isAccountMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsAccountMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 z-20 py-3 animate-slide-up overflow-hidden">
                  <div className="px-4 py-2 mb-2 border-b border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch Business</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto no-scrollbar">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => switchAccount(acc)}
                        className={`w-full px-4 py-3 flex items-center space-x-3 transition-colors ${
                          currentAccount.id === acc.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Building2 className={`w-5 h-5 ${currentAccount.id === acc.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div className="text-left">
                          <p className="text-sm font-bold leading-none">{acc.name}</p>
                          <p className="text-[10px] opacity-70 mt-1">{acc.currency}</p>
                        </div>
                        {currentAccount.id === acc.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => { setIsAccountMenuOpen(false); setIsAddingAccount(true); }}
                    className="w-full px-4 py-4 flex items-center space-x-3 text-indigo-600 font-bold text-sm border-t border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Add New Business</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 active:scale-95 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        {/* Simple Tabs */}
        <div className="px-4 pb-2 flex space-x-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-bold transition-all ${
              view === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setView('debts')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-bold transition-all ${
              view === 'debts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Debt Tracking</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-4 no-scrollbar">
        {view === 'dashboard' && (
          <>
            {/* Timeframe Selector */}
            <div className="px-4 mb-2 flex items-center justify-between">
              <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                {(['today', 'weekly', 'monthly'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${
                      timeframe === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <BentoGrid stats={stats} currency={currentAccount.currency} timeframe={timeframe} />
            
            {/* AI Insights Section */}
            <AIInsights insights={insights} loading={loadingInsights} />
            
            <HistoryList transactions={filteredTransactions} currency={currentAccount.currency} />
          </>
        )}
        
        {view === 'debts' && (
          <div className="animate-slide-up">
            <div className="p-4 bg-indigo-50 border-y border-indigo-100 mb-4 flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-xs font-bold uppercase">Outstanding Debt</p>
                <h3 className="text-2xl font-bold text-indigo-900">{currentAccount.currency} {new Intl.NumberFormat().format(stats.debt)}</h3>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Search className="w-6 h-6" />
              </div>
            </div>
            <HistoryList transactions={filteredTransactions} currency={currentAccount.currency} />
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center glass p-0 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl border border-slate-100 p-8 animate-slide-up relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
                <Settings className="w-6 h-6 mr-3 text-indigo-600" />
                Settings
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
              <form onSubmit={handleUpdateAccount} className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                      <Building2 className="w-3 h-3 mr-1" /> Business Profile
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Business Name</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-all font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Currency</label>
                        <select 
                          value={editCurrency}
                          onChange={(e) => setEditCurrency(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-all font-bold text-slate-800 appearance-none"
                        >
                          <option value="UGX">UGX - Ugandan Shilling</option>
                          <option value="KES">KES - Kenyan Shilling</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="TZS">TZS - Tanzanian Shilling</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-4 flex items-center">
                      <Trash2 className="w-3 h-3 mr-1" /> Data Management
                    </p>
                    <div className="space-y-3">
                      <button 
                        type="button"
                        onClick={handleClearHistory}
                        className="w-full py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        <span>Clear History</span>
                      </button>
                      <button 
                        type="button"
                        onClick={handleDeleteAccount}
                        className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md shadow-rose-100"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Delete Business Ledger</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100">
                     <div className="flex items-start space-x-3">
                        <Info className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-indigo-900 mb-1">Account Info</p>
                          <p className="text-[11px] text-indigo-700/80 font-medium">
                            {session 
                              ? `Logged in as ${session.user.email}. All data is secured in your account.` 
                              : "No session active."
                            }
                          </p>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col space-y-3">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </form>
              <div className="mt-8 text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kazi Ledger Pro v1.2.5</p>
                <p className="text-[10px] text-indigo-300 font-bold tracking-widest">Made for Micro-Entrepreneurs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Creation Modal */}
      {isAddingAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 glass">
          <div className="w-full bg-white rounded-[40px] shadow-2xl border border-indigo-100 p-8 animate-slide-up relative overflow-hidden">
            <button 
              onClick={() => setIsAddingAccount(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6">
                <Plus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">New Business</h2>
              <p className="text-sm text-slate-500 font-medium">Create a separate ledger for your other business.</p>
            </div>
            <form onSubmit={createNewAccount} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Business Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. Fish Business, Petro Station"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Currency</label>
                <select 
                  value={newAccountCurrency}
                  onChange={(e) => setNewAccountCurrency(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold text-slate-800 appearance-none"
                >
                  <option value="UGX">Ugandan Shilling (UGX)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="TZS">Tanzanian Shilling (TZS)</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all mt-4"
              >
                Create Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating AI Bar */}
      <CommandBar onRecord={handleNewRecord} context={contextString} />

      {/* Background decoration */}
      <div className="fixed -top-24 -right-24 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-32 -left-24 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { auth, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Sparkles, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setMessage({ type: 'error', text: error.message || 'An error occurred during authentication.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Welcome to <span className="text-indigo-600">Kazi</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Sign in to manage your business
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-start space-x-2 animate-slide-up ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
            message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
            'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {message.type === 'warning' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <ShieldCheck className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-3xl font-black text-lg shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-3 mt-4 disabled:opacity-70 hover:bg-slate-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-12 flex items-center space-x-2 text-slate-400">
        <ShieldCheck className="w-4 h-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest">
          Bank-grade security enabled
        </p>
      </div>
    </div>
  );
};
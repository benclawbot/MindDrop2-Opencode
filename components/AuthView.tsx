
import React, { useState } from 'react';
import { BrainCircuitIcon, SparklesIcon, CircleIcon } from './Icons';
import * as FirebaseService from '../services/firebase';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const currentDomain = window.location.hostname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setIsLoading(true);
    setStatusText(isLogin ? 'Authenticating...' : 'Creating Workspace...');
    
    try {
      if (isLogin) {
        await FirebaseService.signInWithEmail(email, password);
      } else {
        await FirebaseService.signUpWithEmail(email, password, name);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setErrorCode(err.code || '');
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setErrorCode('');
    setIsLoading(true);
    setStatusText('Contacting Google...');
    
    try {
      await FirebaseService.signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError('Google Sign-In failed.');
      setErrorCode(err.code || 'unknown');
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  const handleContinueAsGuest = () => {
    FirebaseService.enterGuestMode();
    onSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-2xl border border-stone-100 dark:border-white/5 relative z-10 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl flex items-center justify-center text-white mb-6">
            <BrainCircuitIcon className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white text-center">
            MindDrop
          </h1>
          <p className="text-stone-500 text-xs mt-2 text-center">Elite productivity workspace.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl">
            <p className="text-rose-600 dark:text-rose-400 text-xs font-bold">{error}</p>
            {errorCode === 'auth/unauthorized-domain' && (
                <div className="mt-2 space-y-2 border-t pt-2 border-rose-200/30">
                    <p className="text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed">
                        Add <code className="bg-stone-200 dark:bg-stone-800 px-1 rounded">{currentDomain}</code> to "Authorized Domains" in Firebase.
                    </p>
                    <button onClick={handleContinueAsGuest} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase">Skip to Guest Mode</button>
                </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 px-5 py-4 rounded-xl border-none outline-none text-sm dark:text-white" placeholder="Name" />
          )}
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 px-5 py-4 rounded-xl border-none outline-none text-sm dark:text-white" placeholder="Email" />
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 px-5 py-4 rounded-xl border-none outline-none text-sm dark:text-white" placeholder="Password" />

          <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="relative my-8"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200 dark:border-white/10" /></div><div className="relative flex justify-center text-[10px]"><span className="px-4 bg-white dark:bg-stone-900 text-stone-400 uppercase font-bold tracking-widest">OR</span></div></div>

        <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full py-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 rounded-xl font-bold transition-all hover:bg-stone-50 flex items-center justify-center gap-3 mb-4 shadow-sm">
          Google Sign-In
        </button>

        <button onClick={handleContinueAsGuest} className="w-full py-4 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-xl font-bold transition-all hover:bg-stone-200 flex items-center justify-center gap-3">
          <CircleIcon className="w-4 h-4 opacity-40" /> Continue as Guest
        </button>

        <div className="mt-8 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest hover:opacity-70">
            {isLogin ? "Need an account? Sign up" : "Already registered? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

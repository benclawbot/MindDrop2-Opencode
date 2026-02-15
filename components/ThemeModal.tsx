
import React, { useState, useEffect } from 'react';
import { XIcon, WandIcon, ImageIcon } from './Icons';
import { getText } from '../i18n';

interface ThemeModalProps {
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  onReset: () => void;
  isGenerating: boolean;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ onClose, onGenerate, onReset, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onGenerate(prompt);
  };

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-800">{getText('changeTheme')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 border border-indigo-100">
             <WandIcon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
             <p className="text-xs text-indigo-900 leading-relaxed">
               {getText('themeHelp')}
             </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                    {getText('themePrompt')}
                </label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={getText('themePromptPlaceholder')}
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none h-24"
                    autoFocus
                />
            </div>
            <div className="flex gap-3">
                <button 
                    type="button"
                    onClick={() => { onReset(); onClose(); }}
                    className="flex-1 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-200 transition-colors"
                >
                    {getText('resetTheme')}
                </button>
                <button 
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-none flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                           <span className="animate-spin">✨</span> 
                           {getText('generating')}
                        </>
                    ) : (
                        <>
                           <ImageIcon className="w-4 h-4" />
                           {getText('generate')}
                        </>
                    )}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

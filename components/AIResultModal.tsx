
import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../types';
import { XIcon, SparklesIcon, ClipboardListIcon, CheckIcon, PencilIcon } from './Icons';
import * as AIService from '../services/ai';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AIResultModalProps {
  task: Task;
  subtask: Subtask;
  onClose: () => void;
  onSave?: (content: string) => void;
}

export const AIResultModal: React.FC<AIResultModalProps> = ({ task, subtask, onClose, onSave }) => {
  const [content, setContent] = useState(subtask.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(!subtask.content);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (subtask.content) {
      setContent(subtask.content);
      setIsLoading(false);
      return;
    }

    let active = true;
    const generate = async () => {
      try {
        const result = await AIService.generateSubtaskContent(task, subtask);
        if (active) {
            setContent(result);
            setIsLoading(false);
        }
      } catch (e) {
        if (active) {
            setError("Failed to generate content. Please try again.");
            setIsLoading(false);
        }
      }
    };
    generate();
    return () => { active = false; };
  }, [task, subtask]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-white/20" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-white/5 bg-stone-50/80 dark:bg-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 p-2 rounded-lg text-indigo-600"><SparklesIcon className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Draft Workspace</h3>
              <p className="text-xs text-stone-400 truncate max-w-[200px]">{subtask.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400'}`}>
                {isEditing ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                {isEditing ? 'View Preview' : 'Edit Draft'}
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-400"><XIcon className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
            {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-stone-400 bg-stone-50/30 dark:bg-black/10">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm font-semibold animate-pulse tracking-wide">AI is thinking...</p>
                </div>
            ) : isEditing ? (
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-full p-8 font-mono text-sm leading-relaxed bg-stone-50/30 dark:bg-black/10 text-stone-700 dark:text-stone-300 focus:outline-none resize-none"
                />
            ) : (
                <div className="p-8 pb-20 prose dark:prose-invert max-w-none">
                    <MarkdownRenderer content={content} />
                </div>
            )}
        </div>

        <div className="p-4 border-t border-stone-100 dark:border-white/5 bg-stone-50/80 dark:bg-stone-800/50 flex justify-between items-center z-10">
            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest pl-2">Task-Aware Draft Intelligence</div>
            <div className="flex gap-3">
                <button onClick={handleCopy} disabled={isLoading} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all border ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400'}`}>
                    {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardListIcon className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => { if (onSave) onSave(content); onClose(); }} disabled={isLoading} className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10">Save & Finish</button>
            </div>
        </div>
      </div>
    </div>
  );
};

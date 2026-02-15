
import React, { useState, useEffect, useRef } from 'react';
import { Task, Subtask } from '../types';
import { XIcon, CheckCircleIcon, CircleIcon, SunIcon, MoonIcon } from './Icons';

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ task, onClose, onUpdateTask }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
        new Notification("Break Time!", { body: "Work session complete. Take 5 minutes to recharge." });
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
        new Notification("Focus Time!", { body: "Break over. Let's get back to it." });
      }
      setIsActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSubtask = (id: string) => {
    const updated = task.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    onUpdateTask({ ...task, subtasks: updated });
  };

  const progress = ((mode === 'work' ? 25 * 60 : 5 * 60) - timeLeft) / (mode === 'work' ? 25 * 60 : 5 * 60) * 100;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <button onClick={onClose} className="absolute top-8 right-8 p-4 text-stone-500 hover:text-white transition-colors z-10">
        <XIcon className="w-8 h-8" />
      </button>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
        
        {/* Timer Section */}
        <div className="flex flex-col items-center">
            <div className="relative w-80 h-80 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="160" cy="160" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle 
                        cx="160" cy="160" r={radius} fill="none" 
                        stroke={mode === 'work' ? '#4F46E5' : '#10B981'} 
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-7xl font-black text-white tabular-nums">{formatTime(timeLeft)}</span>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-stone-500 mt-2">{mode} session</span>
                </div>
            </div>

            <div className="mt-12 flex items-center gap-4">
                <button 
                    onClick={toggleTimer}
                    className={`px-12 py-4 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-2xl ${isActive ? 'bg-stone-800 text-stone-400' : 'bg-white text-stone-900 shadow-white/10'}`}
                >
                    {isActive ? 'Pause' : 'Focus Now'}
                </button>
                <button onClick={resetTimer} className="p-4 rounded-full bg-stone-900 text-stone-500 hover:text-white transition-colors">
                    <SunIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Task Section */}
        <div className="flex flex-col space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Current Mission</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">{task.title}</h2>
                <p className="text-stone-400 text-lg leading-relaxed line-clamp-3">{task.description}</p>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-600">Roadmap Steps</span>
                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                    {task.subtasks.map(st => (
                        <div key={st.id} className="flex items-center gap-4 group">
                            <button onClick={() => toggleSubtask(st.id)} className={`transition-all ${st.completed ? 'text-emerald-500' : 'text-stone-700 hover:text-stone-500'}`}>
                                {st.completed ? <CheckCircleIcon className="w-6 h-6" /> : <CircleIcon className="w-6 h-6" />}
                            </button>
                            <span className={`text-base font-bold transition-all ${st.completed ? 'text-stone-700 line-through' : 'text-stone-300'}`}>{st.title}</span>
                        </div>
                    ))}
                    {task.subtasks.length === 0 && <p className="text-stone-600 text-sm italic">No subtasks defined yet.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

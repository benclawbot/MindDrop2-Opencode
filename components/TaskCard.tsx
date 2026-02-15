
import React from 'react';
import { Task, Priority, Tag, ColumnId } from '../types';
import { ChevronRightIcon, ClockIcon, MessageSquareIcon, TrashIcon, CheckIcon } from './Icons';

interface TaskCardProps {
  task: Task;
  allTags: Tag[];
  onClick: () => void;
  onUpdate: (task: Task) => void;
  onDelete: () => void;
  onDragStart: () => void;
  isFocused?: boolean;
}

const PriorityIndicator: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    [Priority.Critical]: 'bg-rose-500',
    [Priority.High]: 'bg-orange-500',
    [Priority.Medium]: 'bg-amber-500',
    [Priority.Low]: 'bg-emerald-500',
  };
  return <div className={`w-1.5 h-1.5 rounded-full ${colors[priority]} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />;
};

export const TaskCard = React.memo(({ task, allTags, onClick, onUpdate, onDelete, onDragStart, isFocused }: TaskCardProps) => {
  const moveTask = (e: React.MouseEvent, target: ColumnId) => {
    e.stopPropagation();
    const updates: Partial<Task> = { columnId: target };
    if (target === ColumnId.Done) {
      updates.remainingTime = 0;
    }
    onUpdate({ ...task, ...updates });
  };

  const completedCount = task.subtasks.filter(s => s.completed).length;
  const totalCount = task.subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const isOverdue = task.deadline && task.deadline < startOfToday && task.columnId !== ColumnId.Done;
  
  const displayTags = task.tags.map(id => allTags.find(t => t.id === id)).filter(Boolean) as Tag[];
  const formattedDate = task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Logic for displaying time in the bottom right as requested
  const isDone = task.columnId === ColumnId.Done;
  const hasSubtasks = task.subtasks.length > 0;
  const displayTime = hasSubtasks 
    ? (task.remainingTime ?? 0)
    : (task.estimation ?? 0);

  return (
    <div 
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      className={`
        relative bg-white dark:bg-stone-900 p-5 rounded-[1.75rem] border border-stone-200 dark:border-white/5 shadow-sm
        hover:shadow-xl transition-all duration-300 group cursor-grab active:cursor-grabbing select-none
        will-change-transform
        ${isFocused ? 'ring-2 ring-indigo-500/50 scale-[1.02] z-10 shadow-2xl' : ''}
        ${task.isPendingAnalysis ? 'opacity-80' : ''}
      `}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <div className="relative w-9 h-9 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r={radius} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-100 dark:text-stone-800" />
                <circle 
                  cx="18" cy="18" r={radius} fill="none" stroke="currentColor" strokeWidth="2.5" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${progressPercent === 100 ? 'text-emerald-500' : 'text-indigo-600'}`}
                />
            </svg>
            <span className="absolute text-[8px] font-black text-stone-400">{progressPercent}%</span>
        </div>
        
        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete task?")) onDelete(); }} className="p-2 rounded-xl text-stone-300 hover:text-rose-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
          {task.columnId === ColumnId.Todo && (
            <button onClick={(e) => moveTask(e, ColumnId.InProgress)} className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg"><ChevronRightIcon className="w-4 h-4" /></button>
          )}
          {task.columnId === ColumnId.InProgress && (
            <button onClick={(e) => moveTask(e, ColumnId.Done)} className="p-2 rounded-xl bg-emerald-600 text-white shadow-lg"><CheckIcon className="w-4 h-4" /></button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <PriorityIndicator priority={task.priority} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{task.priority}</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 leading-snug pr-12 line-clamp-2">{task.title}</h3>

        {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
                {displayTags.map(tag => (
                    <span key={tag.id} className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${tag.color} shadow-sm`}>
                        {tag.name}
                    </span>
                ))}
            </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-white/5">
            <div className="flex items-center gap-4">
                {formattedDate && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-stone-400'}`}>
                        <ClockIcon className="w-3.5 h-3.5" />
                        {formattedDate}
                    </div>
                )}
                {task.comments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                        <MessageSquareIcon className="w-3.5 h-3.5" />
                        {task.comments.length}
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3">
              {totalCount > 0 && !task.isPendingAnalysis && (
                <span className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-tighter">{completedCount}/{totalCount} Steps</span>
              )}
              
              {task.isPendingAnalysis ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 animate-pulse">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                   <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Analyzing</span>
                </div>
              ) : (
                !isDone && displayTime > 0 && (
                   <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${hasSubtasks ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-stone-50 dark:bg-stone-800/50 text-stone-400'}`}>
                      <ClockIcon className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase whitespace-nowrap">
                        {displayTime}m {hasSubtasks ? 'left' : 'est.'}
                      </span>
                   </div>
                )
              )}
            </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
    return prev.task.id === next.task.id &&
           prev.task.title === next.task.title &&
           prev.task.columnId === next.task.columnId &&
           prev.task.priority === next.task.priority &&
           prev.task.deadline === next.task.deadline &&
           prev.task.remainingTime === next.task.remainingTime &&
           prev.task.estimation === next.task.estimation &&
           prev.task.isPendingAnalysis === next.task.isPendingAnalysis &&
           prev.task.subtasks.length === next.task.subtasks.length &&
           prev.task.tags.length === next.task.tags.length &&
           prev.task.comments.length === next.task.comments.length &&
           prev.isFocused === next.isFocused &&
           prev.allTags.length === next.allTags.length;
});

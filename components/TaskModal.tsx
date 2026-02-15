
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, ColumnId, Tag, Subtask, Comment, Attachment } from '../types';
import { XIcon, SparklesIcon, CheckCircleIcon, CircleIcon, TrashIcon, CheckIcon, PlusIcon, MessageSquareIcon, SendIcon, WandIcon, PaperclipIcon, FileIcon, DownloadIcon, FileTextIcon, ClockIcon, TagIcon, SlidersIcon, ClipboardListIcon, SearchIcon } from './Icons';
import * as AIService from '../services/ai';
import { getText } from '../i18n';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AIResultModal } from './AIResultModal';

interface TaskModalProps {
  task: Task;
  allTags: Tag[];
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  onAddTag: (tag: Tag) => void;
}

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const TAG_COLORS = [
  'bg-red-100 text-red-800 border-red-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-violet-100 text-violet-800 border-violet-200',
];

const ListIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const DragHandleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);

const AutoSizeTextArea: React.FC<{ 
  value: string; 
  onChange: (val: string) => void; 
  className?: string;
  placeholder?: string;
  onBlur?: () => void;
}> = ({ value, onChange, className, placeholder, onBlur }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`resize-none overflow-hidden ${className}`}
      rows={1}
      placeholder={placeholder}
    />
  );
};

export const TaskModal: React.FC<TaskModalProps> = ({ task, allTags, onClose, onUpdate, onDelete, onAddTag }) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'coach'>('coach');
  const [mobileView, setMobileView] = useState<'roadmap' | 'details' | 'activity'>('roadmap');
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string, sources?: any[]}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [draggedSubtaskIndex, setDraggedSubtaskIndex] = useState<number | null>(null);
  const [activeAIResultSubtask, setActiveAIResultSubtask] = useState<Subtask | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const progressPercent = task.subtasks.length > 0 ? Math.round((completedSubtasks / task.subtasks.length) * 100) : 0;

  const currentRemaining = useMemo(() => {
    if (task.columnId === ColumnId.Done) return 0;
    if (task.subtasks.length > 0) {
      return task.subtasks.reduce((sum, st) => sum + (st.completed ? 0 : (st.estimation || 0)), 0);
    }
    return task.estimation || 0;
  }, [task.subtasks, task.estimation, task.columnId]);

  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{ role: 'model', text: getText('coachIntro', {title: task.title}) }]);
    }
  }, [task.title]);

  useEffect(() => {
    if (showTagPicker) {
      tagInputRef.current?.focus();
    } else {
      setTagSearch('');
    }
  }, [showTagPicker]);

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    let updatedColumnId = task.columnId;
    if (task.columnId === ColumnId.Todo && updatedSubtasks.some(st => st.completed)) {
        updatedColumnId = ColumnId.InProgress;
    }
    const newRemaining = updatedSubtasks.reduce((sum, st) => sum + (st.completed ? 0 : (st.estimation || 0)), 0);
    onUpdate({ ...task, subtasks: updatedSubtasks, columnId: updatedColumnId, remainingTime: newRemaining });
  };

  const removeTag = (tagId: string) => {
    onUpdate({ ...task, tags: task.tags.filter(id => id !== tagId) });
  };

  const addTag = (tagId: string) => {
    if (task.tags.includes(tagId)) return;
    onUpdate({ ...task, tags: [...task.tags, tagId] });
    setShowTagPicker(false);
  };

  const createAndAddTag = (name: string) => {
    const tagName = name.trim().toLowerCase();
    if (!tagName) return;
    const existing = allTags.find(t => t.name.toLowerCase() === tagName);
    if (existing) {
      addTag(existing.id);
    } else {
      const colorIndex = Math.floor(Math.random() * TAG_COLORS.length);
      const tagColor = TAG_COLORS[colorIndex];
      const newTag: Tag = {
        id: crypto.randomUUID(),
        name: tagName,
        color: tagColor ?? TAG_COLORS[0] ?? 'bg-gray-100 text-gray-800 border-gray-200'
      };
      onAddTag(newTag);
      onUpdate({ ...task, tags: [...task.tags, newTag.id] });
      setShowTagPicker(false);
    }
  };

  const filteredTags = useMemo(() => {
    const query = tagSearch.toLowerCase();
    return allTags.filter(t => 
      !task.tags.includes(t.id) && 
      t.name.toLowerCase().includes(query)
    );
  }, [allTags, task.tags, tagSearch]);

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const est = 15; 
    const newSt: Subtask = { 
      id: crypto.randomUUID(), 
      title: capitalize(newSubtaskTitle.trim()), 
      completed: false, 
      aiAction: 'content',
      estimation: est
    };
    const updatedSubtasks = [...task.subtasks, newSt];
    const newRemaining = updatedSubtasks.reduce((sum, st) => sum + (st.completed ? 0 : (st.estimation || 0)), 0);
    onUpdate({...task, subtasks: updatedSubtasks, remainingTime: newRemaining});
    setNewSubtaskTitle('');
  };

  const handleSubtaskDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSubtaskIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSubtaskDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubtaskDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedSubtaskIndex === null || draggedSubtaskIndex === dropIndex) return;
    const updatedSubtasks = [...task.subtasks];
    const [movedItem] = updatedSubtasks.splice(draggedSubtaskIndex, 1);
    if (movedItem) {
      updatedSubtasks.splice(dropIndex, 0, movedItem);
      onUpdate({ ...task, subtasks: updatedSubtasks });
    }
    setDraggedSubtaskIndex(null);
  };

  const handleMagicFillDescription = async () => {
     setIsDescriptionLoading(true);
     try {
         const newDesc = await AIService.magicFillDescription(task.title, task.description);
         if (newDesc) onUpdate({ ...task, description: capitalize(newDesc) });
     } catch (e) { console.error(e); } finally { setIsDescriptionLoading(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatThinking) return;
    const userMsg = chatInput;
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user', text: userMsg } as any];
    setChatMessages(newHistory);
    setIsChatThinking(true);
    try {
      const apiHistory = newHistory.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
      const result = await AIService.chatWithCoach(task, apiHistory, userMsg);
      setChatMessages([...newHistory, { role: 'model', text: result.text, sources: result.sources }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Lost my connection. Try again?" }]);
    } finally { setIsChatThinking(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xl p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 w-full max-w-7xl h-[94vh] sm:h-[92vh] rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-stone-100 dark:border-white/5 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100 dark:border-white/5 bg-white dark:bg-stone-900 shrink-0">
          <div className="flex items-center gap-5 flex-1 min-w-0">
             <div className={`p-2.5 rounded-[1.25rem] text-white shadow-lg shrink-0 ${task.priority === Priority.Critical ? 'bg-rose-500 shadow-rose-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}>
                <WandIcon className="w-5 h-5" />
             </div>
             <div className="flex-1 min-w-0">
                <AutoSizeTextArea
                  value={task.title}
                  onChange={(val) => onUpdate({...task, title: capitalize(val)})}
                  className="w-full text-xl sm:text-2xl font-black bg-transparent border-none focus:ring-0 text-stone-900 dark:text-white placeholder:text-stone-200 p-0 leading-tight"
                  placeholder="Task Name"
                />
                <div className="flex items-center gap-2 mt-1">
                   <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                   <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Remaining: {currentRemaining} min</span>
                   {task.estimation && <span className="text-[10px] font-bold text-stone-300">/ {task.estimation} min initial</span>}
                </div>
             </div>
          </div>
          <button onClick={onClose} className="ml-4 p-3 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-2xl text-stone-400 transition-all active:scale-95 shrink-0">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="md:hidden flex p-1.5 bg-stone-100 dark:bg-stone-800/50 mx-6 mt-4 rounded-2xl shrink-0">
           <button onClick={() => setMobileView('roadmap')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mobileView === 'roadmap' ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-white shadow-sm' : 'text-stone-400'}`}>
             <ListIcon className="w-4 h-4" /> Roadmap
           </button>
           <button onClick={() => setMobileView('details')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mobileView === 'details' ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-white shadow-sm' : 'text-stone-400'}`}>
             <SlidersIcon className="w-4 h-4" /> Details
           </button>
           <button onClick={() => setMobileView('activity')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mobileView === 'activity' ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-white shadow-sm' : 'text-stone-400'}`}>
             <MessageSquareIcon className="w-4 h-4" /> Activity
           </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-stone-900 ${mobileView !== 'roadmap' ? 'hidden md:block' : 'block'}`}>
             <div className="max-w-[840px] mx-auto py-8 sm:py-12 px-6 sm:px-12 space-y-12">
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">Project Context</label>
                    <button onClick={handleMagicFillDescription} disabled={isDescriptionLoading} className="text-[11px] font-black text-indigo-600 flex items-center gap-2 hover:opacity-70 disabled:opacity-50 transition-all">
                      <SparklesIcon className="w-4 h-4" /> 
                      {isDescriptionLoading ? 'Enhancing...' : 'AI Refine'}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                        value={task.description} 
                        onChange={e => onUpdate({...task, description: capitalize(e.target.value)})} 
                        className="w-full bg-stone-50/50 dark:bg-white/5 p-6 sm:p-8 rounded-[2rem] text-base sm:text-lg leading-relaxed text-stone-700 dark:text-stone-300 outline-none border border-stone-100 dark:border-white/5 focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[140px] resize-none" 
                        placeholder="Clearly define what success looks like..."
                    />
                  </div>
               </div>

               <div className="space-y-8 pb-12">
                  <div className="flex items-center justify-between px-1 border-b border-stone-100 dark:border-white/5 pb-5">
                     <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">Execution Roadmap</label>
                     <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black text-indigo-600">{progressPercent}% Done</span>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                    {task.subtasks.map((st, index) => (
                      <div 
                        key={st.id} 
                        draggable
                        onDragStart={(e) => handleSubtaskDragStart(e, index)}
                        onDragOver={handleSubtaskDragOver}
                        onDrop={(e) => handleSubtaskDrop(e, index)}
                        className={`group flex items-start gap-5 p-5 sm:p-6 rounded-[1.75rem] transition-all bg-white dark:bg-stone-800/40 border border-stone-50 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-500/20 ${draggedSubtaskIndex === index ? 'opacity-30 scale-95' : ''}`}
                      >
                        <div className="pt-1.5 text-stone-200 group-hover:text-stone-400 dark:text-stone-700 dark:group-hover:text-stone-500 cursor-grab shrink-0 hidden sm:block">
                           <DragHandleIcon className="w-5 h-5" />
                        </div>
                        
                        <button onClick={() => toggleSubtask(st.id)} className={`pt-1 transition-all transform hover:scale-110 shrink-0 ${st.completed ? 'text-emerald-500' : 'text-stone-200 dark:text-stone-700'}`}>
                          {st.completed ? <CheckCircleIcon className="w-9 h-9" /> : <CircleIcon className="w-9 h-9" />}
                        </button>

                        <div className="flex-1 min-w-0">
                           <AutoSizeTextArea
                             value={st.title}
                             onChange={(val) => {
                               const updatedSubtasks = task.subtasks.map(item => item.id === st.id ? { ...item, title: capitalize(val) } : item);
                               const newRemaining = updatedSubtasks.reduce((sum, st) => sum + (st.completed ? 0 : (st.estimation || 0)), 0);
                               onUpdate({ ...task, subtasks: updatedSubtasks, remainingTime: newRemaining });
                             }}
                             className={`w-full text-base sm:text-lg font-bold bg-transparent border-none focus:ring-0 p-0 leading-snug ${st.completed ? 'line-through text-stone-300 dark:text-stone-700' : 'text-stone-800 dark:text-stone-200'}`}
                           />
                           <div className="flex items-center gap-1.5 mt-1 opacity-60">
                              <ClockIcon className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-wider">{st.estimation || 15} min</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                           {st.aiAction && (
                             <button onClick={() => setActiveAIResultSubtask(st)} className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><SparklesIcon className="w-5 h-5" /></button>
                           )}
                           <button onClick={() => {
                             const updatedSubtasks = task.subtasks.filter(s => s.id !== st.id);
                             const newRemaining = updatedSubtasks.length > 0 
                               ? updatedSubtasks.reduce((sum, s) => sum + (s.completed ? 0 : (s.estimation || 0)), 0)
                               : task.estimation;
                             onUpdate({...task, subtasks: updatedSubtasks, remainingTime: newRemaining});
                           }} className="p-3 rounded-2xl text-stone-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                    <form onSubmit={handleAddSubtask} className="flex items-start gap-5 p-5 sm:p-6 rounded-[1.75rem] border-2 border-dashed border-stone-100 dark:border-white/5 hover:border-indigo-300 transition-all group">
                      <div className="text-stone-200 group-hover:text-indigo-600 pt-1">
                        <PlusIcon className="w-9 h-9" />
                      </div>
                      <AutoSizeTextArea
                        value={newSubtaskTitle} 
                        onChange={setNewSubtaskTitle} 
                        onBlur={() => handleAddSubtask()}
                        placeholder="Add another roadmap step..." 
                        className="flex-1 bg-transparent text-base sm:text-lg font-bold border-none outline-none focus:ring-0 text-stone-800 dark:text-stone-200 placeholder:text-stone-200 p-0 leading-snug mt-1" 
                      />
                    </form>
                  </div>
               </div>
             </div>
          </div>

          <div className={`w-full md:w-[420px] border-l border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-stone-800/20 flex flex-col overflow-hidden ${mobileView === 'roadmap' ? 'hidden md:flex' : 'flex'}`}>
            <div className={`p-8 sm:p-10 space-y-10 shrink-0 ${mobileView === 'activity' ? 'hidden md:block' : 'block'}`}>
               <div className="space-y-6">
                 <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">Specifications</h4>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest">Priority</label>
                      <select value={task.priority} onChange={e => onUpdate({...task, priority: e.target.value as any})} className="w-full bg-white dark:bg-stone-900 p-4 rounded-2xl text-sm font-bold border border-stone-200 dark:border-white/10 outline-none focus:border-indigo-500 shadow-sm transition-all">
                         {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest">Workflow</label>
                      <select value={task.columnId} onChange={e => {
                        const newCol = e.target.value as ColumnId;
                        const updates: Partial<Task> = { columnId: newCol };
                        if (newCol === ColumnId.Done) updates.remainingTime = 0;
                        else {
                          updates.remainingTime = task.subtasks.length > 0 
                            ? task.subtasks.reduce((sum, st) => sum + (st.completed ? 0 : (st.estimation || 0)), 0)
                            : task.estimation;
                        }
                        onUpdate({...task, ...updates});
                      }} className="w-full bg-white dark:bg-stone-900 p-4 rounded-2xl text-sm font-bold border border-stone-200 dark:border-white/10 outline-none focus:border-indigo-500 shadow-sm transition-all">
                         <option value={ColumnId.Todo}>Todo</option>
                         <option value={ColumnId.InProgress}>Ongoing</option>
                         <option value={ColumnId.Done}>Completed</option>
                      </select>
                    </div>
                    <div className="space-y-3 col-span-2">
                      <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Deadline</label>
                      <input type="date" value={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''} onChange={e => onUpdate({...task, deadline: e.target.value ? new Date(e.target.value).getTime() : undefined})} className="w-full bg-white dark:bg-stone-900 p-4 rounded-2xl text-sm font-bold border border-stone-200 dark:border-white/10 outline-none focus:border-indigo-500 shadow-sm transition-all" />
                    </div>
                    <div className="space-y-3 col-span-2">
                       <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest">Manual Estimation (min)</label>
                       <input type="number" value={task.estimation || ''} onChange={e => {
                         const val = parseInt(e.target.value) || 0;
                         const updates: Partial<Task> = { estimation: val };
                         if (task.subtasks.length === 0) updates.remainingTime = val;
                         onUpdate({...task, ...updates});
                       }} className="w-full bg-white dark:bg-stone-900 p-4 rounded-2xl text-sm font-bold border border-stone-200 dark:border-white/10 outline-none focus:border-indigo-500 shadow-sm transition-all" />
                    </div>
                 </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">Categorization</h4>
                  <div className="flex flex-wrap gap-2.5">
                     {task.tags.map(tagId => {
                        const tag = allTags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <span key={tag.id} className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl text-[11px] font-black uppercase border shadow-sm transition-all hover:scale-105 ${tag.color}`}>
                            {tag.name}
                            <button onClick={() => removeTag(tag.id)} className="hover:opacity-50"><XIcon className="w-4 h-4" /></button>
                          </span>
                        );
                     })}
                     <div className="relative">
                        <button onClick={() => setShowTagPicker(!showTagPicker)} className="px-5 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-white/10 text-stone-400 text-[11px] font-black uppercase hover:border-indigo-500 transition-all">+ Manage Labels</button>
                        {showTagPicker && (
                            <div className="absolute bottom-full mb-3 left-0 sm:left-auto sm:right-0 w-72 bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/10 rounded-[2rem] shadow-2xl z-[60] p-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                                <div className="flex flex-col gap-3">
                                  <div className="relative">
                                    <input 
                                      ref={tagInputRef}
                                      type="text" 
                                      value={tagSearch}
                                      onChange={(e) => setTagSearch(e.target.value)}
                                      placeholder="Search or create tag..."
                                      className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-2.5 pl-10 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && tagSearch.trim()) {
                                          createAndAddTag(tagSearch);
                                        }
                                      }}
                                    />
                                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                                  </div>
                                  <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                                      {filteredTags.map(tag => (
                                          <button key={tag.id} onClick={() => addTag(tag.id)} className="w-full text-left px-4 py-3 rounded-xl text-[11px] font-bold uppercase hover:bg-stone-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group">
                                            <span>{tag.name}</span>
                                            <div className={`w-2 h-2 rounded-full ${tag.color.split(' ')[0]}`} />
                                          </button>
                                      ))}
                                      {tagSearch.trim() && !allTags.find(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                                        <button 
                                          onClick={() => createAndAddTag(tagSearch)}
                                          className="w-full text-left px-4 py-4 rounded-xl text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                        >
                                          <PlusIcon className="w-4 h-4" />
                                          Create "{tagSearch}"
                                        </button>
                                      )}
                                      {filteredTags.length === 0 && !tagSearch && (
                                        <div className="px-4 py-8 text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                                          No tags found
                                        </div>
                                      )}
                                  </div>
                                </div>
                            </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
            <div className={`flex-1 flex flex-col min-h-0 ${mobileView === 'details' ? 'hidden md:flex' : 'flex'}`}>
               <div className="flex p-2 bg-stone-200/50 dark:bg-stone-900/50 mx-10 mt-6 rounded-[2rem] shrink-0 border border-white/5">
                  <button onClick={() => setActiveTab('coach')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'coach' ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-white shadow-xl' : 'text-stone-500'}`}>
                    <SparklesIcon className="w-5 h-5" /> AI Coach
                  </button>
                  <button onClick={() => setActiveTab('comments')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'comments' ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-white shadow-xl' : 'text-stone-500'}`}>
                    <MessageSquareIcon className="w-5 h-5" /> Activity
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto no-scrollbar p-10">
                  {activeTab === 'coach' ? (
                    <div className="flex flex-col h-full space-y-6">
                       <div className="flex-1 space-y-6">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                               <div className={`max-w-[95%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-indigo-500/10' : 'bg-white dark:bg-stone-800 border border-stone-100 dark:border-white/5 text-stone-700 dark:text-stone-300'}`}>
                                  <MarkdownRenderer content={msg.text} isUser={msg.role === 'user'} />
                               </div>
                               {msg.sources && msg.sources.length > 0 && (
                                   <div className="mt-2 flex flex-wrap gap-2 px-2">
                                       {msg.sources.map((src, idx) => (
                                           <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold hover:underline truncate max-w-[140px]">
                                               {src.title || 'Source'}
                                           </a>
                                       ))}
                                   </div>
                               )}
                            </div>
                          ))}
                          {isChatThinking && <div className="text-[10px] font-black uppercase text-indigo-500 animate-pulse tracking-widest px-4">AI is thinking...</div>}
                       </div>
                       <form onSubmit={handleSendMessage} className="flex gap-3 pt-8 sticky bottom-0 bg-transparent">
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask anything..." className="flex-1 bg-white dark:bg-stone-900 px-7 py-5 rounded-[2rem] text-sm font-bold shadow-2xl outline-none border border-transparent focus:border-indigo-500/30 transition-all" />
                          <button type="submit" className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl active:scale-95 transition-all"><SendIcon className="w-6 h-6" /></button>
                       </form>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full space-y-6">
                       <div className="flex-1 space-y-6">
                          {task.comments?.map(c => (
                            <div key={c.id} className="bg-white dark:bg-stone-800 p-6 rounded-[2rem] border border-stone-100 dark:border-white/5 shadow-sm">
                               <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed"><MarkdownRenderer content={c.text} /></p>
                               <span className="text-[10px] font-black text-stone-400 mt-4 block opacity-50 uppercase tracking-widest">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                          ))}
                          {(task.comments?.length === 0) && (
                            <div className="h-full flex flex-col items-center justify-center text-stone-200 py-16">
                               <ClipboardListIcon className="w-16 h-16 mb-4 opacity-20" />
                               <p className="text-[11px] font-black uppercase tracking-widest opacity-30">No project activity</p>
                            </div>
                          )}
                       </div>
                       <form onSubmit={(e) => { e.preventDefault(); if(!chatInput.trim()) return; onUpdate({...task, comments: [...(task.comments || []), {id: crypto.randomUUID(), text: chatInput, createdAt: Date.now()}]}); setChatInput(''); }} className="flex gap-3 pt-8 sticky bottom-0 bg-transparent">
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Add note..." className="flex-1 bg-white dark:bg-stone-900 px-7 py-5 rounded-[2rem] text-sm font-bold shadow-2xl outline-none border border-transparent focus:border-indigo-500/30" />
                          <button type="submit" className="w-14 h-14 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-95"><PlusIcon className="w-7 h-7" /></button>
                       </form>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
      {activeAIResultSubtask && (
        <AIResultModal 
            task={task} 
            subtask={activeAIResultSubtask} 
            onClose={() => setActiveAIResultSubtask(null)} 
            onSave={(content) => onUpdate({...task, subtasks: task.subtasks.map(st => st.id === activeAIResultSubtask.id ? {...st, content} : st)})}
        />
      )}
    </div>
  );
};

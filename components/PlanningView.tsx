
import React, { useState, useRef, useEffect } from 'react';
import { Task, Priority, ColumnId, Tag } from '../types';
import { ChevronRightIcon, ClockIcon } from './Icons';
import { getText } from '../i18n';
import { NewTaskInput, NewTaskInputHandle } from './NewTaskInput';

interface PlanningViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onAddTask: (task: Task) => void;
  allTags: Tag[];
  onAddTag: (tag: Tag) => void;
  onSelectTask: (task: Task) => void; 
}

type ViewMode = 'day' | 'week' | 'month';

// Helper to get styling based on priority
const getTaskStyles = (task: Task) => {
  switch (task.priority) {
    case Priority.Critical:
      return 'bg-[#FFEBEE] text-[#C62828] border-l-2 border-[#C62828] dark:bg-red-900/40 dark:text-red-300 dark:border-red-500'; 
    case Priority.High:
      return 'bg-[#FFF3E0] text-[#EF6C00] border-l-2 border-[#EF6C00] dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-500'; 
    case Priority.Medium:
      return 'bg-[#E3F2FD] text-[#1565C0] border-l-2 border-[#1565C0] dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500'; 
    case Priority.Low:
      return 'bg-[#E8F5E9] text-[#2E7D32] border-l-2 border-[#2E7D32] dark:bg-green-900/40 dark:text-green-300 dark:border-green-500'; 
    default:
      return 'bg-[#F5F5F5] text-[#616161] border-l-2 border-[#9E9E9E] dark:bg-stone-800 dark:text-stone-300 dark:border-stone-500'; 
  }
};

export const PlanningView: React.FC<PlanningViewProps> = ({ tasks, onUpdateTask, onSelectTask, onAddTask, allTags, onAddTag }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Task Creation State
  const [creationDate, setCreationDate] = useState<Date | null>(null);
  const newTaskInputRef = useRef<NewTaskInputHandle>(null);

  // Navigation
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Focus and setup NewTaskInput when creationDate is set
  useEffect(() => {
    if (creationDate && newTaskInputRef.current) {
        setTimeout(() => {
            if (newTaskInputRef.current) {
                newTaskInputRef.current.setDeadline(creationDate.getTime());
                newTaskInputRef.current.expand();
                newTaskInputRef.current.focus();
            }
        }, 50);
    }
  }, [creationDate]);

  const handleSlotClick = (date: Date) => {
    setCreationDate(date);
  };

  const handleCreateTask = (task: Task) => {
    onAddTask(task);
    setCreationDate(null);
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.stopPropagation();
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (task) {
      const newDeadline = new Date(date);
      if (hour !== undefined) {
          newDeadline.setHours(hour, 0, 0, 0); 
      } else {
          // Dropped in "All Day" section - preserve date but set to midnight or keep existing time if we wanted to be fancy, but here we'll default to midnight for "All Day" semantics usually implies date-based
          newDeadline.setHours(0, 0, 0, 0);
      }
      
      onUpdateTask({ ...task, deadline: newDeadline.getTime() });
    }
    setDraggedTaskId(null);
  };

  // Date Logic
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Filter tasks - Normalized to ensure full day coverage
  const getTasksForDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Normalize to start of day
    const start = d.getTime();
    const end = start + (24 * 60 * 60 * 1000);
    
    return tasks.filter(t => 
      t.columnId !== ColumnId.Done &&
      t.deadline && 
      t.deadline >= start && 
      t.deadline < end
    );
  };

  // 7 AM to 9 PM = 15 slots
  const START_HOUR = 7;
  const END_HOUR = 21;
  const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

  const getTaskGroups = (date: Date) => {
      const dailyTasks = getTasksForDate(date);
      const allDayTasks: Task[] = [];
      const timedTasks: Task[] = [];
      
      dailyTasks.forEach(t => {
          const d = new Date(t.deadline || 0);
          const h = d.getHours();
          // Check if time is 00:00 (often default) or outside visible range
          if (h < START_HOUR || h > END_HOUR) {
              allDayTasks.push(t);
          } else {
              timedTasks.push(t);
          }
      });
      return { allDayTasks, timedTasks };
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 overflow-hidden relative">
      {/* Creation Modal Overlay */}
      {creationDate && (
          <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setCreationDate(null)}>
              <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                  <NewTaskInput 
                      ref={newTaskInputRef}
                      onAddTask={handleCreateTask}
                      onUpdateTask={onUpdateTask}
                      allTags={allTags}
                      onAddTag={onAddTag}
                      onCancel={() => setCreationDate(null)}
                  />
              </div>
          </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
           <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
             {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
           </h2>
           <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
              <button onClick={() => setViewMode('day')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'}`}>Day</button>
              <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'}`}>Week</button>
              <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'}`}>Month</button>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={handlePrev} className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
             <ChevronRightIcon className="w-5 h-5 rotate-180" />
           </button>
           <button onClick={handleToday} className="text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 px-3 py-1.5 rounded-md transition-colors">
             Today
           </button>
           <button onClick={handleNext} className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
             <ChevronRightIcon className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Main Content Container - Flex 1 to fill remaining vertical space */}
      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-stone-900">
        
        {viewMode === 'month' && (
           <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-7 grid-rows-5 h-full min-h-[600px]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <div key={d} className="p-2 border-b border-r border-stone-100 dark:border-stone-800 text-xs font-bold text-stone-400 uppercase tracking-widest text-center">{d}</div>
                  ))}
                  {Array.from({length: 35}).map((_, i) => {
                      const offset = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() - 1; 
                      const dayNum = i - offset + 1;
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                      const dayTasks = getTasksForDate(date);
                      const maxDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

                      if (i < offset || dayNum > maxDays) return <div key={i} className="bg-stone-50/30 dark:bg-stone-800/30 border-b border-r border-stone-100 dark:border-stone-800" />;
                      
                      return (
                          <div key={i} onClick={() => handleSlotClick(date)} className="border-b border-r border-stone-100 dark:border-stone-800 p-2 relative hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group cursor-pointer flex flex-col gap-1 overflow-hidden">
                              <span 
                                onClick={(e) => { e.stopPropagation(); setCurrentDate(date); setViewMode('day'); }}
                                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${date.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-stone-500 dark:text-stone-400'}`}
                              >
                                  {dayNum}
                              </span>
                              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                  {dayTasks.slice(0, 3).map(t => (
                                      <div key={t.id} onClick={(e) => { e.stopPropagation(); onSelectTask(t); }} className="w-full h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-600 hover:scale-y-150 transition-transform origin-left" title={t.title} />
                                  ))}
                              </div>
                          </div>
                      );
                  })}
              </div>
           </div>
        )}

        {/* Daily View: Scrollable */}
        {viewMode === 'day' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden pb-4">
                <div className="text-center py-2 border-b border-stone-100 dark:border-stone-800 shrink-0 bg-white dark:bg-stone-900 z-10">
                   <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{currentDate.getDate()}</span>
                   <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-stone-400">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </div>
                
                {/* All Day Section */}
                <div 
                   className="p-3 bg-stone-50/50 dark:bg-stone-800/30 border-b border-stone-100 dark:border-stone-800 min-h-[60px]"
                   onDragOver={handleDragOver}
                   onDrop={(e) => handleDrop(e, currentDate)}
                >
                   <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <span>Whole Day</span>
                       <span className="text-[9px] font-normal opacity-50">(or outside 7AM-9PM)</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                       {getTaskGroups(currentDate).allDayTasks.map(task => (
                           <div 
                               key={task.id}
                               draggable
                               onDragStart={(e) => handleDragStart(e, task.id)}
                               onClick={(e) => { e.stopPropagation(); onSelectTask(task); }}
                               className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 max-w-[200px] shadow-sm cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${getTaskStyles(task)} ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                           >
                               <span className="truncate font-medium">{task.title}</span>
                               {(new Date(task.deadline!).getHours() !== 0) && (
                                   <span className="opacity-70 text-[9px] bg-black/5 dark:bg-white/10 px-1 rounded flex items-center gap-0.5">
                                       <ClockIcon className="w-2.5 h-2.5" />
                                       {new Date(task.deadline!).toLocaleTimeString([], { hour: 'numeric' })}
                                   </span>
                               )}
                           </div>
                       ))}
                       {getTaskGroups(currentDate).allDayTasks.length === 0 && (
                           <div className="text-xs text-stone-300 dark:text-stone-600 italic">No all-day tasks</div>
                       )}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef}>
                    {timeSlots.map(hour => {
                        const dateForSlot = new Date(currentDate);
                        dateForSlot.setHours(hour, 0, 0, 0);
                        const { timedTasks } = getTaskGroups(currentDate);
                        const tasksInHour = timedTasks.filter(t => {
                            const d = new Date(t.deadline || 0);
                            return d.getHours() === hour;
                        });

                        return (
                            <div 
                                key={hour} 
                                data-hour={hour}
                                className="flex border-b border-stone-100 dark:border-stone-800 h-20 min-h-[5rem] group"
                            >
                                <div className="w-16 flex items-center justify-end pr-4 text-[10px] font-bold text-stone-400 uppercase shrink-0 border-r border-stone-50 dark:border-stone-800">
                                    {hour === 0 ? '12 AM' : hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                </div>
                                <div 
                                    onClick={() => handleSlotClick(dateForSlot)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, currentDate, hour)}
                                    className="flex-1 relative hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors px-1 py-0.5 overflow-hidden cursor-cell"
                                >
                                    <div className="h-full flex gap-1">
                                        {tasksInHour.map(task => (
                                            <div 
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                onClick={(e) => { e.stopPropagation(); onSelectTask(task); }}
                                                className={`flex-1 min-w-0 px-2 py-1 rounded-md text-xs truncate ${getTaskStyles(task)} cursor-grab active:cursor-grabbing shadow-sm ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                                                title={task.title}
                                            >
                                                <div className="font-bold truncate">{task.title}</div>
                                                <div className="opacity-70 text-[9px] truncate">{task.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* Weekly View: Scrollable */}
        {viewMode === 'week' && (
           <div className="flex-1 flex flex-col h-full overflow-hidden pb-4">
              {/* Header Row */}
              <div className="flex border-b border-stone-100 dark:border-stone-800 shrink-0 pl-12 bg-white dark:bg-stone-900 z-10">
                  {weekDays.map((date, idx) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                          <div key={idx} className="flex-1 text-center py-2 border-r border-stone-50 dark:border-stone-800 last:border-none">
                              <div className={`text-xs font-bold uppercase ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-400'}`}>
                                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className={`text-sm font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-800 dark:text-stone-200'}`}>
                                  {date.getDate()}
                              </div>
                          </div>
                      );
                  })}
              </div>

              {/* All Day Row for Week */}
              <div className="flex border-b border-stone-100 dark:border-stone-800 shrink-0 bg-stone-50/30 dark:bg-stone-800/30">
                  <div className="w-12 flex items-center justify-end pr-2 text-[9px] font-bold text-stone-400 uppercase shrink-0 border-r border-stone-100 dark:border-stone-800 py-2">
                       All Day
                  </div>
                  {weekDays.map((date, idx) => {
                      const { allDayTasks } = getTaskGroups(date);
                      return (
                          <div 
                            key={idx} 
                            className="flex-1 border-r border-stone-100 dark:border-stone-800 last:border-none p-1 min-h-[40px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, date)}
                          >
                              <div className="flex flex-col gap-1">
                                  {allDayTasks.map(task => (
                                      <div 
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onClick={(e) => { e.stopPropagation(); onSelectTask(task); }}
                                        className={`px-1.5 py-0.5 rounded text-[9px] truncate ${getTaskStyles(task)} cursor-grab active:cursor-grabbing border-l-2`}
                                        title={task.title}
                                      >
                                          {task.title}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )
                  })}
              </div>

              {/* Grid Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef}>
                  {timeSlots.map(hour => (
                      <div key={hour} data-hour={hour} className="flex min-h-[5rem] h-20 border-b border-stone-100 dark:border-stone-800">
                           {/* Time Label Column */}
                           <div className="w-12 flex items-center justify-end pr-2 text-[9px] font-bold text-stone-400 uppercase shrink-0 border-r border-stone-100 dark:border-stone-800">
                               {hour === 0 ? '12a' : hour > 12 ? `${hour - 12}p` : hour === 12 ? '12p' : `${hour}a`}
                           </div>

                           {/* Days Columns */}
                           {weekDays.map((date, dayIdx) => {
                               const { timedTasks } = getTaskGroups(date);
                               const tasksInHour = timedTasks.filter(t => {
                                   const d = new Date(t.deadline || 0);
                                   return d.getHours() === hour;
                               });
                               
                               const dateForSlot = new Date(date);
                               dateForSlot.setHours(hour, 0, 0, 0);

                               return (
                                   <div 
                                      key={dayIdx}
                                      onClick={() => handleSlotClick(dateForSlot)}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, date, hour)}
                                      className="flex-1 border-r border-stone-50 dark:border-stone-800 last:border-none relative hover:bg-stone-50/50 dark:hover:bg-stone-800/50 group p-0.5 overflow-hidden cursor-cell"
                                   >
                                       {/* Tasks in slot */}
                                       <div className="h-full flex flex-row gap-0.5 overflow-hidden">
                                           {tasksInHour.map(task => (
                                               <div 
                                                   key={task.id}
                                                   draggable
                                                   onDragStart={(e) => handleDragStart(e, task.id)}
                                                   onClick={(e) => { e.stopPropagation(); onSelectTask(task); }}
                                                   className={`flex-1 min-w-0 h-full max-h-[100%] rounded-sm px-1 text-[8px] leading-tight truncate ${getTaskStyles(task)} border-l-2 cursor-grab active:cursor-grabbing ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                                                   title={task.title}
                                               >
                                                   {task.title}
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               );
                           })}
                      </div>
                  ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

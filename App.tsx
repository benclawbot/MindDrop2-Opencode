import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Task, ColumnId, Priority, Tag } from './types'
import { NewTaskInput, NewTaskInputHandle } from './components/NewTaskInput'
import { TaskCard } from './components/TaskCard'
import { TaskModal } from './components/TaskModal'
// import { AuthView } from './components/AuthView'; // [BYPASS-AUTH] Legacy auth screen, no longer used.
import { PlanningView } from './components/PlanningView'
import { FocusMode } from './components/FocusMode'
import { MeetingStudio } from './components/MeetingStudio'
import { DocumentationModal } from './components/DocumentationModal'
import {
  BrainCircuitIcon,
  SunIcon,
  MoonIcon,
  WandIcon,
  FilterIcon,
  XIcon,
  PlusIcon,
  CircleIcon,
  CheckCircleIcon,
} from './components/Icons'
import { useTasks } from './hooks/useTasks'
import { getWorkspaceUid } from './services/storage'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'reminder'
  taskId?: string
}

const ToastContainer = React.memo(
  ({ toasts, onAction }: { toasts: Toast[]; onAction?: (taskId: string) => void }) => {
    return (
      <div className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-[100] flex flex-col gap-2 pointer-events-none max-w-[90vw]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-right-5 fade-in duration-300 border ${
              toast.type === 'reminder'
                ? 'bg-indigo-600/95 text-white border-indigo-400'
                : 'bg-stone-900/90 dark:bg-stone-100/95 text-white dark:text-stone-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  toast.type === 'success'
                    ? 'bg-emerald-400'
                    : toast.type === 'error'
                      ? 'bg-rose-400'
                      : toast.type === 'reminder'
                        ? 'bg-white animate-pulse'
                        : 'bg-blue-400'
                }`}
              />
              <span className="text-[10px] sm:text-xs font-bold">{toast.message}</span>
            </div>
            {toast.type === 'reminder' && toast.taskId && (
              <button
                onClick={() => onAction?.(toast.taskId!)}
                className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
              >
                View
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }
)

const App: React.FC = () => {
  const [user] = useState<{ uid: string }>(() => ({ uid: getWorkspaceUid() }))
  const {
    tasks,
    tags,
    addTask: hookAddTask,
    addTasksBatch: hookAddTasksBatch,
    updateTask: hookUpdateTask,
    deleteTask: hookDeleteTask,
    addTag: hookAddTag,
  } = useTasks()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [focusingTask, setFocusingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'board' | 'plan' | 'meeting'>('board')
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    JSON.parse(localStorage.getItem('minddrop-darkmode') || 'false')
  )
  const [toasts, setToasts] = useState<Toast[]>([])

  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  const [showFilters, setShowFilters] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All')
  const [filterTag, setFilterTag] = useState<string | 'All'>('All')
  const [filterUrgency, setFilterUrgency] = useState<'All' | 'Today' | 'Overdue' | 'Week'>('All')

  const [showTagManager, setShowTagManager] = useState(false)
  const [isMobileAddingTask, setIsMobileAddingTask] = useState(false)

  // Mobile column navigation
  const [activeMobileColumn, setActiveMobileColumn] = useState<ColumnId>(ColumnId.Todo)
  const boardScrollRef = useRef<HTMLDivElement>(null)
  const newTaskRef = useRef<NewTaskInputHandle>(null)

  // Sync active mobile column with horizontal scroll position
  useEffect(() => {
    const el = boardScrollRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth
        if (w <= 0) return
        const idx = Math.round(el.scrollLeft / w)
        const cols = [ColumnId.Todo, ColumnId.InProgress, ColumnId.Done]
        if (idx >= 0 && idx < cols.length) {
          const next = cols[idx]
          if (next && next !== activeMobileColumn) setActiveMobileColumn(next)
        }
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', onScroll)
    }
  }, [activeMobileColumn])

  // Scroll to a column when the bottom-nav is tapped
  const scrollToMobileColumn = useCallback((col: ColumnId) => {
    const el = boardScrollRef.current
    if (!el) return
    const cols = [ColumnId.Todo, ColumnId.InProgress, ColumnId.Done]
    const idx = cols.indexOf(col)
    if (idx < 0) return
    const target = idx * el.clientWidth
    el.scrollTo({ left: target, behavior: 'smooth' })
    setActiveMobileColumn(col)
  }, [])

  // Index for O(1) lookups
  const taskIndex = useMemo(() => {
    const map = new Map<string, Task>()
    tasks.forEach((t) => map.set(t.id, t))
    return map
  }, [tasks])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', taskId?: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type, taskId }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const updateTask = useCallback(
    async (updatedTask: Task) => {
      if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask)
      if (focusingTask?.id === updatedTask.id) setFocusingTask(updatedTask)
      await hookUpdateTask(updatedTask)
    },
    [hookUpdateTask, selectedTask, focusingTask]
  )

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      if (isTyping && e.key !== 'Escape') return

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault()
          newTaskRef.current?.expand()
          newTaskRef.current?.focus()
          break
        case 'f':
          e.preventDefault()
          handleMagicFocus()
          break
        case '/':
          e.preventDefault()
          setShowFilters(true)
          // Search focus logic could be added here if search input has a ref
          break
        case '1':
          if (e.altKey || e.metaKey) setViewMode('board')
          break
        case '2':
          if (e.altKey || e.metaKey) setViewMode('plan')
          break
        case '3':
          if (e.altKey || e.metaKey) setViewMode('meeting')
          break
        case 'escape':
          setSelectedTask(null)
          setFocusingTask(null)
          setShowFilters(false)
          setShowDocs(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Monitor Deadlines
  useEffect(() => {
    if (
      'Notification' in window &&
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission()
    }

    const checkDeadlines = () => {
      const now = Date.now()
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
      const BUFFER_MS = 30 * 60 * 1000

      tasks.forEach((task) => {
        if (!task.deadline || task.reminderSent || task.columnId === ColumnId.Done) return
        const timeUntilDeadline = task.deadline - now
        if (
          timeUntilDeadline > ONE_WEEK_MS - BUFFER_MS &&
          timeUntilDeadline < ONE_WEEK_MS + BUFFER_MS
        ) {
          if (Notification.permission === 'granted') {
            new Notification('MindDrop Reminder', {
              body: `Task "${task.title}" is due in 1 week!`,
            })
          }
          addToast(`Upcoming: ${task.title} is due in 7 days`, 'reminder', task.id)
          updateTask({ ...task, reminderSent: true })
        }
      })
    }

    const interval = setInterval(checkDeadlines, 5 * 60 * 1000)
    checkDeadlines()
    return () => clearInterval(interval)
  }, [tasks, updateTask, addToast])

  useEffect(() => {
    darkMode
      ? document.documentElement.classList.add('dark')
      : document.documentElement.classList.remove('dark')
    localStorage.setItem('minddrop-darkmode', JSON.stringify(darkMode))
  }, [darkMode])

  const priorityWeight = {
    [Priority.Critical]: 4,
    [Priority.High]: 3,
    [Priority.Medium]: 2,
    [Priority.Low]: 1,
  }

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const weightA = priorityWeight[a.priority]
      const weightB = priorityWeight[b.priority]
      if (weightA !== weightB) return weightB - weightA
      return (a.deadline || Infinity) - (b.deadline || Infinity) || b.createdAt - a.createdAt
    })
  }, [tasks])

  const activeTags = useMemo(() => {
    const usedTagIds = new Set<string>()
    tasks.forEach((t) => t.tags.forEach((tagId) => usedTagIds.add(tagId)))
    return tags.filter((tag) => usedTagIds.has(tag.id))
  }, [tags, tasks])

  const handleAddTag = async (tag: Tag) => {
    await hookAddTag(tag)
  }

  const addTask = async (task: Task) => {
    await hookAddTask(task)
    addToast('Task dropped', 'success')
    setIsMobileAddingTask(false)
  }

  const addTasksBatch = async (newTasks: Task[]) => {
    if (newTasks.length === 0) return
    await hookAddTasksBatch(newTasks)
    addToast(`${newTasks.length} missions synced`, 'success')
  }

  const deleteTask = async (taskId: string) => {
    if (selectedTask?.id === taskId) setSelectedTask(null)
    await hookDeleteTask(taskId)
    addToast('Task deleted', 'info')
  }

  const handleMagicFocus = () => {
    const availableTasks = tasks.filter((t) => t.columnId !== ColumnId.Done)
    if (availableTasks.length === 0) return addToast('Nothing to focus on', 'info')
    const sorted = availableTasks.sort(
      (a, b) =>
        priorityWeight[b.priority] - priorityWeight[a.priority] ||
        (a.deadline || Infinity) - (b.deadline || Infinity)
    )
    const bestTask = sorted[0]
    if (!bestTask) return addToast('Nothing to focus on', 'info')
    setFocusTaskId(bestTask.id)
    setFocusingTask(bestTask)
    setTimeout(() => setFocusTaskId(null), 8000)
  }

  const filteredTasks = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const query = searchQuery.toLowerCase()
    return sortedTasks.filter((t) => {
      const matchesSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      const matchesPriority = filterPriority === 'All' || t.priority === filterPriority
      const matchesTag = filterTag === 'All' || t.tags.includes(filterTag)
      let matchesUrgency = true
      if (filterUrgency === 'Today')
        matchesUrgency = !!(
          t.deadline &&
          t.deadline >= startOfToday &&
          t.deadline < startOfToday + 86400000
        )
      else if (filterUrgency === 'Overdue')
        matchesUrgency = !!(t.deadline && t.deadline < startOfToday)
      return matchesSearch && matchesPriority && matchesTag && matchesUrgency
    })
  }, [sortedTasks, searchQuery, filterPriority, filterTag, filterUrgency])

  if (!user)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <BrainCircuitIcon className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )

  return (
    <div className="h-screen w-full font-sans flex flex-col overflow-hidden bg-stone-100 dark:bg-stone-950 text-stone-800 dark:text-stone-100 selection:bg-indigo-500/30">
      <header className="flex-none py-2 px-4 sm:px-8 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border-b border-stone-200 dark:border-white/5 z-30">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl shadow-lg flex items-center justify-center text-white">
              <BrainCircuitIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <h1 className="text-xs sm:text-sm font-black tracking-widest text-stone-900 dark:text-white uppercase">
                MindDrop
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex bg-stone-200/50 dark:bg-stone-800 p-1 rounded-xl mr-2">
              <button
                onClick={() => setViewMode('board')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'board' ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-white shadow-sm' : 'text-stone-500'}`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('plan')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'plan' ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-white shadow-sm' : 'text-stone-500'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('meeting')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'meeting' ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-white shadow-sm' : 'text-stone-500'}`}
              >
                Minutes
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/5 text-stone-500'}`}
              title="Filters (/)"
            >
              <FilterIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleMagicFocus}
              className="hidden sm:flex p-2 rounded-xl bg-indigo-600 text-white shadow-lg active:scale-95 transition-all"
              title="Focus AI (F)"
            >
              <WandIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/5 text-stone-500"
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            {/* [BYPASS-AUTH] Legacy logout disabled for local-first Vercel access. */}
            {/* <button onClick={() => FirebaseService.signOut()} className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest ml-2 hover:opacity-80 transition-opacity">Logout</button> */}
          </div>
        </div>
        {showFilters && (
          <div className="max-w-[1600px] mx-auto py-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-stone-50 dark:bg-white/5 p-4 rounded-3xl border border-stone-200 dark:border-white/5">
              <div className="flex-1">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search missions..."
                  className="w-full bg-white dark:bg-stone-900 px-5 py-2.5 rounded-2xl text-[12px] font-bold border border-stone-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="bg-white dark:bg-stone-900 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase border border-stone-200 dark:border-white/10 outline-none cursor-pointer"
                >
                  <option value="All">Priorities</option>
                  {Object.values(Priority).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="bg-white dark:bg-stone-900 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase border border-stone-200 dark:border-white/10 outline-none cursor-pointer"
                >
                  <option value="All">All Tags</option>
                  {activeTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                {searchQuery || filterPriority !== 'All' || filterTag !== 'All' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilterPriority('All')
                      setFilterTag('All')
                    }}
                    className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-lg"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {viewMode === 'board' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="hidden sm:block px-8 py-6 w-full max-w-xl mx-auto z-20">
              <NewTaskInput
                ref={newTaskRef}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                allTags={tags}
                onAddTag={handleAddTag}
              />
            </div>
            <div
              ref={boardScrollRef}
              className="flex-1 flex gap-4 sm:gap-8 overflow-x-auto snap-x snap-mandatory lg:snap-none no-scrollbar max-w-[1600px] mx-auto w-full px-4 sm:px-8 pb-28 sm:pb-8"
            >
              {[ColumnId.Todo, ColumnId.InProgress, ColumnId.Done].map((colId) => {
                const colTasks = filteredTasks.filter((t) => t.columnId === colId)
                return (
                  <div
                    key={colId}
                    className="flex-1 flex flex-col min-w-[88vw] sm:min-w-[360px] snap-center sm:snap-align-none overflow-hidden rounded-[2.5rem] border border-stone-200 dark:border-white/5 bg-stone-50/40 dark:bg-white/5 transition-all"
                  >
                    <div className="flex items-center justify-between px-8 py-7 shrink-0 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md">
                      <h2 className="font-black text-[11px] uppercase tracking-[0.3em] text-stone-500">
                        {colId.replace('-', ' ')}
                      </h2>
                      <span className="text-[11px] font-black bg-white dark:bg-stone-800 px-3.5 py-1.5 rounded-xl text-stone-400">
                        {colTasks.length}
                      </span>
                    </div>
                    <div
                      className="flex-1 overflow-y-auto no-scrollbar px-4 pt-2 pb-24 space-y-4"
                      style={{ contentVisibility: 'auto' }}
                    >
                      {colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          allTags={tags}
                          onClick={() => setSelectedTask(task)}
                          onUpdate={updateTask}
                          onDelete={() => deleteTask(task.id)}
                          onDragStart={() => setDraggedTaskId(task.id)}
                          isFocused={focusTaskId === task.id}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : viewMode === 'plan' ? (
          <PlanningView
            tasks={tasks}
            onUpdateTask={updateTask}
            onAddTask={addTask}
            onSelectTask={setSelectedTask}
            allTags={tags}
            onAddTag={handleAddTag}
          />
        ) : (
          <MeetingStudio onAddTask={addTask} />
        )}
      </main>
      {/* Mobile bottom column nav (mobile only) */}
      {viewMode === 'board' && (
        <nav
          aria-label="Columns"
          className="sm:hidden fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 px-3 bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl border-t border-stone-200 dark:border-white/10"
        >
          <div className="flex items-stretch gap-2">
            {(
              [
                { id: ColumnId.Todo, label: 'To Do', icon: CircleIcon },
                { id: ColumnId.InProgress, label: 'Doing', icon: BrainCircuitIcon },
                { id: ColumnId.Done, label: 'Done', icon: CheckCircleIcon },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const count = filteredTasks.filter((t) => t.columnId === id).length
              const active = activeMobileColumn === id
              return (
                <button
                  key={id}
                  onClick={() => scrollToMobileColumn(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-all active:scale-95 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                  <span
                    className={`text-[9px] font-bold ${
                      active ? 'text-white/80' : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* Mobile FAB: open new-task input as a bottom sheet */}
      {viewMode === 'board' && (
        <button
          onClick={() => {
            setIsMobileAddingTask(true)
            // expand the input when the sheet opens
            requestAnimationFrame(() => newTaskRef.current?.expand())
          }}
          aria-label="New task"
          className="sm:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 flex items-center justify-center active:scale-95 transition-transform"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <PlusIcon className="w-7 h-7" />
        </button>
      )}

      {/* Mobile new-task sheet */}
      {isMobileAddingTask && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileAddingTask(false)}
            aria-hidden
          />
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl border-t border-stone-200 dark:border-white/10 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-500">
                New mission
              </h3>
              <button
                onClick={() => setIsMobileAddingTask(false)}
                aria-label="Close"
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <NewTaskInput
              ref={newTaskRef}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              allTags={tags}
              onAddTag={handleAddTag}
              onCancel={() => setIsMobileAddingTask(false)}
            />
          </div>
        </div>
      )}

      <ToastContainer
        toasts={toasts}
        onAction={(tid) => {
          const t = taskIndex.get(tid)
          if (t) setSelectedTask(t)
        }}
      />
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          allTags={tags}
          onAddTag={handleAddTag}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
      {focusingTask && (
        <FocusMode
          task={focusingTask}
          onClose={() => setFocusingTask(null)}
          onUpdateTask={updateTask}
        />
      )}
      {showDocs && <DocumentationModal onClose={() => setShowDocs(false)} />}
    </div>
  )
}

export default App

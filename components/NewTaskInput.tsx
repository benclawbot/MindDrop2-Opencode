import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { ColumnId, Priority, Task, Tag } from '../types'
import * as AIService from '../services/ai'
import { CheckIcon, ImageIcon, XIcon } from './Icons'
import { getText } from '../i18n'

interface NewTaskInputProps {
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  allTags: Tag[]
  onAddTag: (tag: Tag) => void
  autoPrompt?: string | null
  onCancel?: () => void
}

export interface NewTaskInputHandle {
  focus: () => void
  setDeadline: (date: number | undefined) => void
  expand: () => void
}

const capitalize = (s: string) => {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const TAG_COLORS = [
  'bg-red-100 text-red-800 border-red-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-violet-100 text-violet-800 border-violet-200',
]

export const NewTaskInput = forwardRef<NewTaskInputHandle, NewTaskInputProps>(
  ({ onAddTask, onUpdateTask, allTags, onAddTag, onCancel }, ref) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [imageBase64, setImageBase64] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [autoStatus, setAutoStatus] = useState<string>('')

    const inputRef = useRef<HTMLInputElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      setDeadline: () => {},
      expand: () => setIsExpanded(true),
    }))

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImageBase64(reader.result as string)
          setIsExpanded(true)
        }
        reader.readAsDataURL(file)
      }
    }

    const processTags = (text: string): string[] => {
      const hashtags = text.match(/#[\w\d]+/g) || []
      const extractedTagIds: string[] = []
      hashtags.forEach((ht) => {
        const tagName = ht.replace('#', '').toLowerCase()
        const existingTag = allTags.find((t) => t.name.toLowerCase() === tagName)
        if (!existingTag) {
          const colorIndex = Math.floor(Math.random() * TAG_COLORS.length)
          const tagColor = TAG_COLORS[colorIndex]
          const newTag: Tag = {
            id: crypto.randomUUID(),
            name: tagName,
            color: tagColor ?? TAG_COLORS[0] ?? 'bg-gray-100 text-gray-800 border-gray-200',
          }
          onAddTag(newTag)
          extractedTagIds.push(newTag.id)
        } else {
          extractedTagIds.push(existingTag.id)
        }
      })
      return extractedTagIds
    }

    const executeTaskCreation = async (taskInput: string) => {
      if (!taskInput.trim() && !imageBase64) return
      const manualTagIds = processTags(taskInput + ' ' + description)
      const cleanedInput = taskInput.replace(/#[\w\d]+/g, '').trim()
      const tempId = crypto.randomUUID()
      const tempTask: Task = {
        id: tempId,
        title: cleanedInput ? capitalize(cleanedInput) : 'Analyzing Request...',
        description: capitalize(description.trim()),
        priority: Priority.Medium,
        columnId: ColumnId.Todo,
        subtasks: [],
        images: [],
        tags: manualTagIds,
        comments: [],
        attachments: [],
        createdAt: Date.now(),
        isPendingAnalysis: true,
        remainingTime: 0,
      }
      onAddTask(tempTask)
      setTitle('')
      setDescription('')
      setImageBase64(null)
      setIsExpanded(false)
      setIsAnalyzing(true)
      setAutoStatus('Calculating mission scope...')
      try {
        const analysis = await AIService.analyzeNewTask(cleanedInput, tempTask.description)
        const aiTagIds = analysis.tags
          ? processTags(analysis.tags.map((t: string) => `#${t}`).join(' '))
          : []
        const combinedTags = Array.from(new Set([...manualTagIds, ...aiTagIds]))
        let parsedDeadline: number | undefined = undefined
        if (analysis.deadline) {
          const d = new Date(analysis.deadline)
          if (!isNaN(d.getTime())) parsedDeadline = d.getTime()
        }
        const subtasks = analysis.subtasks.map((t: any) => ({
          id: crypto.randomUUID(),
          title: capitalize(t.title),
          completed: false,
          aiAction: t.aiAction,
          estimation: t.estimation || 15,
        }))
        const totalRemaining =
          subtasks.length > 0
            ? subtasks.reduce((sum: number, st: any) => sum + st.estimation, 0)
            : analysis.estimation || 30
        const finalTask: Task = {
          ...tempTask,
          title: capitalize(analysis.cleanedTitle?.trim() || cleanedInput || 'New Task'),
          description: capitalize(analysis.cleanedDescription?.trim() || tempTask.description),
          priority: analysis.priority,
          deadline: parsedDeadline,
          tags: combinedTags,
          subtasks,
          estimation: analysis.estimation,
          remainingTime: totalRemaining,
          isPendingAnalysis: false,
        }
        onUpdateTask(finalTask)
      } catch (error) {
        console.error('Analysis failed', error)
        onUpdateTask({ ...tempTask, isPendingAnalysis: false })
      } finally {
        setIsAnalyzing(false)
        setAutoStatus('')
      }
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      executeTaskCreation(title)
    }

    return (
      <div
        className={`relative transition-all duration-300 z-50 max-w-lg mx-auto ${isExpanded ? 'bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl p-6 border border-stone-200 dark:border-white/5' : 'bg-white/90 dark:bg-stone-800/90 rounded-2xl shadow-md border border-stone-200 dark:border-white/5'}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center h-12">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={autoStatus || getText('newTaskPlaceholder')}
              className="w-full h-full bg-transparent outline-none px-4 text-base font-bold text-stone-800 dark:text-stone-100 placeholder-stone-400"
            />
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"
              title="Add image for AI analysis"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            {!isExpanded && (
              <button
                type="submit"
                disabled={!title.trim() && !imageBase64}
                className="mr-3 ml-2 p-2 bg-indigo-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {imageBase64 && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-black/20 group">
                  <img
                    src={imageBase64}
                    className="w-full h-full object-cover"
                    alt="Vision input"
                  />
                  <button
                    onClick={() => setImageBase64(null)}
                    className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context... (use #hashtags to tag)"
                className="w-full p-4 rounded-2xl bg-stone-50/50 dark:bg-black/20 focus:outline-none text-sm min-h-[100px] border border-stone-100 dark:border-white/5 text-stone-700 dark:text-stone-200 resize-none"
              />
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em]">
                  Press Enter to drop task
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false)
                      onCancel?.()
                    }}
                    className="text-[11px] font-black uppercase text-stone-400 px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={(!title.trim() && !imageBase64) || isAnalyzing}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    )
  }
)

NewTaskInput.displayName = 'NewTaskInput'

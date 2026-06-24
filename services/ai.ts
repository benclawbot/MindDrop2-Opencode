/**
 * AI services backed by MiniMax M2.7 (OpenAI-compatible chat).
 *
 * Replaces the prior Google Gemini implementations. Functions return the same
 * shapes that React components already consume.
 */

import { chat, chatJSON } from './minimax'
import { Priority, Task, Subtask, AIActionType } from '../types'

const todayLocalDate = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SYSTEM_PROMPT =
  'You are an elite productivity assistant for MindDrop. Always respond with strict JSON when asked. Never add commentary outside JSON.'

interface SubtaskSuggestion {
  title: string
  aiAction: AIActionType
  estimation?: number
}

interface TaskAnalysisResult {
  priority: Priority
  estimation: number
  subtasks: SubtaskSuggestion[]
  deadline: string | null
  tags: string[]
  cleanedTitle: string
  cleanedDescription: string
}

export const analyzeNewTask = async (
  title: string,
  description: string
): Promise<TaskAnalysisResult> => {
  const fallback: TaskAnalysisResult = {
    priority: Priority.Medium,
    estimation: 30,
    subtasks: [],
    deadline: null,
    tags: [],
    cleanedTitle: title,
    cleanedDescription: description,
  }

  try {
    const json = await chatJSON<{
      priority?: Priority
      estimation?: number
      subtasks?: SubtaskSuggestion[]
      deadline?: string | null
      tags?: string[]
      cleanedTitle?: string
      cleanedDescription?: string
    }>([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this task creation request. Today is ${todayLocalDate()}.

1. Assign Priority (Low, Medium, High, Critical).
2. Break down into 3-5 actionable subtasks.
3. Extract deadlines in YYYY-MM-DD format.
4. Extract tags ONLY when marked with # in the input.
5. Estimate the WHOLE task in minutes.
6. Return cleanedTitle/cleanedDescription with #tags and dates stripped.

Task Title: "${title}"
Task Description: "${description}"

Return JSON matching: {priority, estimation, subtasks:[{title, aiAction, estimation}], deadline, tags, cleanedTitle, cleanedDescription}`,
      },
    ])

    return {
      priority: (json.priority as Priority) || Priority.Medium,
      estimation: json.estimation ?? 30,
      subtasks: Array.isArray(json.subtasks) ? json.subtasks : [],
      deadline: json.deadline ?? null,
      tags: Array.isArray(json.tags) ? json.tags : [],
      cleanedTitle: json.cleanedTitle ?? title,
      cleanedDescription: json.cleanedDescription ?? description,
    }
  } catch (e) {
    console.error('analyzeNewTask failed:', e)
    return fallback
  }
}

export const suggestSubtasks = async (
  title: string,
  description: string
): Promise<SubtaskSuggestion[]> => {
  try {
    return await chatJSON<SubtaskSuggestion[]>([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Break down the following task into 3-5 actionable subtasks with time estimations in minutes. Task: ${title}. Context: ${description}. Return a JSON array of {title, aiAction: "content"|"code"|"image"|"none", estimation}.`,
      },
    ])
  } catch (e) {
    console.error('suggestSubtasks failed:', e)
    return []
  }
}

export const processMeetingNotes = async (
  rawText: string
): Promise<{ html: string; extractedTasks: any[] }> => {
  try {
    return await chatJSON<{ html: string; extractedTasks: any[] }>([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Process meeting notes into HTML and extract tasks with priorities, deadlines, and time estimations in minutes. Notes: "${rawText}". Return JSON {html: string, extractedTasks: [{title, deadline, priority, estimation}]}.`,
      },
    ])
  } catch (e) {
    console.error('processMeetingNotes failed:', e)
    return { html: '<p>Failed to process notes.</p>', extractedTasks: [] }
  }
}

export const chatWithCoach = async (
  task: Task,
  chatHistory: { role: string; content: string }[],
  _newMessage: string
): Promise<{ text: string; sources: any[] }> => {
  try {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an elite productivity coach for the task "${task.title}". Help the user manage their ${task.remainingTime ?? 30} minutes remaining for this mission. Provide concise, actionable advice.`,
      },
      ...chatHistory.map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
    ]

    const { text } = await chat(messages, { temperature: 0.8 })
    return { text: text || 'No response from coach.', sources: [] }
  } catch (e) {
    console.error('chatWithCoach failed:', e)
    return { text: 'Coach unavailable.', sources: [] }
  }
}

export const generateSubtaskContent = async (task: Task, subtask: Subtask): Promise<string> => {
  try {
    const { text } = await chat([
      {
        role: 'system',
        content: 'You write concise, professional drafts.',
      },
      {
        role: 'user',
        content: `Write a detailed, professional draft for: "${subtask.title}". Project Context: ${task.title}.`,
      },
    ])
    return text || 'Draft could not be generated.'
  } catch (e) {
    console.error('generateSubtaskContent failed:', e)
    return 'Draft could not be generated.'
  }
}

export const synthesizeProjectHTML = async (task: Task): Promise<string> => {
  try {
    const subtasksData = task.subtasks
      .filter((s) => s.content)
      .map((s) => `Title: ${s.title}\nContent: ${s.content}`)
      .join('\n---\n')
    const { text } = await chat([
      {
        role: 'user',
        content: `Synthesize findings for project: "${task.title}".\n${subtasksData}`,
      },
    ])
    return text || '<h1>No synthesis</h1>'
  } catch (e) {
    console.error('synthesizeProjectHTML failed:', e)
    return '<h1>Error</h1>'
  }
}

export const magicFillDescription = async (title: string, currentDesc: string): Promise<string> => {
  try {
    const { text } = await chat([
      {
        role: 'system',
        content: 'You improve task descriptions to be clear, specific, and actionable.',
      },
      {
        role: 'user',
        content: `Improve this description for "${title}": ${currentDesc}`,
      },
    ])
    return text || currentDesc
  } catch (e) {
    console.error('magicFillDescription failed:', e)
    return currentDesc
  }
}

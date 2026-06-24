/**
 * Local-only persistence for MindDrop.
 *
 * Replaces Firestore with a localStorage-backed store. Tasks and tags are
 * keyed per user (currently always the local guest workspace). Cross-tab sync
 * uses the native `storage` event.
 */

import type { Task, Tag } from '../types'

const TASKS_KEY = (uid: string) => `minddrop-tasks-${uid}`
const TAGS_KEY = (uid: string) => `minddrop-tags-${uid}`
const WORKSPACE_UID = 'guest-local'

const listeners: Set<() => void> = new Set()

const notify = () => listeners.forEach((cb) => cb())

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key) return
    if (e.key.startsWith('minddrop-tasks-') || e.key.startsWith('minddrop-tags-')) {
      notify()
    }
  })
}

export const getWorkspaceUid = (): string => WORKSPACE_UID

export const loadTasks = (uid: string = WORKSPACE_UID): Task[] => {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY(uid)) || '[]') as Task[]
  } catch {
    return []
  }
}

export const saveTasks = (tasks: Task[], uid: string = WORKSPACE_UID): void => {
  localStorage.setItem(TASKS_KEY(uid), JSON.stringify(tasks))
  notify()
}

export const loadTags = (uid: string = WORKSPACE_UID): Tag[] => {
  try {
    return JSON.parse(localStorage.getItem(TAGS_KEY(uid)) || '[]') as Tag[]
  } catch {
    return []
  }
}

export const saveTags = (tags: Tag[], uid: string = WORKSPACE_UID): void => {
  localStorage.setItem(TAGS_KEY(uid), JSON.stringify(tags))
  notify()
}

export const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

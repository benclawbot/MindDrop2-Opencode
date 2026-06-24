/**
 * Local-only task/tag store hook.
 *
 * Reads from and writes to localStorage via services/storage. Cross-tab
 * updates trigger a re-render via the storage event listener.
 */

import { useState, useEffect, useCallback } from 'react'
import type { Task, Tag } from '../types'
import * as Storage from '../services/storage'
import { getWorkspaceUid } from '../services/storage'

const STORAGE_UID = getWorkspaceUid()

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => Storage.loadTasks(STORAGE_UID))
  const [tags, setTags] = useState<Tag[]>(() => Storage.loadTags(STORAGE_UID))

  useEffect(() => {
    return Storage.subscribe(() => {
      setTasks(Storage.loadTasks(STORAGE_UID))
      setTags(Storage.loadTags(STORAGE_UID))
    })
  }, [])

  const addTask = useCallback(async (task: Task) => {
    setTasks((prev) => {
      const next = [task, ...prev]
      Storage.saveTasks(next, STORAGE_UID)
      return next
    })
  }, [])

  const addTasksBatch = useCallback(async (newTasks: Task[]) => {
    if (newTasks.length === 0) return
    setTasks((prev) => {
      const next = [...newTasks, ...prev]
      Storage.saveTasks(next, STORAGE_UID)
      return next
    })
  }, [])

  const updateTask = useCallback(async (updatedTask: Task) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      Storage.saveTasks(next, STORAGE_UID)
      return next
    })
  }, [])

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId)
      Storage.saveTasks(next, STORAGE_UID)
      return next
    })
  }, [])

  const addTag = useCallback(async (tag: Tag) => {
    setTags((prev) => {
      const next = [...prev, tag]
      Storage.saveTags(next, STORAGE_UID)
      return next
    })
  }, [])

  return {
    tasks,
    tags,
    addTask,
    addTasksBatch,
    updateTask,
    deleteTask,
    addTag,
  }
}

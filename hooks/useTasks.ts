import { useState, useEffect, useCallback } from 'react'
import { Task, Tag } from '../types'
import * as FirebaseService from '../services/firebase'
import type { AuthUser } from './useAuth'

export function useTasks(user: AuthUser | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    if (!user) {
      setTasks([])
      setTags([])
      return
    }

    if (FirebaseService.isConfigured && !user.isGuest) {
      const tasksRef = FirebaseService.collection(
        FirebaseService.db,
        'users',
        user.uid,
        'tasks'
      )
      const unsubTasks = FirebaseService.onSnapshot(tasksRef, (snapshot) => {
        setTasks(snapshot.docs.map((d) => d.data() as Task))
      })

      const tagsRef = FirebaseService.collection(
        FirebaseService.db,
        'users',
        user.uid,
        'tags'
      )
      const unsubTags = FirebaseService.onSnapshot(tagsRef, (snapshot) => {
        setTags(snapshot.docs.map((d) => d.data() as Tag))
      })

      return () => {
        unsubTasks()
        unsubTags()
      }
    } else {
      setTasks(
        JSON.parse(localStorage.getItem(`minddrop-tasks-${user.uid}`) || '[]')
      )
      setTags(
        JSON.parse(localStorage.getItem(`minddrop-tags-${user.uid}`) || '[]')
      )
    }
  }, [user])

  const addTask = useCallback(
    async (task: Task) => {
      if (!user) return
      setTasks((prev) => [task, ...prev])

      if (FirebaseService.isConfigured && !user.isGuest) {
        await FirebaseService.setDoc(
          FirebaseService.doc(
            FirebaseService.db,
            'users',
            user.uid,
            'tasks',
            task.id
          ),
          task
        )
      } else {
        const current = JSON.parse(
          localStorage.getItem(`minddrop-tasks-${user.uid}`) || '[]'
        )
        localStorage.setItem(
          `minddrop-tasks-${user.uid}`,
          JSON.stringify([task, ...current])
        )
      }
    },
    [user]
  )

  const addTasksBatch = useCallback(
    async (newTasks: Task[]) => {
      if (!user || newTasks.length === 0) return
      setTasks((prev) => [...newTasks, ...prev])

      if (FirebaseService.isConfigured && !user.isGuest) {
        for (const t of newTasks) {
          await FirebaseService.setDoc(
            FirebaseService.doc(
              FirebaseService.db,
              'users',
              user.uid,
              'tasks',
              t.id
            ),
            t
          )
        }
      } else {
        const current = JSON.parse(
          localStorage.getItem(`minddrop-tasks-${user.uid}`) || '[]'
        )
        localStorage.setItem(
          `minddrop-tasks-${user.uid}`,
          JSON.stringify([...newTasks, ...current])
        )
      }
    },
    [user]
  )

  const updateTask = useCallback(
    async (updatedTask: Task) => {
      if (!user) return
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))

      if (FirebaseService.isConfigured && !user.isGuest) {
        await FirebaseService.setDoc(
          FirebaseService.doc(
            FirebaseService.db,
            'users',
            user.uid,
            'tasks',
            updatedTask.id
          ),
          updatedTask
        )
      } else {
        const current = JSON.parse(
          localStorage.getItem(`minddrop-tasks-${user.uid}`) || '[]'
        )
        const next = current.map((t: Task) =>
          t.id === updatedTask.id ? updatedTask : t
        )
        localStorage.setItem(
          `minddrop-tasks-${user.uid}`,
          JSON.stringify(next)
        )
      }
    },
    [user]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user) return
      setTasks((prev) => prev.filter((t) => t.id !== taskId))

      if (FirebaseService.isConfigured && !user.isGuest) {
        await FirebaseService.deleteDoc(
          FirebaseService.doc(
            FirebaseService.db,
            'users',
            user.uid,
            'tasks',
            taskId
          )
        )
      } else {
        const current = JSON.parse(
          localStorage.getItem(`minddrop-tasks-${user.uid}`) || '[]'
        )
        localStorage.setItem(
          `minddrop-tasks-${user.uid}`,
          JSON.stringify(current.filter((t: Task) => t.id !== taskId))
        )
      }
    },
    [user]
  )

  const addTag = useCallback(
    async (tag: Tag) => {
      if (!user) return
      setTags((prev) => [...prev, tag])

      if (FirebaseService.isConfigured && !user.isGuest) {
        await FirebaseService.setDoc(
          FirebaseService.doc(
            FirebaseService.db,
            'users',
            user.uid,
            'tags',
            tag.id
          ),
          tag
        )
      } else {
        const current = JSON.parse(
          localStorage.getItem(`minddrop-tags-${user.uid}`) || '[]'
        )
        localStorage.setItem(
          `minddrop-tags-${user.uid}`,
          JSON.stringify([...current, tag])
        )
      }
    },
    [user]
  )

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

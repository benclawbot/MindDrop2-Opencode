import { useState, useCallback, useRef } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'reminder'
  taskId?: string
  undoAction?: () => void
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addToast = useCallback(
    (
      message: string,
      type: Toast['type'] = 'info',
      taskId?: string,
      undoAction?: () => void
    ) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, type, taskId, undoAction }])

      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }

      const timeout = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)

      undoTimeoutRef.current = timeout
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
    }
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  }
}

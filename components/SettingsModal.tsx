import React, { useRef } from 'react'
import { XIcon, DownloadIcon, UploadIcon } from './Icons'
import { getText } from '../i18n'
import { Task, Tag } from '../types'

interface SettingsModalProps {
  tasks: Task[]
  tags: Tag[]
  onImportTasks: (tasks: Task[]) => void
  onImportTags: (tags: Tag[]) => void
  onClose: () => void
}

export function SettingsModal({
  tasks,
  tags,
  onImportTasks,
  onImportTags,
  onClose,
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = {
      tasks,
      tags,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minddrop-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.tasks && Array.isArray(data.tasks)) {
          onImportTasks(data.tasks)
        }
        if (data.tags && Array.isArray(data.tags)) {
          onImportTags(data.tags)
        }
        onClose()
      } catch (error) {
        console.error('Failed to import:', error)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-white/10">
          <h2 id="settings-title" className="text-xl font-bold text-stone-800 dark:text-white">
            {getText('settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={getText('close')}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
            <h3 className="font-semibold text-stone-800 dark:text-white mb-2">
              {getText('backupData')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
              {getText('exportDescription')}
            </p>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <DownloadIcon className="w-5 h-5" />
              {getText('export')}
            </button>
          </div>

          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
            <h3 className="font-semibold text-stone-800 dark:text-white mb-2">
              {getText('restoreData')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
              {getText('importDescription')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-white rounded-xl font-semibold hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              <UploadIcon className="w-5 h-5" />
              {getText('import')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

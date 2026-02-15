import { useState, useMemo } from 'react'
import { Task, Priority, ColumnId } from '../types'

export type FilterPriority = Priority | 'All'
export type FilterUrgency = 'All' | 'Today' | 'Overdue' | 'Week'

export function useFilters(tasks: Task[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('All')
  const [filterTag, setFilterTag] = useState<string | 'All'>('All')
  const [filterUrgency, setFilterUrgency] = useState<FilterUrgency>('All')
  const [showFilters, setShowFilters] = useState(false)

  const priorityWeight: Record<Priority, number> = {
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
      return (
        (a.deadline || Infinity) - (b.deadline || Infinity) ||
        b.createdAt - a.createdAt
      )
    })
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime()
    const query = searchQuery.toLowerCase()

    return sortedTasks.filter((t) => {
      const matchesSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      const matchesPriority =
        filterPriority === 'All' || t.priority === filterPriority
      const matchesTag = filterTag === 'All' || t.tags.includes(filterTag)

      let matchesUrgency = true
      if (filterUrgency === 'Today') {
        matchesUrgency = !!(
          t.deadline &&
          t.deadline >= startOfToday &&
          t.deadline < startOfToday + 86400000
        )
      } else if (filterUrgency === 'Overdue') {
        matchesUrgency = !!(t.deadline && t.deadline < startOfToday)
      }

      return matchesSearch && matchesPriority && matchesTag && matchesUrgency
    })
  }, [sortedTasks, searchQuery, filterPriority, filterTag, filterUrgency])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterPriority('All')
    setFilterTag('All')
  }

  const activeTagIds = useMemo(() => {
    const usedTagIds = new Set<string>()
    tasks.forEach((t) => t.tags.forEach((tagId) => usedTagIds.add(tagId)))
    return usedTagIds
  }, [tasks])

  return {
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterTag,
    setFilterTag,
    filterUrgency,
    setFilterUrgency,
    showFilters,
    setShowFilters,
    filteredTasks,
    sortedTasks,
    clearFilters,
    activeTagIds,
  }
}

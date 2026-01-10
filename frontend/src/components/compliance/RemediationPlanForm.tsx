/**
 * Remediation Plan Form
 *
 * Form component for creating and editing remediation plans for compliance findings.
 * Supports task management with drag-and-drop reordering, due dates, and owner assignment.
 */

'use client'

import { useState, useCallback } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import { complianceApi } from '@/lib/compliance-api'

// Remediation plan status
type RemediationStatus = 'draft' | 'in_progress' | 'pending_verification' | 'verified' | 'closed'

const REMEDIATION_STATUSES: RemediationStatus[] = [
  'draft',
  'in_progress',
  'pending_verification',
  'verified',
  'closed',
]

const STATUS_LABELS: Record<RemediationStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  closed: 'Closed',
}

const STATUS_COLORS: Record<RemediationStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  pending_verification: 'bg-yellow-500/20 text-yellow-400',
  verified: 'bg-green-500/20 text-green-400',
  closed: 'bg-purple-500/20 text-purple-400',
}

// Task interface
interface RemediationTask {
  id: string
  title: string
  description?: string
  assignee?: string
  dueDate?: string
  completed: boolean
  order: number
}

// Plan interface
interface RemediationPlan {
  id?: string
  title: string
  description: string
  status: RemediationStatus
  dueDate: string
  owner: string
  tasks: RemediationTask[]
}

interface RemediationPlanFormProps {
  findingId: string
  assessmentId?: string
  initialPlan?: RemediationPlan
  onSave?: (plan: RemediationPlan) => void
  onCancel?: () => void
  className?: string
}

export function RemediationPlanForm({
  findingId,
  assessmentId,
  initialPlan,
  onSave,
  onCancel,
  className,
}: RemediationPlanFormProps) {
  const tc = useThemeClasses()

  // Form state
  const [title, setTitle] = useState(initialPlan?.title || '')
  const [description, setDescription] = useState(initialPlan?.description || '')
  const [status, setStatus] = useState<RemediationStatus>(initialPlan?.status || 'draft')
  const [dueDate, setDueDate] = useState(initialPlan?.dueDate || '')
  const [owner, setOwner] = useState(initialPlan?.owner || '')
  const [tasks, setTasks] = useState<RemediationTask[]>(initialPlan?.tasks || [])

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Add new task
  const addTask = useCallback(() => {
    const newTask: RemediationTask = {
      id: generateId(),
      title: '',
      completed: false,
      order: tasks.length,
    }
    setTasks((prev) => [...prev, newTask])
  }, [tasks.length])

  // Update task
  const updateTask = useCallback((id: string, updates: Partial<RemediationTask>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    )
  }, [])

  // Remove task
  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  // Toggle task completion
  const toggleTaskCompletion = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }, [])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    if (!draggedTaskId || draggedTaskId === targetTaskId) return

    setTasks((prev) => {
      const draggedIndex = prev.findIndex((t) => t.id === draggedTaskId)
      const targetIndex = prev.findIndex((t) => t.id === targetTaskId)

      if (draggedIndex === -1 || targetIndex === -1) return prev

      const newTasks = [...prev]
      const [draggedTask] = newTasks.splice(draggedIndex, 1)
      if (draggedTask) {
        newTasks.splice(targetIndex, 0, draggedTask)
      }

      // Update order values
      return newTasks.map((task, index) => ({ ...task, order: index }))
    })
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
  }

  // Save plan
  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!dueDate) {
      setError('Due date is required')
      return
    }
    if (!owner.trim()) {
      setError('Owner is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const plan: RemediationPlan = {
        id: initialPlan?.id,
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate,
        owner: owner.trim(),
        tasks: tasks.map((task, index) => ({ ...task, order: index })),
      }

      // Save via API (using a generic endpoint)
      if (initialPlan?.id) {
        await complianceApi.updateFinding(findingId, {
          remediationPlan: plan,
        } as any)
      } else {
        await complianceApi.updateFinding(findingId, {
          remediationPlan: plan,
        } as any)
      }

      onSave?.(plan)
    } catch (err) {
      console.error('Failed to save remediation plan:', err)
      setError('Failed to save plan. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate progress
  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={cn('text-lg font-semibold', tc.textPrimary)}>
          {initialPlan?.id ? 'Edit Remediation Plan' : 'Create Remediation Plan'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className={cn('p-2 rounded-lg', tc.buttonGhost)}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter remediation plan title..."
          className={cn('w-full px-4 py-2 rounded-lg border', tc.input)}
        />
      </div>

      {/* Description */}
      <div>
        <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the remediation approach..."
          rows={3}
          className={cn('w-full px-4 py-2 rounded-lg border resize-none', tc.input)}
        />
      </div>

      {/* Status, Due Date, Owner - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RemediationStatus)}
            className={cn('w-full px-4 py-2 rounded-lg border', tc.input)}
          >
            {REMEDIATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
            Due Date <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Calendar className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={cn('w-full pl-10 pr-4 py-2 rounded-lg border', tc.input)}
            />
          </div>
        </div>

        {/* Owner */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
            Owner <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Assign owner..."
              className={cn('w-full pl-10 pr-4 py-2 rounded-lg border', tc.input)}
            />
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={cn('text-sm', tc.textMuted)}>Current Status:</span>
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={cn('text-sm font-medium', tc.textPrimary)}>
            Tasks
          </label>
          {totalTasks > 0 && (
            <span className={cn('text-xs', tc.textMuted)}>
              {completedTasks}/{totalTasks} completed ({progress}%)
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="h-1.5 bg-gray-700 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-coinest-accent-cyan transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Task list */}
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                tc.border,
                draggedTaskId === task.id && 'opacity-50',
                task.completed && 'opacity-60'
              )}
            >
              {/* Drag handle */}
              <div className={cn('cursor-grab pt-1', tc.textMuted)}>
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Completion toggle */}
              <button
                onClick={() => toggleTaskCompletion(task.id)}
                className="pt-1 shrink-0"
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Circle className={cn('h-5 w-5', tc.textMuted)} />
                )}
              </button>

              {/* Task content */}
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask(task.id, { title: e.target.value })}
                  placeholder="Task title..."
                  className={cn(
                    'w-full bg-transparent border-none outline-none text-sm',
                    tc.textPrimary,
                    task.completed && 'line-through'
                  )}
                />
                <div className="flex items-center gap-3">
                  {/* Task assignee */}
                  <div className="relative flex-1">
                    <User className={cn('absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3', tc.textMuted)} />
                    <input
                      type="text"
                      value={task.assignee || ''}
                      onChange={(e) => updateTask(task.id, { assignee: e.target.value })}
                      placeholder="Assignee"
                      className={cn('w-full pl-7 pr-2 py-1 rounded text-xs border', tc.input)}
                    />
                  </div>
                  {/* Task due date */}
                  <div className="relative flex-1">
                    <Calendar className={cn('absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3', tc.textMuted)} />
                    <input
                      type="date"
                      value={task.dueDate || ''}
                      onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                      className={cn('w-full pl-7 pr-2 py-1 rounded text-xs border', tc.input)}
                    />
                  </div>
                </div>
              </div>

              {/* Remove task */}
              <button
                onClick={() => removeTask(task.id)}
                className={cn('p-1 rounded shrink-0', tc.buttonGhost)}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>

        {/* Add task button */}
        <button
          onClick={addTask}
          className={cn(
            'w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors',
            tc.border,
            'hover:border-coinest-accent-cyan/50 hover:bg-coinest-accent-cyan/5'
          )}
        >
          <Plus className={cn('h-4 w-4', tc.textMuted)} />
          <span className={cn('text-sm', tc.textMuted)}>Add Task</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSaving}
            className={cn('px-4 py-2 rounded-lg', tc.buttonSecondary)}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            tc.buttonPrimary
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Plan
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default RemediationPlanForm
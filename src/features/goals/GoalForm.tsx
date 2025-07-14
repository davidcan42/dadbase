'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Target, Star, X } from 'lucide-react'
import { CreateGoalData } from '@/services/goal.service'

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().optional(),
  category: z.enum(['bonding', 'development', 'personal_growth', 'relationship']),
  targetDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  progress: z.number().min(0).max(100),
})

type GoalFormData = z.infer<typeof goalSchema>

interface GoalFormProps {
  initialData?: Partial<GoalFormData>
  onSubmit: (data: CreateGoalData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

const categoryOptions = [
  { value: 'bonding', label: 'Bonding & Connection', icon: '❤️' },
  { value: 'development', label: 'Child Development', icon: '🌱' },
  { value: 'personal_growth', label: 'Personal Growth', icon: '🚀' },
  { value: 'relationship', label: 'Relationships', icon: '👥' },
]

const priorityOptions = [
  { value: 'low', label: 'Low Priority', icon: '⚪' },
  { value: 'medium', label: 'Medium Priority', icon: '🟡' },
  { value: 'high', label: 'High Priority', icon: '🔴' },
]

export default function GoalForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false, 
  mode = 'create' 
}: GoalFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'personal_growth')
  const [selectedPriority, setSelectedPriority] = useState(initialData?.priority || 'medium')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || 'personal_growth',
      targetDate: initialData?.targetDate || '',
      priority: initialData?.priority || 'medium',
      progress: initialData?.progress || 0,
    },
  })

  const watchedProgress = watch('progress')

  const handleFormSubmit = async (data: GoalFormData) => {
    try {
      const goalData: CreateGoalData = {
        title: data.title,
        description: data.description || undefined,
        category: data.category,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        priority: data.priority,
        progress: data.progress,
      }

      await onSubmit(goalData)
    } catch (error) {
      console.error('Error submitting goal:', error)
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getMinDate = () => {
    return formatDate(new Date())
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as 'bonding' | 'development' | 'personal_growth' | 'relationship')
    setValue('category', value as 'bonding' | 'development' | 'personal_growth' | 'relationship')
  }

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value as 'low' | 'medium' | 'high')
    setValue('priority', value as 'low' | 'medium' | 'high')
  }

  return (
    <div className="dadbase-card w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center">
          <Target className="h-6 w-6 mr-2 text-primary" />
          {mode === 'create' ? 'Create New Goal' : 'Edit Goal'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Goal Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Goal Title *
          </label>
          <input
            id="title"
            {...register('title')}
            placeholder="e.g., Spend 30 minutes of one-on-one time with my child daily"
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Add more details about what you want to achieve and how you plan to do it..."
            rows={3}
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Category & Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Date */}
        <div className="space-y-2">
          <label htmlFor="targetDate" className="block text-sm font-medium text-foreground">
            Target Date (Optional)
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              id="targetDate"
              type="date"
              {...register('targetDate')}
              min={getMinDate()}
              className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Progress (only show in edit mode) */}
        {mode === 'edit' && (
          <div className="space-y-2">
            <label htmlFor="progress" className="block text-sm font-medium text-foreground">
              Progress: {watchedProgress}%
            </label>
            <div className="space-y-2">
              <input
                type="range"
                id="progress"
                {...register('progress', { valueAsNumber: true })}
                min="0"
                max="100"
                step="5"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Star className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Create Goal' : 'Update Goal'}
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 
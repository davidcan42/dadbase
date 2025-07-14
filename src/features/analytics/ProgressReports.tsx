'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface ReportData {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  completionRate: number
  streakData: {
    currentStreak: number
    longestStreak: number
    totalDays: number
  }
  categoryBreakdown: {
    category: string
    total: number
    completed: number
    completionRate: number
  }[]
  monthlyProgress: {
    month: string
    goalsCompleted: number
    goalsCreated: number
    completionRate: number
  }[]
  achievements: {
    id: string
    title: string
    description: string
    dateEarned: string
    type: string
  }[]
  recentGoals: {
    id: string
    title: string
    status: string
    completedDate?: string
    progress: number
  }[]
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'json'
  dateRange: 'all' | 'last30' | 'last90' | 'last365'
  includeAchievements: boolean
  includeStreaks: boolean
  includeCategoryBreakdown: boolean
  includeMonthlyProgress: boolean
}

const ProgressReports = () => {
  const { user } = useUser()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: 'all',
    includeAchievements: true,
    includeStreaks: true,
    includeCategoryBreakdown: true,
    includeMonthlyProgress: true
  })
  const [isExporting, setIsExporting] = useState(false)

  const fetchReportData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch('/api/analytics/reports')
      if (!response.ok) throw new Error('Failed to fetch report data')
      
      const data = await response.json()
      setReportData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!reportData) return

    try {
      setIsExporting(true)
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportOptions)
      })

      if (!response.ok) throw new Error('Failed to export data')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `progress-report-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async (platform: 'email' | 'social' | 'link') => {
    if (!reportData) return

    try {
      const shareData = {
        totalGoals: reportData.totalGoals,
        completedGoals: reportData.completedGoals,
        completionRate: reportData.completionRate,
        currentStreak: reportData.streakData.currentStreak,
        achievements: reportData.achievements.length
      }

      const response = await fetch('/api/analytics/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, data: shareData })
      })

      if (!response.ok) throw new Error('Failed to share data')

      const result = await response.json()
      
      if (platform === 'link') {
        navigator.clipboard.writeText(result.shareUrl)
        alert('Share link copied to clipboard!')
      } else if (platform === 'email') {
        window.open(`mailto:?subject=My Progress Report&body=${result.message}`)
      } else if (platform === 'social') {
        window.open(result.shareUrl, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share data')
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading report data</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m-6 0H7a2 2 0 01-2-2V9a2 2 0 012-2h2m8 10h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4 6v-4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No report data available</h3>
        <p className="mt-1 text-sm text-gray-500">Start tracking your goals to generate progress reports.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📊 Progress Reports</h2>
        <p className="text-green-100">Export and share your parenting journey progress</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalGoals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.completedGoals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.streakData.currentStreak}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Export Format</h4>
            <div className="space-y-2">
              {['pdf', 'csv', 'json'].map((format) => (
                <label key={format} className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={exportOptions.format === format}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'pdf' | 'csv' | 'json' }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{format.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Date Range</h4>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'last30', label: 'Last 30 Days' },
                { value: 'last90', label: 'Last 90 Days' },
                { value: 'last365', label: 'Last Year' }
              ].map((range) => (
                <label key={range.value} className="flex items-center">
                  <input
                    type="radio"
                    name="dateRange"
                    value={range.value}
                    checked={exportOptions.dateRange === range.value}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value as 'all' | 'last30' | 'last90' | 'last365' }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Include Sections</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'includeAchievements', label: 'Achievements' },
              { key: 'includeStreaks', label: 'Streak Data' },
              { key: 'includeCategoryBreakdown', label: 'Category Breakdown' },
              { key: 'includeMonthlyProgress', label: 'Monthly Progress' }
            ].map((option) => (
              <label key={option.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, [option.key]: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Progress</h3>
        <p className="text-sm text-gray-600 mb-4">Share your progress with family and friends</p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleShare('email')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
          
          <button
            onClick={() => handleShare('social')}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M7 8h10M9 12h6m-6 4h6" />
            </svg>
            Social Media
          </button>
          
          <button
            onClick={() => handleShare('link')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>
        </div>
      </div>

      {/* Recent Achievements */}
      {reportData.achievements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.achievements.slice(0, 4).map((achievement) => (
              <div key={achievement.id} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{achievement.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(achievement.dateEarned)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {reportData.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals by Category</h3>
          <div className="space-y-4">
            {reportData.categoryBreakdown.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 capitalize">{category.category}</h4>
                    <span className="text-sm text-gray-500">{category.completed}/{category.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-medium text-gray-900">{category.completionRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressReports 
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface SharedGoal {
  id: string
  title: string
  description: string
  category: string
  priority: string
  shareLevel: 'private' | 'family' | 'community' | 'public'
  user: {
    id: string
    firstName: string
    lastName: string
    imageUrl: string
  }
  progress: number
  likes: number
  comments: number
  isLiked: boolean
  createdAt: string
  targetDate: string
}

interface CommunityChallenge {
  id: string
  title: string
  description: string
  category: string
  startDate: string
  endDate: string
  participantCount: number
  isParticipating: boolean
  progress: number
  reward: string
  status: 'upcoming' | 'active' | 'completed'
}

interface CommunityStats {
  totalSharedGoals: number
  activeChallenges: number
  communityMembers: number
  completedChallenges: number
}

const CommunityHub = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'shared' | 'challenges' | 'my-shares'>('shared')
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([])
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([])
  const [stats, setStats] = useState<CommunityStats>({
    totalSharedGoals: 0,
    activeChallenges: 0,
    communityMembers: 0,
    completedChallenges: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunityData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch('/api/community')
      if (!response.ok) throw new Error('Failed to fetch community data')
      
      const data = await response.json()
      setSharedGoals(data.sharedGoals || [])
      setChallenges(data.challenges || [])
      setStats(data.stats || stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLikeGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/community/goals/${goalId}/like`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to like goal')
      
      // Update local state
      setSharedGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, isLiked: !goal.isLiked, likes: goal.isLiked ? goal.likes - 1 : goal.likes + 1 }
          : goal
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like goal')
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/community/challenges/${challengeId}/join`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to join challenge')
      
      // Update local state
      setChallenges(prev => prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, isParticipating: true, participantCount: challenge.participantCount + 1 }
          : challenge
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge')
    }
  }

  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/community/challenges/${challengeId}/leave`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to leave challenge')
      
      // Update local state
      setChallenges(prev => prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, isParticipating: false, participantCount: challenge.participantCount - 1 }
          : challenge
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave challenge')
    }
  }

  useEffect(() => {
    fetchCommunityData()
  }, [user])

  const getShareLevelColor = (shareLevel: string) => {
    switch (shareLevel) {
      case 'public': return 'bg-green-100 text-green-800'
      case 'community': return 'bg-blue-100 text-blue-800'
      case 'family': return 'bg-yellow-100 text-yellow-800'
      case 'private': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChallengeStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const mySharedGoals = sharedGoals.filter(goal => goal.user.id === user?.id)

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
            <h3 className="text-sm font-medium text-red-800">Error loading community data</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🌟 Community Hub</h2>
        <p className="text-purple-100">Connect with other dads and share your parenting journey</p>
      </div>

              {/* Community Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => alert('Challenge creation feature coming soon!')}
            >
              🏆 Create Challenge
            </button>
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              onClick={() => alert('Friend invitation feature coming soon!')}
            >
              📧 Invite Friends
            </button>
            <button 
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              onClick={() => alert('Discussion forum feature coming soon!')}
            >
              💬 Start Discussion
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            🚀 <strong>Coming Soon:</strong> Full community features including forums, group challenges, and direct messaging are in development!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Community Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.communityMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shared Goals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSharedGoals}</p>
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
              <p className="text-sm font-medium text-gray-600">Active Challenges</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeChallenges}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Challenges</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedChallenges}</p>
            </div>
          </div>
        </div>
      </div>

              {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How to Share Your Goals</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Go to <strong>Progress → Goals</strong> tab</li>
            <li>2. Click the <strong>⋯</strong> menu on any goal</li>
            <li>3. Select <strong>"Share with Community"</strong></li>
            <li>4. Your shared goals will appear here for others to see!</li>
          </ol>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('shared')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shared'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Shared Goals ({sharedGoals.length})
            </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'challenges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Challenges ({challenges.length})
          </button>
          <button
            onClick={() => setActiveTab('my-shares')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-shares'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Shares ({mySharedGoals.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'shared' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sharedGoals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <img
                      src={goal.user.imageUrl}
                      alt={`${goal.user.firstName} ${goal.user.lastName}`}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{goal.user.firstName} {goal.user.lastName}</h3>
                      <p className="text-sm text-gray-500">{formatDate(goal.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShareLevelColor(goal.shareLevel)}`}>
                    {goal.shareLevel}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h4>
                  <p className="text-gray-600 text-sm">{goal.description}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLikeGoal(goal.id)}
                      className={`flex items-center space-x-1 text-sm ${
                        goal.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={goal.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{goal.likes}</span>
                    </button>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{goal.comments}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Due: {formatDate(goal.targetDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{challenge.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChallengeStatusColor(challenge.status)}`}>
                    {challenge.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Duration:</span> {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Participants:</span> {challenge.participantCount}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reward:</span> {challenge.reward}
                  </p>
                </div>

                {challenge.isParticipating && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Progress</span>
                      <span className="text-sm font-medium text-gray-700">{challenge.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${challenge.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {challenge.isParticipating ? (
                    <button
                      onClick={() => handleLeaveChallenge(challenge.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
                    >
                      Leave Challenge
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                      disabled={challenge.status === 'completed'}
                    >
                      Join Challenge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'my-shares' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mySharedGoals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShareLevelColor(goal.shareLevel)}`}>
                    {goal.shareLevel}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{goal.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{goal.comments}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Due: {formatDate(goal.targetDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty States */}
      {((activeTab === 'shared' && sharedGoals.length === 0) ||
        (activeTab === 'challenges' && challenges.length === 0) ||
        (activeTab === 'my-shares' && mySharedGoals.length === 0)) && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {activeTab === 'shared' && 'No shared goals yet'}
            {activeTab === 'challenges' && 'No challenges available'}
            {activeTab === 'my-shares' && 'You haven\'t shared any goals yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'shared' && 'Check back later for shared goals from the community.'}
            {activeTab === 'challenges' && 'New challenges will be posted regularly.'}
            {activeTab === 'my-shares' && 'Share your goals to connect with other dads.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CommunityHub 
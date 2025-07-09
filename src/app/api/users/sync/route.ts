import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { fatherProfile: true }
    })

    if (!user) {
      // Create new user in our database
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
        },
        include: { fatherProfile: true }
      })
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        hasProfile: !!user.fatherProfile,
        onboardingCompleted: user.fatherProfile?.onboardingCompleted || false
      }
    })

  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { 
        fatherProfile: true,
        chatThreads: {
          take: 5,
          orderBy: { updatedAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        hasProfile: !!user.fatherProfile,
        onboardingCompleted: user.fatherProfile?.onboardingCompleted || false,
        recentChats: user.chatThreads.length
      }
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
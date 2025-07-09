import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const fatherProfileSchema = z.object({
  fatherName: z.string().min(2, 'Name must be at least 2 characters'),
  childrenAges: z.array(z.number().min(0).max(18)),
  fatheringSince: z.string().optional(),
  relationshipStatus: z.enum(['single', 'partnered', 'married', 'divorced', 'widowed']),
  primaryConcerns: z.array(z.string()).min(1, 'Please select at least one concern'),
  fatheringGoals: z.array(z.string()).min(1, 'Please select at least one goal'),
  communicationStyle: z.enum(['direct', 'supportive', 'analytical', 'encouraging']),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the request body
    const validatedData = fatherProfileSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { fatherProfile: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Convert fatheringSince to Date if provided
    const fatheringSinceDate = validatedData.fatheringSince 
      ? new Date(validatedData.fatheringSince)
      : null

    // Create or update father profile
    const fatherProfile = await prisma.fatherProfile.upsert({
      where: { userId: user.id },
      update: {
        fatherName: validatedData.fatherName,
        childrenAges: validatedData.childrenAges,
        fatheringSince: fatheringSinceDate,
        relationshipStatus: validatedData.relationshipStatus,
        primaryConcerns: validatedData.primaryConcerns,
        fatheringGoals: validatedData.fatheringGoals,
        communicationStyle: validatedData.communicationStyle,
        onboardingCompleted: true,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        fatherName: validatedData.fatherName,
        childrenAges: validatedData.childrenAges,
        fatheringSince: fatheringSinceDate,
        relationshipStatus: validatedData.relationshipStatus,
        primaryConcerns: validatedData.primaryConcerns,
        fatheringGoals: validatedData.fatheringGoals,
        communicationStyle: validatedData.communicationStyle,
        onboardingCompleted: true
      }
    })

    return NextResponse.json({ 
      message: 'Profile saved successfully',
      profile: {
        id: fatherProfile.id,
        fatherName: fatherProfile.fatherName,
        childrenAges: fatherProfile.childrenAges,
        onboardingCompleted: fatherProfile.onboardingCompleted
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and profile from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { fatherProfile: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      profile: user.fatherProfile 
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
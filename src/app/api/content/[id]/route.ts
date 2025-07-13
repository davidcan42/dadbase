import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  contentType: z.enum(['book_chapter', 'research_paper', 'article', 'video', 'podcast']).optional(),
  sourceReference: z.string().optional(),
  content: z.string().min(1, 'Content is required').optional(),
  summary: z.string().optional(),
  targetAge: z.string().optional(),
  themes: z.array(z.string()).optional(),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user to check if they exist in our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get content item with bookmark status for this user
    const contentItem = await prisma.contentItem.findUnique({
      where: { id },
      include: {
        bookmarks: {
          where: { userId: user.id },
          select: { id: true, notes: true, createdAt: true }
        },
        progressEntries: {
          where: { userId: user.id },
          select: { progressType: true, progressValue: true, notes: true }
        },
        _count: {
          select: { bookmarks: true }
        }
      }
    })

    if (!contentItem) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({
      content: {
        id: contentItem.id,
        title: contentItem.title,
        contentType: contentItem.contentType,
        sourceReference: contentItem.sourceReference,
        content: contentItem.content,
        summary: contentItem.summary,
        targetAge: contentItem.targetAge,
        themes: contentItem.themes,
        complexity: contentItem.complexity,
        metadata: contentItem.metadata,
        bookmarkCount: contentItem._count.bookmarks,
        isBookmarked: contentItem.bookmarks.length > 0,
        userBookmark: contentItem.bookmarks[0] || null,
        userProgress: contentItem.progressEntries[0] || null,
        createdAt: contentItem.createdAt,
        updatedAt: contentItem.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching content item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateContentSchema.parse(body)

    // Check if user is authorized to update content (admin only for now)
    // TODO: Implement proper role-based authorization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if content exists
    const existingContent = await prisma.contentItem.findUnique({
      where: { id }
    })

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Update content item
    const updatedContent = await prisma.contentItem.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Content updated successfully',
      content: {
        id: updatedContent.id,
        title: updatedContent.title,
        contentType: updatedContent.contentType,
        sourceReference: updatedContent.sourceReference,
        summary: updatedContent.summary,
        targetAge: updatedContent.targetAge,
        themes: updatedContent.themes,
        complexity: updatedContent.complexity,
        updatedAt: updatedContent.updatedAt
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error updating content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is authorized to delete content (admin only for now)
    // TODO: Implement proper role-based authorization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if content exists
    const existingContent = await prisma.contentItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookmarks: true, progressEntries: true }
        }
      }
    })

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Delete content item (this will cascade delete related bookmarks and progress entries)
    await prisma.contentItem.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Content deleted successfully',
      deletedRelations: {
        bookmarks: existingContent._count.bookmarks,
        progressEntries: existingContent._count.progressEntries
      }
    })

  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
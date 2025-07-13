import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBookmarkSchema = z.object({
  notes: z.string().optional()
})

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
    const validatedData = updateBookmarkSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update bookmark (only if it belongs to the user)
    const updatedBookmark = await prisma.bookmark.updateMany({
      where: {
        id,
        userId: user.id
      },
      data: {
        notes: validatedData.notes
      }
    })

    if (updatedBookmark.count === 0) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    // Get the updated bookmark with content details
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
            summary: true,
            targetAge: true,
            themes: true,
            complexity: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Bookmark updated successfully',
      bookmark: {
        id: bookmark!.id,
        notes: bookmark!.notes,
        createdAt: bookmark!.createdAt,
        content: bookmark!.content
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error updating bookmark:', error)
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete bookmark (only if it belongs to the user)
    const deletedBookmark = await prisma.bookmark.deleteMany({
      where: {
        id,
        userId: user.id
      }
    })

    if (deletedBookmark.count === 0) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Bookmark deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
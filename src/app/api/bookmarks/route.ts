import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createBookmarkSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  notes: z.string().optional()
})

const updateBookmarkSchema = z.object({
  notes: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const contentType = searchParams.get('contentType')
    const skip = (page - 1) * limit

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build where clause for filtering bookmarks
    const where: any = {
      userId: user.id
    }

    if (contentType) {
      where.content = {
        contentType: contentType
      }
    }

    // Get user's bookmarks with content details
    const [bookmarks, totalCount] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        include: {
          content: {
            include: {
              _count: {
                select: { bookmarks: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.bookmark.count({ where })
    ])

    return NextResponse.json({
      bookmarks: bookmarks.map(bookmark => ({
        id: bookmark.id,
        notes: bookmark.notes,
        createdAt: bookmark.createdAt,
        content: {
          id: bookmark.content.id,
          title: bookmark.content.title,
          contentType: bookmark.content.contentType,
          sourceReference: bookmark.content.sourceReference,
          summary: bookmark.content.summary,
          targetAge: bookmark.content.targetAge,
          themes: bookmark.content.themes,
          complexity: bookmark.content.complexity,
          bookmarkCount: bookmark.content._count.bookmarks,
          createdAt: bookmark.content.createdAt,
          updatedAt: bookmark.content.updatedAt
        }
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBookmarkSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if content exists
    const content = await prisma.contentItem.findUnique({
      where: { id: validatedData.contentId }
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_contentId: {
          userId: user.id,
          contentId: validatedData.contentId
        }
      }
    })

    if (existingBookmark) {
      return NextResponse.json({ error: 'Content already bookmarked' }, { status: 409 })
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        contentId: validatedData.contentId,
        notes: validatedData.notes
      },
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
      message: 'Content bookmarked successfully',
      bookmark: {
        id: bookmark.id,
        notes: bookmark.notes,
        createdAt: bookmark.createdAt,
        content: bookmark.content
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error creating bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
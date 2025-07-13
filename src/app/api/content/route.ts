import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  contentType: z.enum(['book_chapter', 'research_paper', 'article', 'video', 'podcast']),
  sourceReference: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  targetAge: z.string().optional(),
  themes: z.array(z.string()).default([]),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  metadata: z.record(z.any()).optional()
})

const contentQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  contentType: z.string().optional(),
  targetAge: z.string().optional(),
  complexity: z.string().optional(),
  theme: z.string().optional(),
  search: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = contentQuerySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(query.page)
    const limit = parseInt(query.limit)
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    
    if (query.contentType) {
      where.contentType = query.contentType
    }
    
    if (query.targetAge) {
      where.targetAge = query.targetAge
    }
    
    if (query.complexity) {
      where.complexity = query.complexity
    }
    
    if (query.theme) {
      where.themes = {
        has: query.theme
      }
    }
    
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    // Get content items with pagination
    const [contentItems, totalCount] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        include: {
          _count: {
            select: { bookmarks: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.contentItem.count({ where })
    ])

    return NextResponse.json({
      content: contentItems.map(item => ({
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        sourceReference: item.sourceReference,
        summary: item.summary,
        targetAge: item.targetAge,
        themes: item.themes,
        complexity: item.complexity,
        bookmarkCount: item._count.bookmarks,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error fetching content:', error)
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
    const validatedData = createContentSchema.parse(body)

    // Check if user is authorized to create content (admin only for now)
    // TODO: Implement proper role-based authorization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create content item
    const contentItem = await prisma.contentItem.create({
      data: {
        title: validatedData.title,
        contentType: validatedData.contentType,
        sourceReference: validatedData.sourceReference,
        content: validatedData.content,
        summary: validatedData.summary,
        targetAge: validatedData.targetAge,
        themes: validatedData.themes,
        complexity: validatedData.complexity,
        metadata: validatedData.metadata
      }
    })

    return NextResponse.json({
      message: 'Content created successfully',
      content: {
        id: contentItem.id,
        title: contentItem.title,
        contentType: contentItem.contentType,
        sourceReference: contentItem.sourceReference,
        summary: contentItem.summary,
        targetAge: contentItem.targetAge,
        themes: contentItem.themes,
        complexity: contentItem.complexity,
        createdAt: contentItem.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error creating content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
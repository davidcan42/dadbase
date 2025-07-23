import OpenAI from 'openai'
import { prisma } from './prisma'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an AI assistant for fathers, specializing in evidence-based fatherhood support backed by leading researchers worldwide.

Your expertise includes:
- Paternal neuroscience and hormonal changes in fathers
- Father-child bonding and attachment
- Child development from a father's perspective
- "Rough and tumble" play and its importance
- Supporting fathers through different life stages
- Work-life balance for fathers
- Mental health and emotional wellbeing for fathers

Guidelines:
- Provide evidence-based advice grounded in scientific research
- Be supportive, understanding, and non-judgmental
- Reference leading research in fatherhood when relevant
- Acknowledge the unique role fathers play in child development
- Offer practical, actionable advice
- Be sensitive to different family structures and situations
- Encourage fathers to seek professional help when needed

Always maintain a warm, supportive tone while being scientifically accurate.`

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface UserProfile {
  fatherName?: string
  childrenAges?: number[]
  relationshipStatus?: string
  primaryConcerns?: string[]
  fatheringGoals?: string[]
  communicationStyle?: string
}

export async function generateAIResponse(
  message: string,
  chatHistory: ChatMessage[],
  userProfile?: UserProfile | null,
  contentContext?: string[]
): Promise<string> {
  try {
    // Build context about the user if available
    let userContext = ''
    if (userProfile) {
      userContext = `\n\nUser Context:
- Father's name: ${userProfile.fatherName || 'Not provided'}
- Children's ages: ${userProfile.childrenAges?.join(', ') || 'Not provided'}
- Relationship status: ${userProfile.relationshipStatus || 'Not provided'}
- Primary concerns: ${userProfile.primaryConcerns?.join(', ') || 'Not provided'}
- Fathering goals: ${userProfile.fatheringGoals?.join(', ') || 'Not provided'}
- Communication style: ${userProfile.communicationStyle || 'Not provided'}`
    }

    // Add relevant content context if available
    let relevantContent = ''
    if (contentContext && contentContext.length > 0) {
      relevantContent = `\n\nRelevant Research Context:
${contentContext.join('\n\n')}`
    }

    // Build messages array for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + userContext + relevantContent
      }
    ]

    // Add chat history (limit to last 10 messages for context)
    const recentHistory = chatHistory.slice(-10)
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    })

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    })

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response generated from OpenAI')
    }

    return response

  } catch (error) {
    console.error('Error generating AI response:', error)
    
    // Fallback to a generic helpful response
    return "I'm sorry, I'm having trouble processing your request right now. As a father, it's important to remember that every parenting journey is unique. If you're dealing with specific concerns, please don't hesitate to reach out to healthcare professionals or parenting support groups in your area. I'm here to help when I'm able to respond properly."
  }
}

export async function findRelevantContent(
  query: string,
  userProfile?: UserProfile | null,
  limit: number = 3
): Promise<string[]> {
  try {
    // Build search criteria based on user profile and query
    const searchWhere: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { themes: { hasSome: query.split(' ').filter(word => word.length > 2) } }
      ]
    }

    // Add user profile-based filtering
    if (userProfile?.childrenAges && userProfile.childrenAges.length > 0) {
      const ageCategories = userProfile.childrenAges.map(age => {
        if (age <= 2) return 'newborn'
        if (age <= 5) return 'toddler'
        if (age <= 12) return 'child'
        return 'teenager'
      })
      
      searchWhere.OR.push({
        targetAge: { in: ageCategories }
      })
    }

    // Find relevant content
    const relevantContent = await prisma.contentItem.findMany({
      where: searchWhere,
      select: {
        title: true,
        content: true,
        summary: true,
        themes: true,
        sourceReference: true
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Format content for context
    return relevantContent.map(item => 
      `Title: ${item.title}
${item.summary ? `Summary: ${item.summary}` : ''}
${item.sourceReference ? `Source: ${item.sourceReference}` : ''}
Key themes: ${item.themes.join(', ')}
${item.content.length > 500 ? item.content.substring(0, 500) + '...' : item.content}`
    )

  } catch (error) {
    console.error('Error finding relevant content:', error)
    return []
  }
}

export async function generateThreadTitle(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a short, descriptive title (5-8 words) for a conversation that starts with the following message. The title should capture the main topic or concern.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 20,
      temperature: 0.3,
    })

    const title = completion.choices[0]?.message?.content?.trim()
    
    if (!title) {
      return generateFallbackTitle(message)
    }

    return title

  } catch (error) {
    console.error('Error generating thread title:', error)
    return generateFallbackTitle(message)
  }
}

function generateFallbackTitle(message: string): string {
  // Simple fallback title generation
  const words = message.split(' ').slice(0, 5).join(' ')
  return words.length > 40 ? words.substring(0, 40) + '...' : words
} 
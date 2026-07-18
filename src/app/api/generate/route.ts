import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateStrategyStream } from '@/engines/generate-engine'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const generateSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(5000),
  language: z.enum(['pine', 'mql5']).default('pine'),
  timeframe: z.string().optional(),
})

// Simple in-memory rate limiter for demo (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip, 10, 60000)) {
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    // Check auth (optional for now - allow unauthenticated for demo)
    const session = await getServerSession(authOptions)

    // Parse and validate request
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const result = generateSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { prompt, language, timeframe } = result.data

    // Generate strategy with streaming
    const stream = await generateStrategyStream({ prompt, language, timeframe })

    // Track API usage if user is authenticated
    if (session?.user?.id) {
      // Fire and forget - don't await
      prisma.apiUsage.create({
        data: {
          userId: session.user.id,
          endpoint: 'generate',
          tokensUsed: 0,
          costCents: 0,
        },
      }).catch(console.error)
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Generate error:', error)
    return Response.json(
      { error: 'Failed to generate strategy' },
      { status: 500 }
    )
  }
}

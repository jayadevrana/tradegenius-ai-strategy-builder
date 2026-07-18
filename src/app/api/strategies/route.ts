import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createStrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1),
  pineScript: z.string().min(1),
  strategyJson: z.any().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      // Return demo strategies for unauthenticated users
      return Response.json([])
    }

    const strategies = await prisma.strategy.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        pineScript: true,
        strategyJson: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Parse tags from JSON string to array
    const parsedStrategies = strategies.map(s => ({
      ...s,
      tags: JSON.parse(s.tags),
    }))

    return Response.json(parsedStrategies)
  } catch (error) {
    console.error('Fetch strategies error:', error)
    return Response.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createStrategySchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, prompt, pineScript, strategyJson, tags, isPublic } = result.data

    const strategy = await prisma.strategy.create({
      data: {
        userId: session.user.id,
        name,
        description,
        prompt,
        pineScript,
        strategyJson: strategyJson || undefined,
        tags: JSON.stringify(tags),
        isPublic,
        versions: {
          create: {
            pineScript,
            prompt,
            version: 1,
          },
        },
      },
    })

    return Response.json(strategy, { status: 201 })
  } catch (error) {
    console.error('Create strategy error:', error)
    return Response.json(
      { error: 'Failed to create strategy' },
      { status: 500 }
    )
  }
}

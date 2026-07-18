import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const strategy = await prisma.strategy.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
        },
      },
    })

    if (!strategy) {
      return Response.json(
        { error: 'Strategy not found' },
        { status: 404 }
      )
    }

    // Check access
    if (!strategy.isPublic && strategy.userId !== session?.user?.id) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return Response.json(strategy)
  } catch (error) {
    console.error('Fetch strategy error:', error)
    return Response.json(
      { error: 'Failed to fetch strategy' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const strategy = await prisma.strategy.findUnique({
      where: { id },
    })

    if (!strategy) {
      return Response.json(
        { error: 'Strategy not found' },
        { status: 404 }
      )
    }

    if (strategy.userId !== session.user.id) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, pineScript, strategyJson, tags, isPublic } = body

    // Create new version if pineScript changed
    if (pineScript && pineScript !== strategy.pineScript) {
      const latestVersion = await prisma.strategyVersion.findFirst({
        where: { strategyId: id },
        orderBy: { version: 'desc' },
      })

      await prisma.strategyVersion.create({
        data: {
          strategyId: id,
          pineScript,
          prompt: body.prompt || strategy.prompt,
          version: (latestVersion?.version || 0) + 1,
        },
      })
    }

    const updated = await prisma.strategy.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(pineScript && { pineScript }),
        ...(strategyJson && { strategyJson }),
        ...(tags && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('Update strategy error:', error)
    return Response.json(
      { error: 'Failed to update strategy' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const strategy = await prisma.strategy.findUnique({
      where: { id },
    })

    if (!strategy) {
      return Response.json(
        { error: 'Strategy not found' },
        { status: 404 }
      )
    }

    if (strategy.userId !== session.user.id) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.strategy.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete strategy error:', error)
    return Response.json(
      { error: 'Failed to delete strategy' },
      { status: 500 }
    )
  }
}

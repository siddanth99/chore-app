// web/app/api/applications/[applicationId]/reject/route.ts
import { NextResponse } from 'next/server'
import { ApplicationStatus } from '@prisma/client'
import { getCurrentUser, getHttpStatusForAuthError, isAuthError, AuthorizationError, AUTH_ERRORS } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { createNotification } from '@/server/api/notifications'
import { NotificationType } from '@prisma/client'

// In Next 15, params is a Promise
type RejectParams = Promise<{ applicationId: string }>

/**
 * POST /api/applications/[applicationId]/reject
 * Reject an application
 * Role is UI-only - any authenticated user who owns the chore can reject
 */
export async function POST(
  request: Request,
  { params }: { params: RejectParams }
) {
  try {
    // Any authenticated user can reject if they own the chore (ownership check below)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { applicationId } = await params

    // Load the application with chore
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        chore: true,
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!application) {
      throw new AuthorizationError(AUTH_ERRORS.NOT_FOUND, 'Application not found')
    }

    // Security: Only the chore owner can reject
    if (application.chore.createdById !== user.id) {
      throw new AuthorizationError(
        AUTH_ERRORS.FORBIDDEN_OWNER,
        'You are not allowed to reject this application'
      )
    }

    // Only pending applications can be rejected
    if (application.status !== ApplicationStatus.PENDING) {
      throw new AuthorizationError(
        AUTH_ERRORS.FORBIDDEN,
        'Only pending applications can be rejected'
      )
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.REJECTED },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Notify the worker
    await createNotification({
      userId: application.workerId,
      type: NotificationType.APPLICATION_REJECTED,
      choreId: application.choreId,
      applicationId: application.id,
      title: 'Application not selected',
      message: `Your application for "${application.chore.title}" was not selected`,
      link: `/chores/${application.choreId}`,
    })

    return NextResponse.json({ application: updatedApplication })
  } catch (error: any) {
    console.error('Error rejecting application:', error)
    
    // Handle structured auth/business errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Operation failed' },
        { status }
      )
    }
    
    // Generic 500 for unknown errors (don't leak details)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


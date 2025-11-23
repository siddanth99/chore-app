import { prisma } from '../db/client'
import { ChoreStatus, ApplicationStatus } from '@prisma/client'
import { getAverageRating } from './ratings'

export interface WorkerDashboardData {
  stats: {
    averageRating: number
    ratingCount: number
    totalCompleted: number
    totalEarnings: number
    completedLast30Days: number
  }
  assignedChores: any[]
  inProgressChores: any[]
  completedChores: any[]
}

export interface CustomerDashboardData {
  stats: {
    totalPosted: number
    totalCompleted: number
    totalSpent: number
    ratingsGiven: number
  }
  draftChores: any[]
  publishedChores: any[]
  activeChores: any[]
  completedChores: any[]
}

/**
 * Get dashboard data for a worker
 */
export async function getWorkerDashboardData(workerId: string): Promise<WorkerDashboardData> {
  // Get all chores assigned to this worker in parallel
  const [assignedChores, inProgressChores, completedChores, allCompletedChores] = await Promise.all([
    // Assigned chores
    prisma.chore.findMany({
      where: {
        assignedWorkerId: workerId,
        status: ChoreStatus.ASSIGNED,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    // In progress chores
    prisma.chore.findMany({
      where: {
        assignedWorkerId: workerId,
        status: ChoreStatus.IN_PROGRESS,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    // Completed chores (for display)
    prisma.chore.findMany({
      where: {
        assignedWorkerId: workerId,
        status: ChoreStatus.COMPLETED,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        ratings: {
          where: {
            toUserId: workerId,
          },
          include: {
            fromUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        applications: {
          where: {
            workerId: workerId,
            status: ApplicationStatus.ACCEPTED,
          },
          select: {
            bidAmount: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    // All completed chores for stats (without includes for efficiency)
    prisma.chore.findMany({
      where: {
        assignedWorkerId: workerId,
        status: ChoreStatus.COMPLETED,
      },
      select: {
        id: true,
        budget: true,
        updatedAt: true,
        applications: {
          where: {
            workerId: workerId,
            status: ApplicationStatus.ACCEPTED,
          },
          select: {
            bidAmount: true,
          },
        },
      },
    }),
  ])

  // Get rating stats
  const ratingStats = await getAverageRating(workerId)

  // Calculate stats
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const completedLast30Days = allCompletedChores.filter(
    (chore) => chore.updatedAt >= thirtyDaysAgo
  ).length

  // Calculate total earnings
  // Use bidAmount from ACCEPTED application if available, otherwise use chore.budget
  const totalEarnings = allCompletedChores.reduce((sum, chore) => {
    const acceptedApp = chore.applications.find((app) => app.bidAmount !== null)
    if (acceptedApp && acceptedApp.bidAmount) {
      return sum + acceptedApp.bidAmount
    }
    return sum + (chore.budget || 0)
  }, 0)

  return {
    stats: {
      averageRating: ratingStats.average || 0,
      ratingCount: ratingStats.count,
      totalCompleted: allCompletedChores.length,
      totalEarnings,
      completedLast30Days,
    },
    assignedChores,
    inProgressChores,
    completedChores,
  }
}

/**
 * Get dashboard data for a customer
 */
export async function getCustomerDashboardData(
  customerId: string
): Promise<CustomerDashboardData> {
  // Get all chores created by this customer in parallel
  const [draftChores, publishedChores, activeChores, completedChores, allChores] =
    await Promise.all([
      // Draft chores
      prisma.chore.findMany({
        where: {
          createdById: customerId,
          status: ChoreStatus.DRAFT,
        },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Published chores
      prisma.chore.findMany({
        where: {
          createdById: customerId,
          status: ChoreStatus.PUBLISHED,
        },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Active chores (ASSIGNED or IN_PROGRESS)
      prisma.chore.findMany({
        where: {
          createdById: customerId,
          status: {
            in: [ChoreStatus.ASSIGNED, ChoreStatus.IN_PROGRESS],
          },
        },
        include: {
          assignedWorker: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Completed chores
      prisma.chore.findMany({
        where: {
          createdById: customerId,
          status: ChoreStatus.COMPLETED,
        },
        include: {
          assignedWorker: {
            select: {
              id: true,
              name: true,
            },
          },
          ratings: {
            where: {
              fromUserId: customerId,
            },
            include: {
              toUser: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          applications: {
            where: {
              status: ApplicationStatus.ACCEPTED,
            },
            select: {
              bidAmount: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      // All chores for stats (without includes for efficiency)
      prisma.chore.findMany({
        where: {
          createdById: customerId,
        },
        select: {
          id: true,
          status: true,
          budget: true,
          applications: {
            where: {
              status: ApplicationStatus.ACCEPTED,
            },
            select: {
              bidAmount: true,
            },
          },
        },
      }),
    ])

  // Get count of ratings given by this customer
  const ratingsGiven = await prisma.rating.count({
    where: {
      fromUserId: customerId,
    },
  })

  // Calculate stats
  const totalPosted = allChores.length
  const totalCompleted = allChores.filter((c) => c.status === ChoreStatus.COMPLETED).length

  // Calculate total spent
  // Use bidAmount from ACCEPTED application if available, otherwise use chore.budget
  const totalSpent = allChores
    .filter((c) => c.status === ChoreStatus.COMPLETED)
    .reduce((sum, chore) => {
      const acceptedApp = chore.applications.find((app) => app.bidAmount !== null)
      if (acceptedApp && acceptedApp.bidAmount) {
        return sum + acceptedApp.bidAmount
      }
      return sum + (chore.budget || 0)
    }, 0)

  return {
    stats: {
      totalPosted,
      totalCompleted,
      totalSpent,
      ratingsGiven,
    },
    draftChores,
    publishedChores,
    activeChores,
    completedChores,
  }
}


// TODO: Legacy dashboard UI. Candidate for removal after v2 dashboard is fully verified in production.
// See components/dashboard/LovableDashboardChoreCard.tsx for the new Lovable UI implementation.

import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { ChoreStatus, ChoreType } from '@prisma/client'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'

interface DashboardChoreCardProps {
  chore: any
  showWorker?: boolean
  showRating?: boolean
  showEarnings?: boolean
  showRateButton?: boolean
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: ChoreStatus | string): 'statusDraft' | 'statusPublished' | 'statusAssigned' | 'statusInProgress' | 'statusCompleted' | 'statusCancelled' {
  switch (status) {
    case 'DRAFT':
      return 'statusDraft'
    case 'PUBLISHED':
      return 'statusPublished'
    case 'ASSIGNED':
      return 'statusAssigned'
    case 'IN_PROGRESS':
      return 'statusInProgress'
    case 'COMPLETED':
      return 'statusCompleted'
    case 'CANCELLED':
      return 'statusCancelled'
    case 'CANCELLATION_REQUESTED':
      return 'statusCancelled' // Use cancelled style for cancellation requested
    default:
      return 'statusDraft'
  }
}

// Helper function to get type badge variant
function getTypeBadgeVariant(type: ChoreType): 'typeOnline' | 'typeOffline' {
  switch (type) {
    case 'ONLINE':
      return 'typeOnline'
    case 'OFFLINE':
      return 'typeOffline'
    default:
      return 'typeOnline'
  }
}

export default function DashboardChoreCard({
  chore,
  showWorker = false,
  showRating = false,
  showEarnings = false,
  showRateButton = false,
}: DashboardChoreCardProps) {
  // Calculate earnings (bidAmount from ACCEPTED app, or budget fallback)
  const earnings =
    showEarnings && chore.applications && chore.applications.length > 0
      ? chore.applications[0]?.bidAmount || chore.budget || 0
      : chore.budget || 0

  // Get rating if available
  const rating = showRating && chore.ratings && chore.ratings.length > 0 ? chore.ratings[0] : null

  return (
    <Card
      className="overflow-hidden transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5"
      padding="none"
    >
      {/* Chore Image Thumbnail */}
      {chore.imageUrl && (
        <img
          src={chore.imageUrl}
          alt={chore.title}
          className="h-32 w-full object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{chore.title}</h3>
          <div className="flex gap-1">
            <Badge variant={getTypeBadgeVariant(chore.type)}>
              {chore.type}
            </Badge>
          </div>
        </div>

        <div className="mb-3">
          <Badge variant={getStatusBadgeVariant(chore.status)}>
            {chore.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium">Category:</span>
            <span className="ml-2">{chore.category}</span>
          </div>

          {chore.type === 'OFFLINE' && chore.locationAddress && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">📍</span>
              <span className="ml-2 truncate">{chore.locationAddress}</span>
            </div>
          )}

          {chore.dueAt && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">Due:</span>
              <span className="ml-2">
                {formatDate(chore.dueAt)}
              </span>
            </div>
          )}

          {showWorker && chore.assignedWorker && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">Worker:</span>
              <Link
                href={`/profile/${chore.assignedWorker.id}`}
                className="ml-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {chore.assignedWorker.name}
              </Link>
            </div>
          )}

          {showEarnings && (
            <div className="flex items-center text-sm font-medium text-green-600">
              <span>💰 Earned:</span>
              <span className="ml-2">₹{earnings}</span>
            </div>
          )}

          {chore.budget && !showEarnings && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">Budget:</span>
              <span className="ml-2">₹{chore.budget}</span>
            </div>
          )}

          {showRating && rating && (
            <div className="flex items-center text-sm text-yellow-600">
              <span>⭐ Rating:</span>
              <span className="ml-2">
                {'★'.repeat(rating.score)}{'☆'.repeat(5 - rating.score)} ({rating.score}/5)
              </span>
            </div>
          )}

          {showRating && !rating && showRateButton && chore.status === 'COMPLETED' && (
            <div className="pt-2">
              <Link
                href={`/chores/${chore.id}`}
                className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Rate worker →
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
          {chore.createdBy && (
            <span className="text-sm text-slate-500 dark:text-slate-400">By {chore.createdBy.name}</span>
          )}
          <Link
            href={`/chores/${chore.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Details →
          </Link>
        </div>
      </div>
    </Card>
  )
}


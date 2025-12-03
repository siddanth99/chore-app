'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'

export default function QuickLinks() {
  const router = useRouter()

  return (
    <Card className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-3">
        Quick Links
      </h2>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/dashboard')}
          aria-label="Go to Dashboard"
        >
          Go to Dashboard
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/chores')}
          aria-label="Browse Chores"
        >
          Browse Chores
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/notifications')}
          aria-label="View Notifications"
        >
          Notifications
        </Button>
      </div>
    </Card>
  )
}


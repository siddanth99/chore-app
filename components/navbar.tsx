'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import ThemeToggle from '@/components/theme/ThemeToggle'
import NotificationsBell from '@/components/notifications/NotificationsBell'
import Button from '@/components/ui/button'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="w-full bg-white/80 backdrop-blur shadow-sm border-b border-gray-200 dark:bg-slate-900/80 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400 transition-colors"
            >
              ChoreMarket
            </Link>
            <div className="hidden md:flex gap-6">
              <Link
                href="/chores"
                className="text-slate-700 hover:text-blue-600 font-medium dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
              >
                Browse Chores
              </Link>
              {session && (
                <Link
                  href="/dashboard"
                  className="text-slate-700 hover:text-blue-600 font-medium dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <>
                <NotificationsBell />
                {(session.user as any)?.role === 'CUSTOMER' && (
                  <Link href="/chores/new" className="hidden sm:inline-flex">
                    <Button variant="primary" size="sm">
                      Post a Chore
                    </Button>
                  </Link>
                )}
                <Link
                  href={`/profile/${(session.user as any)?.id}`}
                  className="text-slate-700 hover:text-blue-600 font-medium dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                >
                  Profile
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Log out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Log in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


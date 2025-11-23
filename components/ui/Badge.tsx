import { ReactNode } from 'react'

type BadgeVariant =
  | 'statusDraft'
  | 'statusPublished'
  | 'statusAssigned'
  | 'statusInProgress'
  | 'statusCompleted'
  | 'statusCancelled'
  | 'typeOnline'
  | 'typeOffline'
  | 'neutral'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    statusDraft: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200',
    statusPublished: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    statusAssigned: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    statusInProgress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    statusCompleted: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    statusCancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    typeOnline: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    typeOffline: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200',
  }
  
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}


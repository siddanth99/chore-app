import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    none: '',
  }
  
  return (
    <div
      className={`rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-800 ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  )
}


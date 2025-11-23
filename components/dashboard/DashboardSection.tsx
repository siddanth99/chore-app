import { ReactNode } from 'react'

interface DashboardSectionProps {
  title: string
  count?: number
  children: ReactNode
  emptyMessage?: string
}

export default function DashboardSection({
  title,
  count,
  children,
  emptyMessage = 'No items found.',
}: DashboardSectionProps) {
  const childrenArray = Array.isArray(children) ? children : [children]
  const hasChildren = childrenArray.some((child) => child !== null && child !== undefined)

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
        {title}
        {count !== undefined && ` (${count})`}
      </h2>
      {hasChildren ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-slate-900 shadow p-6 border border-gray-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}

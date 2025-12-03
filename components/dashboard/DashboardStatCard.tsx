// TODO: Legacy dashboard UI. Candidate for removal after v2 dashboard is fully verified in production.
// See components/dashboard/StatCard.tsx for the new Lovable UI implementation.

interface DashboardStatCardProps {
  icon: string
  label: string
  value: string | number
  subtitle?: string
}

export default function DashboardStatCard({
  icon,
  label,
  value,
  subtitle,
}: DashboardStatCardProps) {
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}


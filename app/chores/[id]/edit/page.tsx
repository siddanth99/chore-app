import { redirect } from 'next/navigation'
import { requireRole, isOwner } from '@/server/auth/role'
import { getChoreById } from '@/server/api/chores'
import { ChoreStatus, UserRole } from '@prisma/client'
import ChoreForm from '../../new/chore-form'
import Card from '@/components/ui/Card'

export default async function EditChorePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // RBAC: Only CUSTOMER can edit chores (workers can only view)
  let user
  try {
    user = await requireRole(UserRole.CUSTOMER)
  } catch {
    redirect('/login')
  }

  const chore = await getChoreById(id)

  if (!chore) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Chore not found
            </h1>
            <p className="text-slate-700 dark:text-slate-300 mb-2">
              We couldn&apos;t find a chore with this ID.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  // RBAC: Check if user is the owner
  if (!isOwner(user.id, chore.createdById)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Access Denied
            </h1>
            <p className="text-slate-700 dark:text-slate-300 mb-2">
              You are not authorized to edit this chore.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  // Check if chore can be edited (not COMPLETED or CANCELLED)
  if (chore.status === ChoreStatus.COMPLETED || chore.status === ChoreStatus.CANCELLED) {
    redirect(`/chores/${id}`)
  }

  // ChoreForm uses CreateChoreLayout which provides its own full-page layout,
  // hero header, and responsive container. No outer wrapper needed.
  return (
    <ChoreForm
      mode="edit"
      initialChore={{
        id: chore.id,
        title: chore.title,
        description: chore.description,
        type: chore.type,
        category: chore.category,
        budget: chore.budget,
        locationAddress: chore.locationAddress,
        locationLat: chore.locationLat,
        locationLng: chore.locationLng,
        dueAt: chore.dueAt ? chore.dueAt.toISOString() : null,
        imageUrl: chore.imageUrl,
        status: chore.status,
      }}
    />
  )
}

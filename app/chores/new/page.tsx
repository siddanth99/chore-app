import { redirect } from 'next/navigation'
import { getCurrentUser, requireRole } from '@/server/auth/role'
import ChoreForm from './chore-form'

export default async function NewChorePage() {
  try {
    await requireRole('CUSTOMER')
  } catch (error) {
    redirect('/login')
  }

  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white shadow px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Chore</h1>
          <ChoreForm />
        </div>
      </div>
    </div>
  )
}


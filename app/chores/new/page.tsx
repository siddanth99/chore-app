import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import ChoreForm from './chore-form'

export default async function NewChorePage() {
  // Role is UI-only - any authenticated user can create chores
  const user = await getCurrentUser()
  if (!user) {
    redirect('/signin')
  }

  // ChoreForm uses CreateChoreLayout which provides its own full-page layout,
  // hero header, and responsive container. No outer wrapper needed.
  return <ChoreForm mode="create" />
}

import { redirect } from 'next/navigation'
import { requireRole } from '@/server/auth/role'
import ChoreForm from './chore-form'

export default async function NewChorePage() {
  try {
    await requireRole('CUSTOMER')
  } catch (error) {
    redirect('/signin')
  }

  // ChoreForm uses CreateChoreLayout which provides its own full-page layout,
  // hero header, and responsive container. No outer wrapper needed.
  return <ChoreForm mode="create" />
}

import Link from 'next/link'
import { listPublishedChores } from '@/server/api/chores'
import { getCurrentUser } from '@/server/auth/role'

export default async function ChoresPage() {
  const user = await getCurrentUser()
  const chores = await listPublishedChores()

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Available Chores</h1>
          {user && user.role === 'CUSTOMER' && (
            <Link
              href="/chores/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Post a Chore
            </Link>
          )}
        </div>

        {chores.length === 0 ? (
          <p className="text-gray-600">No chores available right now.</p>
        ) : (
          <div className="space-y-4">
            {chores.map((chore: any) => (
              <Link
                key={chore.id}
                href={`/chores/${chore.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {chore.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {chore.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-2 py-1 uppercase">
                        {chore.type}
                      </span>
                      {chore.category && (
                        <span className="rounded bg-gray-100 px-2 py-1">
                          {chore.category}
                        </span>
                      )}
                      {chore.budget != null && (
                        <span className="font-medium text-green-700">
                          ₹{chore.budget}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
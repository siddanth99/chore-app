import Link from 'next/link'
import { getCurrentUser } from '@/server/auth/role'
import Button from '@/components/ui/Button'

const categories = [
  { name: 'Cleaning', icon: '🧹', href: '/chores?category=Cleaning' },
  { name: 'Delivery', icon: '📦', href: '/chores?category=Delivery' },
  { name: 'Online Help', icon: '💻', href: '/chores?category=Online Help' },
  { name: 'Gardening', icon: '🌱', href: '/chores?category=Gardening' },
  { name: 'Tech Support', icon: '🔧', href: '/chores?category=Tech Support' },
]

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl md:text-6xl">
              Get your chores done.<br className="hidden sm:block" />
              <span className="text-blue-600 dark:text-blue-400">Earn money on your time.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-700 dark:text-slate-300">
              ChoreMarket connects busy customers with trusted local workers for everyday tasks –
              from deliveries and repairs to online help. Post a chore in minutes or browse nearby
              jobs and start earning today.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <>
                  {user.role === 'CUSTOMER' ? (
                    <Link href="/chores/new">
                      <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                        Post a Chore
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/chores">
                      <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                        Find Chores Near You
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard">
                    <Button variant="primary" size="lg" className="bg-blue-500 hover:bg-blue-400">
                      Go to Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                      I Need Help
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="primary" size="lg" className="bg-blue-500 hover:bg-blue-400">
                      I Want to Work
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Popular Categories
          </h2>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            Browse chores by category or find the help you need
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group rounded-lg bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-6 py-12 text-center border border-blue-100 dark:border-blue-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Ready to get started?
            </h2>
            <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
              {user
                ? 'Browse available chores or post your own task.'
                : 'Sign up to start posting chores or finding work opportunities.'}
            </p>
            <div className="mt-8">
              {user ? (
                <Link href="/chores">
                  <Button variant="primary" size="lg">
                    Browse Chores
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
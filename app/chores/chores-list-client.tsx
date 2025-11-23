'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChoreStatus, ChoreType } from '@prisma/client'
import WorkerLocationPicker from '@/components/WorkerLocationPicker'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

interface ChoresListClientProps {
  chores: any[]
  user: any
  initialFilters: { type?: ChoreType; location?: string }
  initialWorkerLat?: number | null
  initialWorkerLng?: number | null
  initialDistanceKm?: number
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: ChoreStatus): 'statusDraft' | 'statusPublished' | 'statusAssigned' | 'statusInProgress' | 'statusCompleted' | 'statusCancelled' {
  switch (status) {
    case 'DRAFT':
      return 'statusDraft'
    case 'PUBLISHED':
      return 'statusPublished'
    case 'ASSIGNED':
      return 'statusAssigned'
    case 'IN_PROGRESS':
      return 'statusInProgress'
    case 'COMPLETED':
      return 'statusCompleted'
    case 'CANCELLED':
      return 'statusCancelled'
    default:
      return 'statusDraft'
  }
}

// Helper function to get type badge variant
function getTypeBadgeVariant(type: ChoreType): 'typeOnline' | 'typeOffline' {
  switch (type) {
    case 'ONLINE':
      return 'typeOnline'
    case 'OFFLINE':
      return 'typeOffline'
    default:
      return 'typeOnline'
  }
}

// Helper function to calculate distance using Haversine formula (client-side)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function ChoresListClient({
  chores,
  user,
  initialFilters,
  initialWorkerLat,
  initialWorkerLng,
  initialDistanceKm = 10,
}: ChoresListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [typeFilter, setTypeFilter] = useState<string>(initialFilters.type || 'ALL')
  const [locationFilter, setLocationFilter] = useState<string>(initialFilters.location || '')
  const [workerLat, setWorkerLat] = useState<number | null>(initialWorkerLat || null)
  const [workerLng, setWorkerLng] = useState<number | null>(initialWorkerLng || null)
  const [distanceKm, setDistanceKm] = useState<number>(initialDistanceKm)

  // Sync state with URL params on mount/change (only when URL actually changes)
  useEffect(() => {
    const urlWorkerLat = searchParams.get('workerLat')
    const urlWorkerLng = searchParams.get('workerLng')
    const urlDistanceKm = searchParams.get('distanceKm')
    
    if (urlWorkerLat && urlWorkerLng) {
      const lat = parseFloat(urlWorkerLat)
      const lng = parseFloat(urlWorkerLng)
      if (!isNaN(lat) && !isNaN(lng)) {
        // Only update if different to avoid unnecessary re-renders
        if (workerLat !== lat || workerLng !== lng) {
          setWorkerLat(lat)
          setWorkerLng(lng)
        }
      }
    } else {
      // If URL doesn't have location params, clear local state
      if (workerLat !== null || workerLng !== null) {
        setWorkerLat(null)
        setWorkerLng(null)
      }
    }
    
    if (urlDistanceKm) {
      const dist = parseFloat(urlDistanceKm)
      if (!isNaN(dist) && dist >= 0 && dist !== distanceKm) {
        setDistanceKm(dist)
      }
    } else if (distanceKm !== 10) {
      // Reset to default if not in URL
      setDistanceKm(10)
    }
  }, [searchParams])

  const handleFilterChange = () => {
    const params = new URLSearchParams()
    
    // Add type filter
    if (typeFilter && typeFilter !== 'ALL') {
      params.set('type', typeFilter)
    }
    
    // Add location text filter
    if (locationFilter) {
      params.set('location', locationFilter)
    }
    
    // Add worker location and distance if available (for WORKER role)
    if (user?.role === 'WORKER' && workerLat !== null && workerLng !== null) {
      params.set('workerLat', workerLat.toString())
      params.set('workerLng', workerLng.toString())
      params.set('distanceKm', distanceKm.toString())
    }
    
    router.push(`/chores?${params.toString()}`)
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setWorkerLat(lat)
    setWorkerLng(lng)
    // Auto-apply distance filter when location is set
    if (user?.role === 'WORKER') {
      const params = new URLSearchParams()
      if (typeFilter && typeFilter !== 'ALL') {
        params.set('type', typeFilter)
      }
      if (locationFilter) {
        params.set('location', locationFilter)
      }
      params.set('workerLat', lat.toString())
      params.set('workerLng', lng.toString())
      params.set('distanceKm', distanceKm.toString())
      router.push(`/chores?${params.toString()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Available Chores</h1>
          {user?.role === 'CUSTOMER' && (
            <Link href="/chores/new">
              <Button variant="primary" size="sm">
                Create New Chore
              </Button>
            </Link>
          )}
        </div>

        {/* Worker Location Picker - Only for WORKER role */}
        {user?.role === 'WORKER' && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Set Your Location
            </h2>
            <WorkerLocationPicker
              onLocationChange={handleLocationChange}
              initialLat={workerLat}
              initialLng={workerLng}
            />
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Filter Chores</h2>
          <div className={`grid gap-4 ${user?.role === 'WORKER' && workerLat && workerLng ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
            <div>
              <label
                htmlFor="typeFilter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="locationFilter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Location (contains)
              </label>
              <input
                type="text"
                id="locationFilter"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Enter location..."
                className="block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            {/* Distance Filter - Only for WORKER with location set */}
            {user?.role === 'WORKER' && workerLat && workerLng && (
              <div>
                <label
                  htmlFor="distanceFilter"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Distance: {distanceKm} km
                </label>
                <input
                  type="range"
                  id="distanceFilter"
                  min="0"
                  max="50"
                  step="1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>0 km</span>
                  <span>50 km</span>
                </div>
              </div>
            )}
            <div className="flex items-end">
              <Button
                onClick={handleFilterChange}
                variant="primary"
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setTypeFilter('ALL')
                  setLocationFilter('')
                  setWorkerLat(null)
                  setWorkerLng(null)
                  setDistanceKm(10)
                  router.push('/chores')
                }}
                variant="secondary"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {chores.length === 0 ? (
          <Card className="text-center">
            <div className="max-w-md mx-auto py-8">
              <div className="text-6xl mb-4">🧹</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                No chores found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {user?.role === 'CUSTOMER'
                  ? 'Start by posting your first chore.'
                  : locationFilter || typeFilter !== 'ALL'
                  ? 'Try expanding your filters or distance range.'
                  : 'No published chores available at the moment.'}
              </p>
              {user?.role === 'CUSTOMER' && (
                <Link href="/chores/new">
                  <Button variant="primary">Post a Chore</Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              // Only sort if server didn't already sort by distance
              // Check if any chore has a distance property (indicates server-side distance filtering)
              const hasServerDistance = chores.some((c) => c.distance !== undefined)
              
              if (hasServerDistance) {
                // Server already sorted by distance, use as-is
                return chores
              }
              
              // Server didn't sort, so sort client-side if worker location is available
              const sortedChores = [...chores]
              if (user?.role === 'WORKER' && workerLat && workerLng) {
                sortedChores.sort((a, b) => {
                  // Calculate distance for OFFLINE chores only
                  const distA =
                    a.type === 'OFFLINE' && a.locationLat && a.locationLng
                      ? calculateDistance(workerLat, workerLng, a.locationLat, a.locationLng)
                      : Infinity
                  const distB =
                    b.type === 'OFFLINE' && b.locationLat && b.locationLng
                      ? calculateDistance(workerLat, workerLng, b.locationLat, b.locationLng)
                      : Infinity
                  return distA - distB
                })
              }
              return sortedChores
            })().map((chore) => (
              <Card
                key={chore.id}
                className="overflow-hidden transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5"
                padding="none"
              >
                {/* Chore Image Thumbnail */}
                {chore.imageUrl && (
                  <img
                    src={chore.imageUrl}
                    alt={chore.title}
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{chore.title}</h2>
                    <div className="flex gap-1">
                      <Badge variant={getTypeBadgeVariant(chore.type)}>
                        {chore.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Badge variant={getStatusBadgeVariant(chore.status)}>
                      {chore.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">
                    {chore.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-medium">Category:</span>
                      <span className="ml-2">{chore.category}</span>
                    </div>
                    {/* Show distance for OFFLINE chores when worker location is available */}
                    {chore.type === 'OFFLINE' &&
                      chore.locationLat &&
                      chore.locationLng &&
                      workerLat &&
                      workerLng && (
                        <div className="flex items-center text-sm text-blue-600 font-medium">
                          <span>📍</span>
                          <span className="ml-1">
                            {chore.distance !== undefined
                              ? `${chore.distance.toFixed(1)} km away`
                              : `${calculateDistance(
                                  workerLat,
                                  workerLng,
                                  chore.locationLat,
                                  chore.locationLng
                                ).toFixed(1)} km away`}
                          </span>
                        </div>
                      )}
                    {chore.budget && (
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Budget:</span>
                        <span className="ml-2">${chore.budget}</span>
                      </div>
                    )}
                    {chore.type === 'OFFLINE' && chore.locationAddress && (
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Location:</span>
                        <span className="ml-2 truncate">{chore.locationAddress}</span>
                      </div>
                    )}
                    {chore.dueAt && (
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Due:</span>
                        <span className="ml-2">
                          {new Date(chore.dueAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-medium">Applications:</span>
                      <span className="ml-2">{chore._count.applications}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      By {chore.createdBy.name}
                    </span>
                    <Link
                      href={`/chores/${chore.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


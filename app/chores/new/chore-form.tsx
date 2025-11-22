'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChoreForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ONLINE' as 'ONLINE' | 'OFFLINE',
    category: '',
    budget: '',
    locationAddress: '',
    locationLat: '',
    locationLng: '',
    dueAt: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseInt(formData.budget) : undefined,
          locationLat: formData.locationLat ? parseFloat(formData.locationLat) : undefined,
          locationLng: formData.locationLng ? parseFloat(formData.locationLng) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create chore')
        return
      }

      // Redirect to chores list or dashboard
      router.push('/chores')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.title}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type *
        </label>
        <select
          id="type"
          name="type"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category *
        </label>
        <input
          type="text"
          id="category"
          name="category"
          required
          placeholder="e.g., Cleaning, Gardening, Tech Support"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.category}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
          Budget (optional)
        </label>
        <input
          type="number"
          id="budget"
          name="budget"
          min="0"
          placeholder="Amount in your currency"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.budget}
          onChange={handleChange}
        />
      </div>

      {formData.type === 'OFFLINE' && (
        <>
          <div>
            <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700">
              Location Address *
            </label>
            <input
              type="text"
              id="locationAddress"
              name="locationAddress"
              required={formData.type === 'OFFLINE'}
              placeholder="Street address, city, state"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={formData.locationAddress}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="locationLat" className="block text-sm font-medium text-gray-700">
                Latitude (optional)
              </label>
              <input
                type="number"
                id="locationLat"
                name="locationLat"
                step="any"
                placeholder="e.g., 40.7128"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={formData.locationLat}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="locationLng" className="block text-sm font-medium text-gray-700">
                Longitude (optional)
              </label>
              <input
                type="number"
                id="locationLng"
                name="locationLng"
                step="any"
                placeholder="e.g., -74.0060"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={formData.locationLng}
                onChange={handleChange}
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700">
          Due Date (optional)
        </label>
        <input
          type="datetime-local"
          id="dueAt"
          name="dueAt"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.dueAt}
          onChange={handleChange}
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Chore'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}


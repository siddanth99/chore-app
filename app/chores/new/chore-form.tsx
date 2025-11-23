'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MapPicker from '@/components/MapPicker'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function ChoreForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
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
    
    // Validate OFFLINE chores must have coordinates
    if (formData.type === 'OFFLINE') {
      if (!formData.locationLat || !formData.locationLng) {
        setError('Please set the location on the map for offline chores.')
        return
      }
    }
    
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
          imageUrl: imageUrl && imageUrl.trim() ? imageUrl : null, // Send null instead of undefined or empty string
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploadingImage(true)
    setError('')
    
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload image')
        setImagePreview('')
        return
      }

      setImageUrl(data.url)
    } catch (err) {
      setError('Failed to upload image. Please try again.')
      setImagePreview('')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setImagePreview('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.title}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Type *
        </label>
        <select
          id="type"
          name="type"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Category *
        </label>
        <input
          type="text"
          id="category"
          name="category"
          required
          placeholder="e.g., Cleaning, Gardening, Tech Support"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.category}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="budget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Budget (optional)
        </label>
        <input
          type="number"
          id="budget"
          name="budget"
          min="0"
          placeholder="Amount in your currency"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.budget}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Image (optional)
        </label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleImageChange}
          disabled={uploadingImage}
          className="mt-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          JPEG, PNG, or WebP. Max 5MB.
        </p>
        {uploadingImage && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">Uploading image...</p>
        )}
        {(imagePreview || imageUrl) && (
          <div className="mt-4 relative">
            <img
              src={imagePreview || imageUrl}
              alt="Preview"
              className="h-48 w-full object-cover rounded-lg border border-gray-300 dark:border-slate-700"
            />
            <Button
              type="button"
              onClick={handleRemoveImage}
              variant="danger"
              size="sm"
              className="absolute top-2 right-2"
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {formData.type === 'OFFLINE' && (
        <>
          <div>
            <label htmlFor="locationAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Location Address *
            </label>
            <input
              type="text"
              id="locationAddress"
              name="locationAddress"
              required={formData.type === 'OFFLINE'}
              placeholder="Street address, city, state"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={formData.locationAddress}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location on Map *
            </label>
            <MapPicker
              lat={formData.locationLat ? parseFloat(formData.locationLat) : null}
              lng={formData.locationLng ? parseFloat(formData.locationLng) : null}
              onChange={(lat, lng) => {
                setFormData((prev) => ({
                  ...prev,
                  locationLat: lat.toString(),
                  locationLng: lng.toString(),
                }))
              }}
              heightClass="h-64"
            />
            {formData.locationLat && formData.locationLng && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Coordinates: Lat {parseFloat(formData.locationLat).toFixed(6)}, Lng{' '}
                {parseFloat(formData.locationLng).toFixed(6)}
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <label htmlFor="dueAt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Due Date (optional)
        </label>
        <input
          type="datetime-local"
          id="dueAt"
          name="dueAt"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={formData.dueAt}
          onChange={handleChange}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="flex-1"
        >
          {loading ? 'Creating...' : 'Create Chore'}
        </Button>
        <Button
          type="button"
          onClick={() => router.back()}
          variant="secondary"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}


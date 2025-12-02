'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChoreStatus } from '@prisma/client'
import MapPicker from '@/components/MapPicker'
import Button from '@/components/ui/button'
import Card from '@/components/ui/Card'

interface ChoreFormProps {
  mode: 'create' | 'edit'
  initialChore?: {
    id: string
    title: string
    description: string
    type: 'ONLINE' | 'OFFLINE'
    category: string
    budget: number | null
    locationAddress: string | null
    locationLat: number | null
    locationLng: number | null
    dueAt: string | null
    imageUrl: string | null
    status: string
  }
}

export default function ChoreForm({ mode, initialChore }: ChoreFormProps) {
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

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialChore) {
      // Format dueAt for datetime-local input (YYYY-MM-DDTHH:mm)
      const dueAtFormatted = initialChore.dueAt
        ? new Date(initialChore.dueAt).toISOString().slice(0, 16)
        : ''
      
      setFormData({
        title: initialChore.title || '',
        description: initialChore.description || '',
        type: initialChore.type || 'ONLINE',
        category: initialChore.category || '',
        budget: initialChore.budget?.toString() || '',
        locationAddress: initialChore.locationAddress || '',
        locationLat: initialChore.locationLat?.toString() || '',
        locationLng: initialChore.locationLng?.toString() || '',
        dueAt: dueAtFormatted,
      })
      
      if (initialChore.imageUrl) {
        setImageUrl(initialChore.imageUrl)
        setImagePreview(initialChore.imageUrl)
      }
    }
  }, [mode, initialChore])

  // Determine which fields are disabled based on status
  const status = initialChore?.status as ChoreStatus | undefined
  const isCompletedOrCancelled = status === ChoreStatus.COMPLETED || status === ChoreStatus.CANCELLED
  const isAssigned = status === ChoreStatus.ASSIGNED
  const isInProgress = status === ChoreStatus.IN_PROGRESS
  const isDraftOrPublished = status === ChoreStatus.DRAFT || status === ChoreStatus.PUBLISHED

  // Field disabled states
  const titleDisabled = mode === 'edit' && (isInProgress || isCompletedOrCancelled)
  const descriptionDisabled = mode === 'edit' && isCompletedOrCancelled
  const typeDisabled = mode === 'edit' && (isAssigned || isInProgress || isCompletedOrCancelled)
  const categoryDisabled = mode === 'edit' && (isAssigned || isInProgress || isCompletedOrCancelled)
  const budgetDisabled = mode === 'edit' && (isAssigned || isInProgress || isCompletedOrCancelled)
  const locationDisabled = mode === 'edit' && (isAssigned || isInProgress || isCompletedOrCancelled)
  const dueAtDisabled = mode === 'edit' && (isAssigned || isInProgress || isCompletedOrCancelled)
  const imageDisabled = mode === 'edit' && (isAssigned || isInProgress || isCompletedOrCancelled)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate OFFLINE chores must have coordinates (only for create or when type is editable)
    if (formData.type === 'OFFLINE' && !typeDisabled) {
      if (!formData.locationLat || !formData.locationLng) {
        setError('Please set the location on the map for offline chores.')
        return
      }
    }
    
    setLoading(true)

    try {
      const url = mode === 'create' 
        ? '/api/chores' 
        : `/api/chores/${initialChore?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PATCH'
      
      const body: any = {}
      
      // Build body based on mode and status
      if (mode === 'create') {
        // Create mode: send all fields
        body.title = formData.title
        body.description = formData.description
        body.type = formData.type
        body.category = formData.category
        body.budget = formData.budget ? parseInt(formData.budget) : null
        body.locationAddress = formData.locationAddress || null
        body.locationLat = formData.locationLat ? parseFloat(formData.locationLat) : null
        body.locationLng = formData.locationLng ? parseFloat(formData.locationLng) : null
        body.dueAt = formData.dueAt || null
        body.imageUrl = imageUrl && imageUrl.trim() ? imageUrl : null
      } else {
        // Edit mode: send only allowed fields based on status
        if (isDraftOrPublished) {
          // Full edit allowed
          body.title = formData.title
          body.description = formData.description
          body.type = formData.type
          body.category = formData.category
          body.budget = formData.budget ? parseInt(formData.budget) : null
          body.locationAddress = formData.locationAddress || null
          body.locationLat = formData.locationLat ? parseFloat(formData.locationLat) : null
          body.locationLng = formData.locationLng ? parseFloat(formData.locationLng) : null
          body.dueAt = formData.dueAt || null
          body.imageUrl = imageUrl && imageUrl.trim() ? imageUrl : null
        } else if (isAssigned) {
          // Only title and description
          body.title = formData.title
          body.description = formData.description
        } else if (isInProgress) {
          // Only description
          body.description = formData.description
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `Failed to ${mode === 'create' ? 'create' : 'update'} chore`)
        return
      }

      // Redirect based on mode
      if (mode === 'create') {
        router.push('/chores')
      } else {
        router.push(`/chores/${initialChore?.id}`)
      }
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
          disabled={titleDisabled}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={descriptionDisabled}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={typeDisabled}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={categoryDisabled}
          placeholder="e.g., Cleaning, Gardening, Tech Support"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={budgetDisabled}
          placeholder="Amount in your currency"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={uploadingImage || imageDisabled}
          className="mt-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
              required={formData.type === 'OFFLINE' && !locationDisabled}
              disabled={locationDisabled}
              placeholder="Street address, city, state"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.locationAddress}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location on Map *
            </label>
            <div className={locationDisabled ? 'pointer-events-none opacity-50' : ''}>
              <MapPicker
                lat={formData.locationLat ? parseFloat(formData.locationLat) : null}
                lng={formData.locationLng ? parseFloat(formData.locationLng) : null}
                onChange={(lat, lng) => {
                  if (!locationDisabled) {
                    setFormData((prev) => ({
                      ...prev,
                      locationLat: lat.toString(),
                      locationLng: lng.toString(),
                    }))
                  }
                }}
                heightClass="h-64"
              />
            </div>
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
          disabled={dueAtDisabled}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          value={formData.dueAt}
          onChange={handleChange}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading || isCompletedOrCancelled}
          variant="primary"
          className="flex-1"
        >
          {loading 
            ? (mode === 'create' ? 'Creating...' : 'Saving...') 
            : (mode === 'create' ? 'Create Chore' : 'Save Changes')}
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


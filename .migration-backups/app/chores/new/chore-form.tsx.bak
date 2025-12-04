'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChoreStatus } from '@prisma/client'
import { motion } from 'framer-motion'
import MapPicker from '@/components/MapPicker'
import Button from '@/components/ui/button'
import {
  CreateChoreLayout,
  ChorePreviewCard,
  FormInput,
  FormTextArea,
  ChoreTypeToggle,
  CategorySelect,
  BudgetInput,
  ImageUploadZone,
  DateTimeInput,
  itemVariants,
} from '@/components/chores/LovableCreateChorePage'
import { MapPin, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  validateImageFile,
  IMAGE_VALIDATION_ERRORS,
} from '@/lib/validation/image'
import { compressImage } from '@/lib/utils/image'

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
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
    setFieldErrors({})

    // Client-side validation: require description length >= 10 (only for create mode)
    if (mode === 'create' && formData.description.trim().length < 10) {
      setFieldErrors({ description: ['Description must be at least 10 characters'] })
      return
    }
    
    // Validate OFFLINE chores must have coordinates (only for create or when type is editable)
    if (formData.type === 'OFFLINE' && !typeDisabled) {
      if (!formData.locationLat || !formData.locationLng) {
        setError('Please set the location on the map for offline chores.')
        return
      }
    }
    
    // Validate compressed image if present
    if (imageUrl && (!imageUrl.startsWith('data:image') || imageUrl.length === 0)) {
      setError('Invalid image. Please upload a valid picture.')
      return
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
        body.imageUrl = imageUrl || null
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

      if (!response.ok) {
        let json
        try {
          json = await response.json()
        } catch (err) {
          setError(`Failed to ${mode === 'create' ? 'create' : 'update'} chore — please try again`)
          return
        }

        // If server returned structured errors
        if (json?.errors?.fieldErrors) {
          setFieldErrors(json.errors.fieldErrors)
          // Optionally show form-level errors
          if (json.errors.formErrors && json.errors.formErrors.length > 0) {
            setError(json.errors.formErrors[0])
          }
        } else if (json?.message) {
          // Check if it's an image-related error
          const errorMsg = json.message
          if (errorMsg.toLowerCase().includes('image') || errorMsg.toLowerCase().includes('upload')) {
            setError('Image upload failed. Please try again.')
          } else {
            setError(errorMsg)
          }
        } else if (json?.error) {
          setError(json.error)
        } else {
          setError(`Failed to ${mode === 'create' ? 'create' : 'update'} chore`)
        }
        return
      }

      const result = await response.json()

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
    // Clear server-side field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear any previous error
    setError('')

    // Client-side validation using shared utility
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      setImagePreview('')
      setImageUrl('')
      e.target.value = ''
      return
    }

    // Compress image before storing
    setUploadingImage(true)
    try {
      const compressedBase64 = await compressImage(file)
      
      if (!compressedBase64) {
        setError('Image upload failed. Please try another image.')
        setImagePreview('')
        setImageUrl('')
        e.target.value = ''
        setUploadingImage(false)
        return
      }

      // Store compressed base64 string directly
      setImagePreview(compressedBase64)
      setImageUrl(compressedBase64)
    } catch (err) {
      setError('Image upload failed. Please try another image.')
      setImagePreview('')
      setImageUrl('')
      e.target.value = ''
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setImagePreview('')
  }

  // Build sidebar preview
  const sidebarPreview = (
    <ChorePreviewCard
      title={formData.title}
      description={formData.description}
      category={formData.category}
      budget={formData.budget}
      location={formData.locationAddress}
      dueAt={formData.dueAt}
      imageUrl={imagePreview || imageUrl}
      type={formData.type}
    />
  )

  return (
    <CreateChoreLayout
      title={mode === 'create' ? 'Create a New Chore' : 'Edit Chore'}
      subtitle={mode === 'create' 
        ? 'Post your task and connect with trusted helpers in your area'
        : 'Update the details of your chore'}
      sidebar={sidebarPreview}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}

        {/* Status Warning for Edit Mode */}
        {mode === 'edit' && isCompletedOrCancelled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-muted p-4 text-center"
          >
            <p className="text-sm text-muted-foreground">
              This chore is {status?.toLowerCase()}. No further edits are allowed.
            </p>
          </motion.div>
        )}

        {/* Title */}
        <FormInput
          id="title"
          name="title"
          label="Title"
          placeholder="e.g., Help with garden cleanup"
          value={formData.title}
          onChange={handleChange}
          disabled={titleDisabled}
          required
          error={fieldErrors.title?.[0]}
        />

        {/* Description */}
        <FormTextArea
          id="description"
          name="description"
          label="Description"
          placeholder="Describe what you need done, any specific requirements, tools needed..."
          value={formData.description}
          onChange={handleChange}
          disabled={descriptionDisabled}
          minLength={10}
          maxLength={4000}
          required
          error={fieldErrors.description?.[0]}
          aria-invalid={!!fieldErrors.description || (formData.description.length > 0 && formData.description.length < 10)}
          aria-describedby={fieldErrors.description ? 'description-error description-help' : 'description-help'}
        />
        {formData.description.length > 0 && formData.description.length < 10 && !fieldErrors.description && (
          <div className="text-yellow-600 text-sm" role="alert" id="description-help">
            Description must be at least 10 characters
          </div>
        )}

        {/* Type Toggle */}
        <ChoreTypeToggle
          value={formData.type}
          onChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
          disabled={typeDisabled}
        />

        {/* Category - with suggested presets and custom input */}
        <div className="space-y-2">
          <CategorySelect
            value={formData.category}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, category: value }))
              // Clear server-side field error when user types
              if (fieldErrors.category) {
                setFieldErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.category
                  return newErrors
                })
              }
            }}
            disabled={categoryDisabled}
          />
          {fieldErrors.category && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-destructive flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.category[0]}
            </motion.p>
          )}
        </div>

        {/* Budget */}
        <BudgetInput
          value={formData.budget}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, budget: value }))
            // Clear server-side field error when user types
            if (fieldErrors.budget) {
              setFieldErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors.budget
                return newErrors
              })
            }
          }}
          disabled={budgetDisabled}
          error={fieldErrors.budget?.[0]}
        />

        {/* Image Upload */}
        <ImageUploadZone
          imagePreview={imagePreview}
          imageUrl={imageUrl}
          onFileChange={handleImageChange}
          onRemove={handleRemoveImage}
          uploading={uploadingImage}
          disabled={imageDisabled}
        />

        {/* OFFLINE Location Section */}
        {formData.type === 'OFFLINE' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 pt-2"
          >
            <div className="border-t border-border pt-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location Details
                <span className="text-sm font-normal text-muted-foreground">(Required for Offline Chores)</span>
              </h3>
              
              {/* Location Address Input - using plain elements, not variants */}
              <div className="space-y-2">
                <label 
                  htmlFor="locationAddress" 
                  className="block text-sm font-medium text-foreground"
                >
                  Location Address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="locationAddress"
                    name="locationAddress"
                    type="text"
                    placeholder="Street address, city, state"
                    value={formData.locationAddress}
                    onChange={handleChange}
                    disabled={locationDisabled}
                    required={formData.type === 'OFFLINE' && !locationDisabled}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10",
                      "ring-offset-background placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  />
                </div>
              </div>

              {/* Map Picker Section - no variants needed */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Pin Location on Map <span className="text-destructive">*</span>
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
                  heightClass="h-72"
                  disabled={locationDisabled}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Due Date */}
        <DateTimeInput
          label="Due Date (optional)"
          value={formData.dueAt}
          onChange={(value) => setFormData((prev) => ({ ...prev, dueAt: value }))}
          disabled={dueAtDisabled}
        />

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4 pt-4 border-t border-border">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
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
        </motion.div>
      </form>
    </CreateChoreLayout>
  )
}

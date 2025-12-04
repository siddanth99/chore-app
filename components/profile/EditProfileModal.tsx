'use client'

import React, { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/button'
import {
  validateImageFile,
  IMAGE_VALIDATION_ERRORS,
} from '@/lib/validation/image'
import { compressImage } from '@/lib/utils/image'

type ApiErrorResponse = {
  ok: false
  fieldErrors?: Record<string, string[]>
  globalError?: string
  message?: string
}

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: {
    id: string
    name: string
    email: string
    bio: string | null
    avatarUrl: string | null
    baseLocation: string | null
    phone?: string | null
    skills?: string[]
    hourlyRate?: number | null
  }
  onSave: (data: {
    name: string
    bio: string
    phone: string
    location: string
    skills: string[]
    hourlyRate: number | null
    avatarUrl?: string | null
  }) => Promise<{ ok: true; profile: any } | { ok: false; fieldErrors?: Record<string, string[]>; globalError?: string }>
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [location, setLocation] = useState(profile.baseLocation || '')
  const [skills, setSkills] = useState(
    profile.skills?.join(', ') || ''
  )
  const [hourlyRate, setHourlyRate] = useState(
    profile.hourlyRate?.toString() || ''
  )
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatarUrl
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset form when profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile.name)
      setBio(profile.bio || '')
      setPhone(profile.phone || '')
      setLocation(profile.baseLocation || '')
      setSkills(profile.skills?.join(', ') || '')
      setHourlyRate(profile.hourlyRate?.toString() || '')
      setAvatarPreview(profile.avatarUrl)
      setErrors({})
      setFieldErrors({})
      setError(null)
      setGlobalError(null)
      setShowSuccess(false)
    }
  }, [isOpen, profile])

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleTab = (e: KeyboardEvent) => {
      if (!modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleTab)

    // Focus first element
    const firstInput = modalRef.current?.querySelector(
      'input, textarea, button'
    ) as HTMLElement
    firstInput?.focus()

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
    }
  }, [isOpen, onClose])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation using shared utility
    const validationError = validateImageFile(file)
    if (validationError) {
      setErrors({ ...errors, avatar: validationError })
      setAvatarPreview(null)
      e.target.value = ''
      return
    }

    // Compress image before storing
    try {
      setErrors({ ...errors, avatar: '' })
      const compressedBase64 = await compressImage(file)
      
      if (!compressedBase64) {
        setErrors({ ...errors, avatar: 'Image upload failed. Please try another image.' })
        setAvatarPreview(null)
        e.target.value = ''
        return
      }

      // Store compressed base64 string
      setAvatarPreview(compressedBase64)
    } catch (err) {
      setErrors({ ...errors, avatar: 'Image upload failed. Please try another image.' })
      setAvatarPreview(null)
      e.target.value = ''
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (hourlyRate && (isNaN(Number(hourlyRate)) || Number(hourlyRate) < 0)) {
      newErrors.hourlyRate = 'Please enter a valid hourly rate'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Validate compressed image if present
    if (avatarPreview && (!avatarPreview.startsWith('data:image') || avatarPreview.length === 0)) {
      setGlobalError('Invalid image. Please upload a valid picture.')
      return
    }

    setSaving(true)
    setError(null)
    setGlobalError(null)
    setFieldErrors({})

    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const payload = {
      name: name.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
      location: location.trim(),
      skills: skillsArray,
      hourlyRate: hourlyRate ? Number(hourlyRate) : null,
      avatarUrl: avatarPreview || null,
    }

    try {
      const result = await onSave(payload)

      if (!result?.ok) {
        const err = result as ApiErrorResponse
        if (err?.fieldErrors) {
          setFieldErrors(err.fieldErrors)
        } else {
          // Check for image upload error message
          const errorMsg = err?.globalError ?? err?.message ?? 'Failed to save profile'
          setGlobalError(errorMsg)
        }
        setSaving(false)
        return
      }

      // Success
      setSaving(false)
      setFieldErrors({})
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
        setShowSuccess(false)
      }, 1000)
    } catch (err) {
      console.error('Error saving profile:', err)
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      // Check if it's an image-related error
      if (errorMsg.toLowerCase().includes('image') || errorMsg.toLowerCase().includes('upload')) {
        setGlobalError('Image upload failed. Please try again.')
      } else {
        setGlobalError(errorMsg)
      }
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            id="edit-profile-title"
            className="text-xl font-semibold text-slate-900 dark:text-slate-50"
          >
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            aria-label="Close modal"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" aria-label="Edit Profile Form">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-400"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                </Button>
                {errors.avatar && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.avatar}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  JPEG, PNG, or WebP up to 5MB. Saved when you click Save Changes.
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                // Clear server-side field error when user types
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.name
                    return newErrors
                  })
                }
              }}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={errors.name || fieldErrors.name ? 'true' : 'false'}
              aria-describedby={errors.name || fieldErrors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
              >
                {errors.name}
              </p>
            )}
            {fieldErrors.name && (
              <div role="alert" className="text-red-600 dark:text-red-400 text-sm mt-1">
                {fieldErrors.name[0]}
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value)
                // Clear server-side field error when user types
                if (fieldErrors.bio) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.bio
                    return newErrors
                  })
                }
              }}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none"
              aria-invalid={fieldErrors.bio ? 'true' : 'false'}
              aria-describedby={fieldErrors.bio ? 'bio-error' : undefined}
            />
            {fieldErrors.bio && (
              <div role="alert" id="bio-error" className="text-red-600 dark:text-red-400 text-sm mt-1">
                {fieldErrors.bio[0]}
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                // Clear server-side field error when user types
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.phone
                    return newErrors
                  })
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={errors.phone || fieldErrors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone || fieldErrors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p
                id="phone-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
              >
                {errors.phone}
              </p>
            )}
            {fieldErrors.phone && (
              <div role="alert" className="text-red-600 dark:text-red-400 text-sm mt-1">
                {fieldErrors.phone[0]}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                // Clear server-side field error when user types
                if (fieldErrors.baseLocation) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.baseLocation
                    return newErrors
                  })
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={fieldErrors.baseLocation ? 'true' : 'false'}
              aria-describedby={fieldErrors.baseLocation ? 'location-error' : undefined}
            />
            {fieldErrors.baseLocation && (
              <div role="alert" id="location-error" className="text-red-600 dark:text-red-400 text-sm mt-1">
                {fieldErrors.baseLocation[0]}
              </div>
            )}
          </div>

          {/* Skills */}
          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Skills (comma-separated)
            </label>
            <input
              id="skills"
              type="text"
              value={skills}
              onChange={(e) => {
                setSkills(e.target.value)
                // Clear server-side field error when user types
                if (fieldErrors.skills) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.skills
                    return newErrors
                  })
                }
              }}
              placeholder="e.g., Plumbing, Electrical, Painting"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={fieldErrors.skills ? 'true' : 'false'}
              aria-describedby={fieldErrors.skills ? 'skills-error' : undefined}
            />
            {fieldErrors.skills && (
              <div role="alert" id="skills-error" className="text-red-600 dark:text-red-400 text-sm mt-1">
                {fieldErrors.skills[0]}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Separate multiple skills with commas
            </p>
          </div>

          {/* Hourly Rate */}
          <div>
            <label
              htmlFor="hourlyRate"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Hourly Rate (₹)
            </label>
            <input
              id="hourlyRate"
              type="number"
              min="0"
              step="1"
              value={hourlyRate}
              onChange={(e) => {
                setHourlyRate(e.target.value)
                // Clear server-side field error when user types
                if (fieldErrors.hourlyRate) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.hourlyRate
                    return newErrors
                  })
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={errors.hourlyRate || fieldErrors.hourlyRate ? 'true' : 'false'}
              aria-describedby={errors.hourlyRate || fieldErrors.hourlyRate ? 'hourlyRate-error' : undefined}
            />
            {errors.hourlyRate && (
              <p
                id="hourlyRate-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
              >
                {errors.hourlyRate}
              </p>
            )}
            {fieldErrors.hourlyRate && (
              <div role="alert" className="text-red-600 dark:text-red-400 text-sm mt-1">
                {fieldErrors.hourlyRate[0]}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}
          {globalError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {globalError}
              </p>
            </div>
          )}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400">
                Profile saved successfully!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


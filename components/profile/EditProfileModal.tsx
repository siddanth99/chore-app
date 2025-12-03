'use client'

import React, { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/button'

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
    avatarFile?: File
  }) => Promise<void>
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
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
      setAvatarFile(null)
      setErrors({})
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, avatar: 'Please select an image file' })
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, avatar: 'Image must be less than 5MB' })
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setErrors({ ...errors, avatar: '' })
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

    setIsSaving(true)
    setShowSuccess(false)

    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      await onSave({
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        skills: skillsArray,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        avatarFile: avatarFile || undefined,
      })

      setShowSuccess(true)
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose()
        setShowSuccess(false)
      }, 1000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setErrors({
        submit: 'Failed to save profile. Please try again.',
      })
    } finally {
      setIsSaving(false)
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  accept="image/*"
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
                  {/* TODO: API: implement POST /api/users/:id/avatar */}
                  Image will be uploaded when you save
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
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
              >
                {errors.name}
              </p>
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
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none"
            />
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
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p
                id="phone-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
              >
                {errors.phone}
              </p>
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
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
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
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., Plumbing, Electrical, Painting"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
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
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              aria-invalid={errors.hourlyRate ? 'true' : 'false'}
              aria-describedby={errors.hourlyRate ? 'hourlyRate-error' : undefined}
            />
            {errors.hourlyRate && (
              <p
                id="hourlyRate-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
              >
                {errors.hourlyRate}
              </p>
            )}
          </div>

          {/* Submit Error */}
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
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


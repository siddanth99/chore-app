'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileCard from './ProfileCard'
import RatingSummary from './RatingSummary'
import ReviewsList from './ReviewsList'
import QuickLinks from './QuickLinks'
import EditProfileModal from './EditProfileModal'
import Button from '@/components/ui/button'

interface ProfilePageViewProps {
  profile: {
    id: string
    name: string
    email: string
    role: string
    bio: string | null
    avatarUrl: string | null
    baseLocation: string | null
    createdAt: Date | string
    phone?: string | null
    skills?: string[]
    hourlyRate?: number | null
  }
  ratings: Array<{
    id: string
    score: number
    comment: string | null
    createdAt: Date | string
    fromUser: {
      id: string
      name: string
    }
    chore: {
      id: string
      title: string
    }
  }>
  averageRating: {
    average: number
    count: number
  }
}

export default function ProfilePageView({
  profile,
  ratings,
  averageRating,
}: ProfilePageViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const router = useRouter()

  const handleSave = async (data: {
    name: string
    bio: string
    phone: string
    location: string
    skills: string[]
    hourlyRate: number | null
    avatarFile?: File
  }) => {
    // TODO: Analytics: track profile update event
    // TODO: Image upload: implement POST /api/profile/avatar if avatarFile is provided

    try {
      // Call the profile update API
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          bio: data.bio,
          phone: data.phone,
          baseLocation: data.location,
          skills: data.skills,
          hourlyRate: data.hourlyRate,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save profile')
      }

      // Update local state with server response
      if (result.user) {
        setCurrentProfile({
          ...currentProfile,
          name: result.user.name,
          bio: result.user.bio,
          baseLocation: result.user.baseLocation,
          avatarUrl: result.user.avatarUrl,
          // phone, skills, hourlyRate - update when schema supports them
        })
      }

      // TODO: Handle avatar upload separately if avatarFile is provided
      // if (data.avatarFile) {
      //   const formData = new FormData()
      //   formData.append('avatar', data.avatarFile)
      //   await fetch('/api/profile/avatar', {
      //     method: 'POST',
      //     body: formData,
      //   })
      // }

      // Refresh the page to ensure server-rendered data is up to date
      // This forces a re-fetch of session and profile data
      router.refresh()
    } catch (error) {
      console.error('Error saving profile:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header with Edit Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Your Profile
          </h1>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsEditModalOpen(true)}
            aria-label="Edit profile"
          >
            Edit Profile
          </Button>
        </div>

        {/* Profile Card */}
        <ProfileCard {...currentProfile} />

        {/* Rating Summary */}
        <RatingSummary
          average={averageRating.average}
          count={averageRating.count}
        />

        {/* Reviews List */}
        <ReviewsList reviews={ratings} />

        {/* Quick Links */}
        <QuickLinks />

        {/* Edit Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={currentProfile}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}


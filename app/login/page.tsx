'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new signin page for backward compatibility
    router.replace('/signin')
  }, [router])
  
  return null
}

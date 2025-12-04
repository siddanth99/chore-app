'use client'

import dynamic from 'next/dynamic'

import React from 'react'

import type { Chore } from '@/components/chores/types'

// dynamic import so Leaflet code only loads in the browser
const RealMap = dynamic(() => import('./RealMap'), { ssr: false })

type Props = {
  chores: Chore[]
  visibleChoresInRadius?: Chore[]
  userPosition?: { lat: number; lng: number } | null
  radius?: number
  className?: string
  isDark?: boolean
}

export default function MapPlaceholder({ chores, visibleChoresInRadius, userPosition, radius, className, isDark }: Props) {
  // Use visibleChoresInRadius if provided, otherwise use chores
  const choresToDisplay = visibleChoresInRadius ?? chores;
  
  return (
    <div className={className || 'w-full h-full min-h-[350px] md:min-h-[420px] relative rounded-2xl overflow-hidden shadow-lg'}>
      <RealMap 
        chores={choresToDisplay.map(c => {
          // Transform chore data to ensure numeric price field
          // Check multiple potential price fields and normalize to number
          const priceValue = (c as any).price ?? (c as any).quote ?? c.budget ?? (c as any).amount ?? null;
          const numericPrice = typeof priceValue === 'string' && priceValue.trim() !== '' 
            ? Number(priceValue.replace(/[^\d]/g, '')) 
            : priceValue;
          
          return {
            id: c.id,
            title: c.title,
            price: typeof numericPrice === 'number' && !Number.isNaN(numericPrice) ? numericPrice : null,
            budget: c.budget,
            quote: (c as any).quote ?? null,
            amount: (c as any).amount ?? null,
            category: c.category,
            description: c.description,
            lat: c.lat,
            lng: c.lng,
          };
        })}
        userPosition={userPosition}
        radius={radius}
        className={className}
        isDark={isDark}
      />
    </div>
  )
}

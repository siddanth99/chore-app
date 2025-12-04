'use client';

import { useState } from 'react';
import { BrowseChoresPageEnhanced } from './BrowseChoresPageEnhanced';
import { Chore } from './types';

/**
 * SAMPLE CHORES DATA
 * Replace this with server-fetched data from your API.
 * Example: In app/chores/page.tsx, fetch chores and pass to BrowseChoresPageEnhanced
 */
const SAMPLE_CHORES: Chore[] = [
  {
    id: '1',
    title: 'Garden Cleanup & Landscaping',
    description: 'Need help cleaning up my backyard garden. Includes weeding, trimming bushes, and general landscaping. Tools will be provided. Looking for someone with gardening experience.',
    category: 'gardening',
    budget: 150,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Brooklyn, NY',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    applications: 5,
    author: 'Sarah M.',
  },
  {
    id: '2',
    title: 'Furniture Assembly - IKEA Bedroom Set',
    description: 'Just got a new bedroom set from IKEA that needs assembly. Includes bed frame, wardrobe, and nightstands. Should take about 3-4 hours.',
    category: 'handyman',
    budget: 120,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Manhattan, NY',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    applications: 8,
    author: 'Mike R.',
  },
  {
    id: '3',
    title: 'Package Pickup & Delivery',
    description: 'Need someone to pick up a package from FedEx on 5th Ave and deliver it to my apartment in Chelsea. Package weighs about 10 lbs.',
    category: 'delivery',
    budget: 35,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Chelsea, NY',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    applications: 3,
    author: 'Emma L.',
  },
  {
    id: '4',
    title: 'Deep Clean 2BR Apartment',
    description: 'Looking for a thorough deep clean of my 2-bedroom apartment before a party this weekend. Kitchen, bathrooms, living room, and bedrooms.',
    category: 'cleaning',
    budget: 200,
    currency: '$',
    type: 'offline',
    status: 'in_progress',
    location: 'Williamsburg, NY',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    applications: 12,
    author: 'David K.',
  },
  {
    id: '5',
    title: 'Help Moving to New Apartment',
    description: 'Moving from a studio to a 1BR. Need help loading/unloading a rental truck. About 2-3 hours of work. Will provide snacks and drinks!',
    category: 'moving',
    budget: 180,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Queens, NY',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    applications: 6,
    author: 'Lisa P.',
  },
  {
    id: '6',
    title: 'Dog Walking - Twice Daily for 1 Week',
    description: 'Need a reliable dog walker for my golden retriever while I\'m traveling. Two 30-minute walks per day, morning and evening.',
    category: 'pet_care',
    budget: 250,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Upper East Side, NY',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    applications: 9,
    author: 'John B.',
  },
  {
    id: '7',
    title: 'Website Bug Fixes & Updates',
    description: 'Need a developer to fix some bugs on my WordPress site and update plugins. Should be a quick remote job for someone experienced.',
    category: 'tech',
    budget: 100,
    currency: '$',
    type: 'online',
    status: 'published',
    location: 'Remote',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    applications: 15,
    author: 'Anna S.',
  },
  {
    id: '8',
    title: 'Grocery Shopping & Meal Prep',
    description: 'Looking for someone to do weekly grocery shopping and basic meal prep for a family of 4. List will be provided.',
    category: 'errands',
    budget: 80,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Astoria, NY',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    applications: 4,
    author: 'Chris W.',
  },
  {
    id: '9',
    title: 'Lawn Mowing & Edge Trimming',
    description: 'Regular lawn maintenance needed for a medium-sized backyard. Includes mowing, edge trimming, and leaf blowing.',
    category: 'gardening',
    budget: 60,
    currency: '$',
    type: 'offline',
    status: 'completed',
    location: 'Staten Island, NY',
    imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    applications: 7,
    author: 'Tom H.',
  },
  {
    id: '10',
    title: 'Data Entry - Excel Spreadsheets',
    description: 'Need help entering data from PDFs into Excel spreadsheets. About 500 entries total. Can be done remotely at your own pace.',
    category: 'tech',
    budget: 75,
    currency: '$',
    type: 'online',
    status: 'published',
    location: 'Remote',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    applications: 20,
    author: 'Rachel G.',
  },
  {
    id: '11',
    title: 'Bathroom Tile Repair',
    description: 'A few tiles in my bathroom have cracked and need replacing. Looking for someone handy who can match and replace them.',
    category: 'handyman',
    budget: 90,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Bronx, NY',
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    applications: 2,
    author: 'Kevin M.',
  },
  {
    id: '12',
    title: 'Cat Sitting - Weekend Stay',
    description: 'Need someone to stay at my place and care for my two cats over the weekend. Just feeding, water, and some playtime.',
    category: 'pet_care',
    budget: 120,
    currency: '$',
    type: 'offline',
    status: 'published',
    location: 'Hoboken, NJ',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    applications: 11,
    author: 'Megan F.',
  },
];

/**
 * BrowseChoresExample - Example page demonstrating the enhanced Browse Chores UI.
 * 
 * Integration notes:
 * - Copy this pattern to your app/chores/page.tsx
 * - Replace SAMPLE_CHORES with data fetched from your API
 * - Pass initialFilters from URL search params if needed
 * 
 * TODO: Wire API calls here
 * ```tsx
 * // In app/chores/page.tsx:
 * import { fetchChores } from '@/lib/api';
 * 
 * export default async function ChoresPage() {
 *   const chores = await fetchChores();
 *   return <BrowseChoresPageEnhanced chores={chores} />;
 * }
 * ```
 */
export function BrowseChoresExample() {
  const [chores] = useState<Chore[]>(SAMPLE_CHORES);

  return (
    <BrowseChoresPageEnhanced
      chores={chores}
      initialFilters={{}}
    />
  );
}

export default BrowseChoresExample;

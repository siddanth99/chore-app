// app/page.tsx
import React from 'react';
import LandingPage from '@/components/landing/LandingPage';

export const metadata = {
  title: 'Chore App — Home',
  description: 'Post chores, receive bids from local workers, and get it done.',
};

export default function Home() {
  return <LandingPage />;
}

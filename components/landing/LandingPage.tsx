"use client";

import { Hero } from './Hero';
import { SearchBar } from './SearchBar';
import { HowItWorks } from './HowItWorks';
import { FeaturedCategories } from './CategoryTile';
import { FeaturedChores, ChoreCardProps } from './ChoreCard';
import { TrustStrip } from './TrustStrip';
import { Testimonials } from './Testimonials';
import { CTABanner } from './CTABanner';
import { Footer } from './Footer';

export interface LandingPageProps {
  chores?: ChoreCardProps[];
  categories?: Array<{ name: string; count: number }>;
}

export function LandingPage({ chores = [], categories }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <Hero />
        <SearchBar />
        <HowItWorks />
        <FeaturedCategories categories={categories} />
        <FeaturedChores chores={chores} />
        <TrustStrip />
        <Testimonials />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;

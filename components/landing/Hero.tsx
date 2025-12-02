'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { IllustrationHero } from './IllustrationHero';

export function Hero() {
  const router = useRouter();

  const handlePostChore = () => {
    // TODO: track analytics for Post a Chore CTA click
    router.push('/chores/new');
  };

  const handleBrowseChores = () => {
    // TODO: track analytics for Browse Chores CTA click
    router.push('/chores');
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-6 fade-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Get Everyday Chores Done —{' '}
              <span className="gradient-text">Fast & Trusted</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Connect with verified local helpers for any task. From lawn care to furniture assembly, 
              get it done quickly and securely.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start fade-up fade-up-delay-1">
              <Button
                size="lg"
                className="text-base font-semibold px-8 py-6 shadow-glow hover:shadow-glow-lg transition-shadow"
                onClick={handlePostChore}
                aria-label="Post a new chore"
              >
                Post a Chore
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base font-semibold px-8 py-6 border-2"
                onClick={handleBrowseChores}
                aria-label="Browse available chores"
              >
                Browse Chores
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 fade-up fade-up-delay-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified Helpers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-highlight" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.9 ★ Average Rating</span>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="fade-up fade-up-delay-3">
            <IllustrationHero />
          </div>
        </div>
      </div>
    </section>
  );
}


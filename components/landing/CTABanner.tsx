'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function CTABanner() {
  const router = useRouter();

  const handlePostChore = () => {
    // TODO: track analytics for Post Your First Chore CTA click
    router.push('/chores/new');
  };

  const handleBecomeHelper = () => {
    // TODO: track analytics for Become a Helper CTA click
    // TODO: navigate to worker signup or profile setup flow
    router.push('/signup?role=worker');
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-accent" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto fade-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Things Done?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl mx-auto">
            Join thousands of people who are getting their chores done faster, easier, and more affordably.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 z-40 relative hero-primary-cta border-0"
              onClick={handlePostChore}
              aria-label="Post your first chore"
            >
              Post Your First Chore
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="border-2 border-white !text-white hover:bg-white/10 text-base font-semibold px-8 py-6"
              onClick={handleBecomeHelper}
              aria-label="Sign up to become a helper"
            >
              Become a Helper
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}


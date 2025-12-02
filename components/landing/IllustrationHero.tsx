export function IllustrationHero() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-accent/10 to-transparent blur-3xl" />
      
      {/* Main illustration container */}
      <div className="relative">
        {/* Phone mockup */}
        <div className="float-animation glass-card p-4 rounded-3xl mx-auto w-64 sm:w-72">
          <div className="bg-secondary rounded-2xl p-4 space-y-3">
            {/* App header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <span className="font-semibold text-sm">Chore App</span>
            </div>
            
            {/* Task cards */}
            <div className="space-y-2">
              <div className="bg-card p-3 rounded-xl border border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium">Lawn Mowing</p>
                    <p className="text-[10px] text-muted-foreground">2 miles away</p>
                  </div>
                  <span className="text-xs font-bold text-primary">$45</span>
                </div>
              </div>
              <div className="bg-card p-3 rounded-xl border border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium">House Cleaning</p>
                    <p className="text-[10px] text-muted-foreground">0.5 miles away</p>
                  </div>
                  <span className="text-xs font-bold text-accent">$80</span>
                </div>
              </div>
              <div className="bg-card p-3 rounded-xl border border-border/50 opacity-70">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium">Furniture Assembly</p>
                    <p className="text-[10px] text-muted-foreground">1.2 miles away</p>
                  </div>
                  <span className="text-xs font-bold text-highlight">$65</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute -top-4 -right-4 float-animation-delayed glass-card p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <span className="text-xs font-medium">Task Complete!</span>
          </div>
        </div>

        <div className="absolute -bottom-2 -left-6 float-animation glass-card p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary/80 ring-2 ring-card" />
              <div className="w-6 h-6 rounded-full bg-accent/80 ring-2 ring-card" />
              <div className="w-6 h-6 rounded-full bg-highlight/80 ring-2 ring-card" />
            </div>
            <span className="text-xs font-medium">3 bids</span>
          </div>
        </div>

        {/* Map pin with pulse */}
        <div className="absolute top-1/2 -right-8 sm:-right-12">
          <div className="relative">
            <div className="pulse-pin absolute inset-0 w-10 h-10 rounded-full bg-primary/30" />
            <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


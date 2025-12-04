'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Button from '@/components/ui/button';
import NotificationsBell from '@/components/notifications/NotificationsBell';

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-primary">
    <rect width="32" height="32" rx="8" fill="currentColor" />
    <path d="M9 16L14 21L23 11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Get user role from session
  const userRole = (session?.user as any)?.role;

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handlePostChore = () => {
    router.push('/chores/new');
  };

  const navItems = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Browse Chores', href: '/chores' },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" aria-label="Chore App Home">
            <Logo />
            <span className="hidden sm:inline">Chore App</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
            )}

            {/* Notifications Bell - Real component with unread count */}
            {session && <NotificationsBell />}

            {/* CTAs - Role-based */}
            <div className="hidden sm:flex items-center gap-2">
              {/* WORKER: Show "My Applications" only */}
              {session && userRole === 'WORKER' && (
                <Button
                  className="text-sm font-medium bg-primary hover:bg-primary/90"
                  onClick={() => router.push('/applications')}
                >
                  My Applications
                </Button>
              )}
              
              {/* CUSTOMER: Show "Browse Chores" + "Post a Chore" */}
              {session && userRole === 'CUSTOMER' && (
                <>
                  <Button
                    variant="ghost"
                    className="text-sm font-medium"
                    onClick={() => router.push('/chores')}
                  >
                    Browse Chores
                  </Button>
                  <Button
                    className="text-sm font-medium bg-primary hover:bg-primary/90"
                    onClick={handlePostChore}
                  >
                    Post a Chore
                  </Button>
                </>
              )}
              
              {/* Not logged in: Show Browse Chores only */}
              {!session && (
                <Button
                  variant="ghost"
                  className="text-sm font-medium"
                  onClick={() => router.push('/chores')}
                >
                  Browse Chores
                </Button>
              )}
            </div>

            {/* Auth / Profile Section */}
            {status === 'loading' ? (
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            ) : session ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* Profile Link */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="sr-only">Open profile</span>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserIcon />
                  </div>
                  <span className="hidden md:inline text-sm text-muted-foreground max-w-[120px] truncate">
                    {session.user?.name ?? session.user?.email}
                  </span>
                </Link>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>
                  Log out
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" onClick={() => signIn()}>
                  Log in
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40 animate-fade-in">
            <nav className="flex flex-col gap-2" role="navigation" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                {/* WORKER mobile: My Applications */}
                {session && userRole === 'WORKER' && (
                  <Button className="w-full" onClick={() => { setMobileMenuOpen(false); router.push('/applications'); }}>
                    My Applications
                  </Button>
                )}
                
                {/* CUSTOMER mobile: Browse + Post */}
                {session && userRole === 'CUSTOMER' && (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); router.push('/chores'); }}>
                      Browse Chores
                    </Button>
                    <Button className="w-full" onClick={() => { setMobileMenuOpen(false); handlePostChore(); }}>
                      Post a Chore
                    </Button>
                  </>
                )}
                
                {/* Not logged in mobile: Browse only */}
                {!session && (
                  <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); router.push('/chores'); }}>
                    Browse Chores
                  </Button>
                )}
                {session ? (
                  <>
                    <Link
                      href="/notifications"
                      className="flex items-center w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      <span className="ml-2">Notifications</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon />
                      <span className="ml-2 truncate">
                        {session.user?.name ?? session.user?.email}
                      </span>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/' })}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => signIn()}>
                    Log in
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

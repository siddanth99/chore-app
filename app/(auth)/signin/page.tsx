/**
 * Sign In Page - UI Only (Now supports phone sign-in + OTP)
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Zap, 
  MapPin, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme/ThemeToggle';

// Feature badges for hero section
const FEATURE_BADGES = [
  { icon: CheckCircle2, text: 'Verified workers', color: 'from-emerald-500 to-teal-500' },
  { icon: Zap, text: 'Fast booking', color: 'from-amber-500 to-orange-500' },
  { icon: MapPin, text: 'Location-based', color: 'from-primary to-accent' },
];

// Category chips
const CATEGORIES = ['Cleaning', 'Delivery', 'Moving', 'Pet Care', 'Gardening', 'Handyman'];

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [signInMethod, setSignInMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // ---------------------------
  // EMAIL SIGN-IN
  // ---------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      router.push(result?.url || callbackUrl);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // ---------------------------
  // PHONE SIGN-IN (OTP)
  // ---------------------------
  const handlePhoneSignIn = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    setError(null);
    setPhoneLoading(true);

    try {
      const response = await fetch('/api/auth/signin-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP');
        setPhoneLoading(false);
        return;
      }

      // Redirect to OTP verify page
      router.push(`/otp-verify?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      console.error('Phone signin error:', err);
      setError('An error occurred. Please try again.');
    }

    setPhoneLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Hero Panel */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden"
      >
        {/* Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-3xl"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-8 py-12 lg:px-16">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ChoreApp</span>
            </Link>
          </motion.div>

          {/* Hero Text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              Get things done, <span className="gradient-text">effortlessly</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Connect with skilled workers or find flexible work. Simple, fast, reliable.
            </p>
          </motion.div>

          {/* Badges */}
          <motion.div className="flex flex-wrap gap-3 mt-8">
            {FEATURE_BADGES.map((badge, index) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm"
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${badge.color} flex items-center justify-center`}>
                  <badge.icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="absolute top-4 right-4 lg:hidden">
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">

        <div className="absolute top-6 right-6 hidden lg:block">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 lg:p-10">

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to continue</p>

              {/* Toggle Email / Phone */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  className={`px-4 py-2 rounded-lg text-sm ${
                    signInMethod === 'email'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                  onClick={() => setSignInMethod('email')}
                >
                  Email
                </button>

                <button
                  className={`px-4 py-2 rounded-lg text-sm ${
                    signInMethod === 'phone'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                  onClick={() => setSignInMethod('phone')}
                >
                  Phone
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* MAIN CONDITIONAL */}
            {signInMethod === 'email' ? (
              // --------------------
              // EMAIL SIGN-IN FORM
              // --------------------
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 rounded-xl bg-secondary/50 border border-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 rounded-xl bg-primary text-primary-foreground"
                >
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            ) : (
              // --------------------
              // PHONE SIGN-IN FORM
              // --------------------
              <div className="space-y-5">

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-input"
                  />
                </div>

                <Button
                  type="button"
                  disabled={phoneLoading || !phone}
                  onClick={handlePhoneSignIn}
                  className="w-full py-6 rounded-xl bg-primary text-primary-foreground"
                >
                  {phoneLoading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </div>
            )}

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
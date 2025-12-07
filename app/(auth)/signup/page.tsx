/**
 * Sign Up Page - UI Only
 * Beautiful, animated sign-up form with mobile number field.
 * 
 * No backend logic - all handlers are dummy console.logs.
 * Ready to hook up with real auth later.
 */

'use client';

import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  Phone,
  CheckCircle2, 
  Zap, 
  MapPin, 
  Sparkles,
  ArrowRight,
  Briefcase,
  Home,
  ChevronDown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme/ThemeToggle';

// Feature badges for hero section
const FEATURE_BADGES = [
  { icon: CheckCircle2, text: 'Verified workers', color: 'from-emerald-500 to-teal-500' },
  { icon: Zap, text: 'Fast booking', color: 'from-amber-500 to-orange-500' },
  { icon: MapPin, text: 'Location-based', color: 'from-primary to-accent' },
];

// Country codes for phone
const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
];

// User type options
const USER_TYPES = [
  { id: 'customer', label: 'Post chores', icon: Home, description: 'I need help with tasks' },
  { id: 'worker', label: 'Find work', icon: Briefcase, description: 'I want to earn money' },
];

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'worker'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Prepare phone number with country code
      const fullPhone = formData.phone ? `${countryCode.code}${formData.phone}` : null;

      // Call signup-request endpoint
      const response = await fetch('/api/auth/signup-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: fullPhone,
          role: userType.toUpperCase(), // Convert 'customer'/'worker' to 'CUSTOMER'/'WORKER'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // If phone provided, redirect to OTP verification
      if (fullPhone && data.tempId) {
        router.push(`/otp-verify?tempId=${data.tempId}&phone=${encodeURIComponent(fullPhone)}`);
        return;
      }

      // No phone - user created immediately, sign them in
      if (data.created && data.userId) {
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        
        const signInResult = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
          callbackUrl,
        });

        if (signInResult?.error) {
          setError('Account created but sign in failed. Please try signing in manually.');
          setIsLoading(false);
          return;
        }

        // Success - redirect to dashboard or callback URL
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError('Unexpected response from server');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = (provider: string) => {
    // TODO: Replace with actual OAuth logic
    console.log(`Sign up with ${provider}`);
  };

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Hero Panel - Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden"
      >
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"
          />
          <motion.div
            animate={{ 
              x: [0, -20, 0],
              y: [0, 30, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full bg-highlight/10 blur-2xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-8 py-12 lg:px-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ChoreApp</span>
            </Link>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
              Join the{' '}
              <span className="gradient-text">community</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Whether you need help with chores or want to earn money doing them – 
              we've got you covered.
            </p>
          </motion.div>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-3 mb-8"
          >
            {FEATURE_BADGES.map((badge, index) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm"
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${badge.color} flex items-center justify-center`}>
                  <badge.icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="hidden lg:grid grid-cols-3 gap-6"
          >
            {[
              { value: '10K+', label: 'Active users' },
              { value: '50K+', label: 'Chores completed' },
              { value: '4.9★', label: 'Average rating' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Theme Toggle - Mobile */}
        <div className="absolute top-4 right-4 lg:hidden">
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Form Panel - Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 overflow-y-auto">
        {/* Theme Toggle - Desktop */}
        <div className="absolute top-6 right-6 hidden lg:block">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Form Card */}
          <div className="glass-card p-6 lg:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 lg:hidden"
              >
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Create your account</h2>
              <p className="text-muted-foreground text-sm">
                Join the chore marketplace – post tasks or find work near you
              </p>
            </div>

            {/* User Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                {USER_TYPES.map((type) => (
                  <motion.button
                    key={type.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserType(type.id as 'customer' | 'worker')}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      userType === type.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-secondary/30 hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        userType === type.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                    {userType === type.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    aria-label="Full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    aria-label="Email address"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Mobile number
                </label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center gap-1 px-3 py-3 rounded-xl bg-secondary/50 border border-input text-foreground hover:bg-secondary transition-all min-w-[90px]"
                      aria-label="Select country code"
                    >
                      <span>{countryCode.flag}</span>
                      <span className="text-sm font-medium">{countryCode.code}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {showCountryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 top-full left-0 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                        >
                          {COUNTRY_CODES.map((cc) => (
                            <button
                              key={cc.code}
                              type="button"
                              onClick={() => {
                                setCountryCode(cc);
                                setShowCountryDropdown(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary transition-colors ${
                                countryCode.code === cc.code ? 'bg-primary/10' : ''
                              }`}
                            >
                              <span>{cc.flag}</span>
                              <span className="text-sm">{cc.code}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Phone Input */}
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      aria-label="Phone number"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  We'll use this for important updates only
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-secondary/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-11 pr-12 py-3 rounded-xl bg-secondary/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                      formData.confirmPassword && !passwordsMatch
                        ? 'border-destructive'
                        : passwordsMatch
                        ? 'border-emerald-500'
                        : 'border-input'
                    }`}
                    aria-label="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive mt-1.5"
                  >
                    Passwords don't match
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || !passwordsMatch}
                  className="w-full py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSocialSignUp('Google')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Google</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSocialSignUp('GitHub')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="font-medium">GitHub</span>
              </motion.button>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/signin" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              By creating an account, you agree to our{' '}
              <button className="text-primary hover:underline">Terms of Service</button>{' '}
              and{' '}
              <button className="text-primary hover:underline">Privacy Policy</button>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpPageContent />
    </Suspense>
  );
}

/**
 * Auth Flow Pages - UI Only
 * 
 * Contains:
 * - ForgotPasswordPage
 * - OtpVerificationPage
 * - ResetPasswordPage
 * - ResetPasswordSuccessPage
 * 
 * No backend logic - all handlers are dummy console.logs.
 * Ready to hook up with real auth later.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Zap, 
  MapPin, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  PartyPopper,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme/ThemeToggle';

// Feature badges for hero section
const FEATURE_BADGES = [
  { icon: CheckCircle2, text: 'Verified workers', color: 'from-emerald-500 to-teal-500' },
  { icon: Zap, text: 'Fast booking', color: 'from-amber-500 to-orange-500' },
  { icon: MapPin, text: 'Location-based', color: 'from-primary to-accent' },
];

// Shared Hero Panel Component
function HeroPanel({ 
  title, 
  subtitle, 
  icon: Icon = ShieldCheck 
}: { 
  title: string; 
  subtitle: string; 
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
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
          className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-highlight/10 blur-2xl"
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

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            {subtitle}
          </p>
        </motion.div>

        {/* Feature Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3"
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
      </div>

      {/* Theme Toggle - Mobile */}
      <div className="absolute top-4 right-4 lg:hidden">
        <ThemeToggle />
      </div>
    </motion.div>
  );
}

// Shared Auth Layout
function AuthLayout({ 
  children, 
  heroTitle, 
  heroSubtitle,
  heroIcon
}: { 
  children: React.ReactNode;
  heroTitle: string;
  heroSubtitle: string;
  heroIcon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <HeroPanel title={heroTitle} subtitle={heroSubtitle} icon={heroIcon} />
      
      {/* Form Panel - Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
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
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// 1. FORGOT PASSWORD PAGE
// ============================================
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Replace with actual API call
    console.log('Forgot password submitted:', { email });
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <AuthLayout
      heroTitle="Forgot your password?"
      heroSubtitle="No worries! We'll help you get back into your account quickly and securely."
      heroIcon={KeyRound}
    >
      <div className="glass-card p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 border border-primary/20"
          >
            <KeyRound className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Reset your password</h2>
          <p className="text-muted-foreground text-sm">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-foreground mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                aria-label="Email address"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              We'll never share your contact details with anyone.
            </p>
          </div>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={isLoading}
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
                  Send reset link
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Back to Sign In */}
        <div className="mt-8 text-center">
          <Link 
            href="/signin" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

// ============================================
// 2. OTP VERIFICATION PAGE
// ============================================
export function OtpVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6 && /\d/.test(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Replace with actual API call
    console.log('OTP submitted:', otp.join(''));
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleResend = () => {
    // TODO: Replace with actual resend logic
    console.log('Resend OTP clicked');
  };

  return (
    <AuthLayout
      heroTitle="Verify your identity"
      heroSubtitle="We've sent a verification code to help keep your account secure."
      heroIcon={ShieldCheck}
    >
      <div className="glass-card p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 border border-primary/20"
          >
            <ShieldCheck className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Enter verification code</h2>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to your email/phone
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl bg-secondary/50 border-2 border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={isLoading || otp.some(d => !d)}
              className="w-full py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                <>
                  Verify
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Didn't receive a code?
          </p>
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Resend code
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Resend available in 00:30
          </p>
        </div>

        {/* Back to Sign In */}
        <div className="mt-6 text-center">
          <Link 
            href="/signin" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

// ============================================
// 3. RESET PASSWORD PAGE
// ============================================
export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simple password strength calculation (UI only)
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { level: 0, label: '', color: '' };
    if (pwd.length < 6) return { level: 1, label: 'Weak', color: 'bg-destructive' };
    if (pwd.length < 10) return { level: 2, label: 'Medium', color: 'bg-amber-500' };
    return { level: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Replace with actual API call
    console.log('Reset password submitted:', { password, confirmPassword });
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <AuthLayout
      heroTitle="Set a new password"
      heroSubtitle="Create a strong password to keep your account secure. You're almost done!"
      heroIcon={Lock}
    >
      <div className="glass-card p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 border border-primary/20"
          >
            <Lock className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Create new password</h2>
          <p className="text-muted-foreground text-sm">
            Your new password must be different from previous ones
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-2">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-11 pr-12 py-3 rounded-xl bg-secondary/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                aria-label="New password"
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
            
            {/* Password Strength Bar */}
            {password && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        level <= strength.level ? strength.color : 'bg-secondary'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength.level === 1 ? 'text-destructive' : 
                  strength.level === 2 ? 'text-amber-500' : 
                  strength.level === 3 ? 'text-emerald-500' : 'text-muted-foreground'
                }`}>
                  {strength.label}
                </p>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-2">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-11 pr-12 py-3 rounded-xl bg-secondary/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                  confirmPassword && (passwordsMatch ? 'border-emerald-500' : 'border-destructive')
                } ${!confirmPassword && 'border-input'}`}
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
            {confirmPassword && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-xs mt-1.5 ${passwordsMatch ? 'text-emerald-500' : 'text-destructive'}`}
              >
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </motion.p>
            )}
          </div>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={isLoading || !passwordsMatch}
              className="w-full py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                <>
                  Update password
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Back to Sign In */}
        <div className="mt-8 text-center">
          <Link 
            href="/signin" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

// ============================================
// 4. RESET PASSWORD SUCCESS PAGE
// ============================================
export function ResetPasswordSuccessPage() {
  return (
    <AuthLayout
      heroTitle="You're all set!"
      heroSubtitle="Your account is secure again. Time to get back to getting things done."
      heroIcon={PartyPopper}
    >
      <div className="glass-card p-8 lg:p-10 text-center relative overflow-hidden">
        {/* Celebratory glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/20"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: '100%',
                opacity: 0 
              }}
              animate={{ 
                y: '-20%',
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut'
              }}
              style={{ left: `${15 + i * 15}%` }}
            />
          ))}
        </div>

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
          className="relative z-10 mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          
          {/* Ripple effect */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 w-20 h-20 rounded-full border-2 border-emerald-500 mx-auto"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10"
        >
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Password reset successful!
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative z-10"
        >
          <Link href="/signin">
            <Button
              className="w-full py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            >
              Go to Sign In
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Additional link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 text-sm text-muted-foreground mt-6"
        >
          Need help?{' '}
          <button className="text-primary hover:text-primary/80 transition-colors">
            Contact support
          </button>
        </motion.p>
      </div>
    </AuthLayout>
  );
}

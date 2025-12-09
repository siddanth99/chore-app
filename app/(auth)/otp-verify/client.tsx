'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { 
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme/ThemeToggle';

type Props = {
  tempId: string | null;
  phoneFromQuery: string | null;
  callbackUrl: string | null;
};

export default function ClientOtpVerify({ tempId, phoneFromQuery, callbackUrl }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState<string>(phoneFromQuery ?? '');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignupFlow, setIsSignupFlow] = useState<boolean>(!!tempId);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (phoneFromQuery) setPhone(phoneFromQuery);
    setIsSignupFlow(!!tempId);
  }, [phoneFromQuery, tempId]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
    pastedData.forEach((char, i) => { if (i < 6 && /\d/.test(char)) newOtp[i] = char; });
    setOtp(newOtp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a 6-digit code');
      setIsLoading(false);
      return;
    }
    if (!phone) {
      setError('Phone number is required');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignupFlow && tempId) {
        const response = await fetch('/api/auth/signup-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempId, phone, otp: otpString }),
        });
        const data = await response.json();
        if (!response.ok) { setError(data.error || 'Verification failed'); setIsLoading(false); return; }
        const email = data.email || '';
        router.push(`/signin?signup=success${email ? `&email=${encodeURIComponent(email)}` : ''}`);
      } else {
        const verifyResponse = await fetch('/api/auth/signin-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp: otpString }),
        });
        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok) { setError(verifyData.error || 'Verification failed'); setIsLoading(false); return; }
        const signInResult = await signIn('credentials', { redirect: false, phone, otp: otpString });
        if (signInResult?.error) { setError('Sign in failed. Please try again.'); setIsLoading(false); return; }
        router.push(callbackUrl ?? '/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) { setError('Phone number is required'); return; }
    setIsLoading(true); setError(null);

    try {
      if (isSignupFlow) {
        setError('Please go back and restart signup to resend OTP');
        setIsLoading(false);
        return;
      }
      const response = await fetch('/api/auth/signin-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to resend OTP'); setIsLoading(false); return; }
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <ShieldCheck className="w-8 h-8 text-primary" />
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
              {isSignupFlow ? 'Verify your phone' : 'Sign in with OTP'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              {isSignupFlow 
                ? "We've sent a verification code to complete your signup."
                : "Enter the code sent to your phone to sign in."}
            </p>
          </motion.div>
        </div>

        {/* Theme Toggle - Mobile */}
        <div className="absolute top-4 right-4 lg:hidden">
          <ThemeToggle />
        </div>
      </motion.div>

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
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Enter verification code
              </h2>
              <p className="text-muted-foreground text-sm">
                {phone && `Code sent to ${phone}`}
              </p>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone (readonly if provided) */}
              {!phone && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* OTP Inputs */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Verification code
                </label>
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
                      {isSignupFlow ? 'Complete Signup' : 'Sign In'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Resend */}
            {!isSignupFlow && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive a code?
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend code
                </button>
              </div>
            )}

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
        </motion.div>
      </div>
    </div>
  );
}


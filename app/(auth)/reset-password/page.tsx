'use client';
import { Suspense } from 'react';
import { ResetPasswordPage } from '@/components/auth/AuthFlowPages';

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

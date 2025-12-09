// app/(auth)/otp-verify/page.tsx
// Server component: reads searchParams and passes into client component
import { Suspense } from 'react';
import ClientOtpVerify from './client';

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function Page({ searchParams }: Props) {
  // Pull values from searchParams on the server
  const tempId = Array.isArray(searchParams?.tempId) ? searchParams?.tempId[0] : searchParams?.tempId;
  const phone = Array.isArray(searchParams?.phone) ? searchParams?.phone[0] : searchParams?.phone;
  const callbackUrl = Array.isArray(searchParams?.callbackUrl) ? searchParams?.callbackUrl[0] : searchParams?.callbackUrl;

  return (
    <Suspense fallback={null}>
      <ClientOtpVerify
        tempId={tempId ?? null}
        phoneFromQuery={phone ?? null}
        callbackUrl={callbackUrl ?? null}
      />
    </Suspense>
  );
}

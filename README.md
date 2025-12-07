This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## SMS OTP Verification via Pabbly

This project includes SMS OTP verification for phone numbers during signup. The OTP system uses argon2 for secure hashing and integrates with Pabbly for SMS delivery.

### Required Environment Variables

Add these to your `.env` or `.env.local` file:

```bash
# Pabbly SMS Configuration (Pabbly Connect Webhook)
PABBLY_SMS_ENDPOINT=https://connect.pabbly.com/workflow/sendwebhook/...  # Your Pabbly Connect webhook URL
# Note: Pabbly Connect webhooks do not require PABBLY_API_KEY - authentication is via the webhook URL

# OTP Configuration (optional - defaults shown)
OTP_EXPIRY_MINUTES=5          # OTP expires after 5 minutes (default)
OTP_MAX_ATTEMPTS=5            # Maximum verification attempts (default)
OTP_RESEND_COOLDOWN_SECONDS=60 # Cooldown between OTP requests (default)
```

### Database Migration

After adding the `PhoneVerification` model to your Prisma schema, run:

```bash
# Create and apply migration
npx prisma migrate dev --name add-phone-verification

# Generate Prisma Client
npx prisma generate
```

**Note for CI/CD:** Ensure `npx prisma generate` runs in your build pipeline (already included in `postinstall` script).

### Local Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Request an OTP:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919876543210"}'
   ```
   
   Expected response:
   ```json
   {
     "ok": true,
     "expiresAt": "2024-01-01T12:05:00.000Z",
     "resendCooldownSeconds": 60
   }
   ```
   
   **Note:** The OTP is NOT returned in the API response. Check your Pabbly dashboard, server logs (in dev mode), or SMS inbox for the code.

3. **Verify the OTP:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919876543210", "otp": "123456"}'
   ```
   
   Success response:
   ```json
   {
     "verified": true
   }
   ```

4. **Complete signup:**
   After phone verification, the signup endpoint will accept the phone number:
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com",
       "password": "securepassword123",
       "phone": "+919876543210",
       "role": "CUSTOMER"
     }'
   ```

### Pabbly Integration Notes

**Pabbly Connect Webhook:** The implementation uses Pabbly Connect webhooks, which do not require an API key. Simply set `PABBLY_SMS_ENDPOINT` to your Pabbly Connect webhook URL.

**Important:** The provided code uses a generic JSON payload `{ to, message }`. You must adapt it to match your specific Pabbly Connect webhook format:

1. **Check your Pabbly Connect webhook** for the exact field names it expects (e.g., `phone` instead of `to`, `text` instead of `message`)
2. **Update the payload object** in `app/api/auth/request-otp/route.ts` to match your Pabbly Connect flow configuration
3. **No API key needed:** Pabbly Connect webhooks authenticate via the webhook URL itself - no `PABBLY_API_KEY` is required
4. **For form-data or urlencoded:** If your Pabbly Connect webhook expects form data, replace the JSON body with `FormData` or URL-encoded format

Example for form-data:
```typescript
const formData = new FormData()
formData.append('phone', phone)
formData.append('message', `Your code is ${otp}`)
// ... add other required fields

const smsResponse = await fetch(PABBLY_SMS_ENDPOINT, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PABBLY_API_KEY}`,
  },
  body: formData,
})
```

### Production Considerations

- **DLT/Sender ID (India):** Ensure you have DLT registration and sender ID configured with your SMS provider. This is provider-specific and required for Indian phone numbers.
- **OTP Logging:** Remove any OTP logging in production. The current code only logs OTPs in development mode.
- **Rate Limiting:** OTP requests are rate-limited to 5 per hour per phone. Verification attempts are limited to 20 per hour.
- **Security:** OTPs are hashed using argon2 before storage. Plain OTPs are never stored or returned in API responses.

### Testing

Test skeletons are available in `__tests__/auth.otp.test.ts`. To run tests:

```bash
# Install test dependencies (if not already installed)
npm install --save-dev jest @jest/globals

# Run tests
npm test
```

**Note:** You'll need to:
- Set up a test database or mock Prisma
- Mock Pabbly SMS sending (don't send real SMS in tests)
- Configure test environment variables

### API Endpoints

- `POST /api/auth/request-otp` - Request an OTP for a phone number
- `POST /api/auth/verify-otp` - Verify an OTP code
- `POST /api/auth/signup` - Create account (requires phone verification if phone provided)

### Rate Limits

- **OTP Request:** 5 requests per hour per phone number
- **OTP Verification:** 20 attempts per hour per phone number

### OTP Configuration

- **Length:** 6 digits (configurable in `lib/otp.ts`)
- **Expiry:** 5 minutes (configurable via `OTP_EXPIRY_MINUTES` env var)
- **Max Attempts:** 5 attempts before requiring a new OTP
- **Resend Cooldown:** 60 seconds between requests (enforced by rate limiter)

---

## Signup + OTP and Phone Sign-In Flows

This project supports two authentication flows:

### 1. Signup with Optional Phone Verification

**Flow:**
1. User submits signup form with `name`, `email`, `password`, and optional `phone`
2. If `phone` is provided:
   - `POST /api/auth/signup-request` creates a `SignupTemp` record
   - OTP is generated and sent via Pabbly SMS
   - User is redirected to `/otp-verify?tempId=<id>&phone=<phone>`
3. User enters OTP on verification page
4. `POST /api/auth/signup-verify` validates OTP and creates the `User` from `SignupTemp`
5. User is signed in automatically

**If `phone` is NOT provided:**
- User is created immediately
- User is signed in automatically

### 2. Phone-Based Sign-In

**Flow:**
1. User selects "Phone" tab on sign-in page
2. User enters phone number and clicks "Send Verification Code"
3. `POST /api/auth/signin-request` sends OTP to existing user's phone
4. User is redirected to `/otp-verify?phone=<phone>`
5. User enters OTP
6. `POST /api/auth/signin-verify` validates OTP
7. Frontend calls `signIn('credentials', { phone, otp })` to create NextAuth session

### API Endpoints

- `POST /api/auth/signup-request` - Initiate signup (with or without phone)
- `POST /api/auth/signup-verify` - Verify OTP and finalize signup
- `POST /api/auth/signin-request` - Request OTP for phone sign-in
- `POST /api/auth/signin-verify` - Verify OTP for sign-in

### NextAuth Integration

The NextAuth credentials provider supports both:
- **Email + Password:** Traditional authentication
- **Phone + OTP:** OTP-based authentication

Both methods use the same `signIn('credentials', ...)` function with different credential fields.

### Database Models

**SignupTemp:**
- Stores pending signup attempts when phone verification is required
- Contains hashed password, name, email, phone
- Automatically deleted after successful verification
- Expires after 5 minutes (configurable)

**PhoneVerification:**
- Stores OTP hashes and verification status
- Links to `SignupTemp` via metadata for signup flow
- Links to `User` via metadata for signin flow
- Tracks attempts and expiry

### Frontend Pages

- `/signup` - Signup form (redirects to OTP verify if phone provided)
- `/signin` - Sign-in form with email/password and phone tabs
- `/otp-verify` - OTP verification page (handles both signup and signin flows)

### Environment Variables

All OTP-related environment variables from the previous section apply, plus:

```bash
# Optional: App name for SMS messages
NEXT_PUBLIC_APP_NAME=ChoreApp
```

### Testing

Test skeletons are available in:
- `__tests__/auth.signup-otp.test.ts` - Signup and signin OTP flows
- `__tests__/auth.otp.test.ts` - Basic OTP utilities

To run tests:
```bash
npm test
```

**Note:** You'll need to:
- Set up a test database or mock Prisma
- Mock Pabbly SMS sending (don't send real SMS in tests)
- Configure test environment variables

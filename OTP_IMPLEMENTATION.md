# SMS OTP Verification Implementation Summary

## ✅ Files Created/Modified

### 1. Database Schema
- **File:** `prisma/schema.prisma`
- **Change:** Added `PhoneVerification` model
- **Action Required:** Run migration and generate Prisma Client:
  ```bash
  npx prisma migrate dev --name add-phone-verification
  npx prisma generate
  ```

### 2. Validation Schemas
- **File:** `lib/validation/otp.schema.ts` (NEW)
- **Exports:** `requestOtpSchema`, `verifyOtpSchema`
- **Also Updated:** `lib/validation/index.ts` to export OTP schemas

### 3. OTP Utilities
- **File:** `lib/otp.ts` (NEW)
- **Functions:**
  - `generateOtp(digits = 6)` - Generate random numeric OTP
  - `hashOtp(otp)` - Hash OTP with argon2
  - `verifyOtpHash(hash, plain)` - Verify OTP against hash
- **Config:** `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS`

### 4. Rate Limiting
- **File:** `lib/rate-limit.ts` (MODIFIED)
- **Added:**
  - `otpRequestLimiter` - 5 requests per hour
  - `otpVerifyLimiter` - 20 attempts per hour

### 5. API Endpoints
- **File:** `app/api/auth/request-otp/route.ts` (NEW)
  - POST endpoint to request OTP
  - Generates OTP, hashes it, sends via Pabbly
  - Returns `{ ok: true, expiresAt }`
  
- **File:** `app/api/auth/verify-otp/route.ts` (NEW)
  - POST endpoint to verify OTP
  - Validates OTP, checks expiry/attempts
  - Returns `{ verified: true }` on success

### 6. Signup Integration
- **File:** `app/api/auth/signup/route.ts` (MODIFIED)
- **Change:** Added phone verification check before user creation
- **Behavior:** Signup fails if phone provided but not verified

### 7. Tests
- **File:** `__tests__/auth.otp.test.ts` (NEW)
- **Status:** Test skeletons provided (needs implementation)

### 8. Documentation
- **File:** `README.md` (MODIFIED)
- **Added:** Complete OTP section with setup, testing, and API docs

## 🔧 Setup Steps

### 1. Install Dependencies
```bash
npm install argon2
```

### 2. Database Migration
```bash
npx prisma migrate dev --name add-phone-verification
npx prisma generate
```

### 3. Environment Variables
Add to `.env.local`:
```bash
PABBLY_SMS_ENDPOINT=https://your-pabbly-webhook-url
PABBLY_API_KEY=your_pabbly_api_key

# Optional (defaults shown)
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
```

### 4. Configure Pabbly Integration
**Important:** Update the fetch payload in `app/api/auth/request-otp/route.ts` to match your Pabbly webhook format.

Current generic format:
```typescript
{
  phone: "+919876543210",
  message: "Your verification code is 123456. It expires in 5 minutes."
}
```

**You must:**
1. Check your Pabbly documentation for exact field names
2. Update the JSON body structure if needed
3. Change to FormData if your webhook expects form data
4. Add any required fields (senderId, templateId, etc.)

## 📋 API Usage

### Request OTP
```bash
POST /api/auth/request-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}

Response:
{
  "ok": true,
  "expiresAt": "2024-01-01T12:05:00.000Z",
  "resendCooldownSeconds": 60
}
```

### Verify OTP
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}

Response (success):
{
  "verified": true
}

Response (error):
{
  "error": "Invalid OTP",
  "remainingAttempts": 4
}
```

### Signup (with verified phone)
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+919876543210",  // Must be verified first
  "role": "CUSTOMER"
}
```

## ⚠️ Important Notes

1. **Prisma Client Regeneration:** After adding the model, TypeScript will show errors until you run `npx prisma generate`. This is expected.

2. **Pabbly Configuration:** The provided code uses a generic JSON payload. You MUST update it to match your specific Pabbly webhook/API format.

3. **Production (India):** Ensure DLT registration and sender ID are configured with your SMS provider.

4. **Security:** 
   - OTPs are never returned in API responses
   - OTPs are hashed with argon2 before storage
   - Rate limiting prevents abuse
   - Max attempts prevent brute force

5. **Development:** OTPs are logged to console in dev mode only. Remove logging before production.

## 🧪 Testing

Test skeletons are in `__tests__/auth.otp.test.ts`. To implement:
1. Set up test database or mock Prisma
2. Mock Pabbly SMS sending
3. Configure test environment variables

## 📝 Next Steps

1. Run `npx prisma migrate dev --name add-phone-verification`
2. Run `npx prisma generate`
3. Configure Pabbly webhook payload format
4. Test OTP flow locally
5. Implement test cases
6. Deploy and configure production SMS provider


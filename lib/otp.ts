import argon2 from "argon2";

/**
 * Generate a random numeric OTP
 * @param digits - Number of digits (default: 6)
 * @returns OTP as string
 */
export function generateOtp(digits = 6): string {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}

/**
 * Hash an OTP using argon2
 * @param otp - Plain text OTP
 * @returns Hashed OTP
 */
export async function hashOtp(otp: string): Promise<string> {
  return await argon2.hash(otp, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify an OTP against its hash
 * @param hash - Hashed OTP from database
 * @param plain - Plain text OTP from user
 * @returns true if OTP matches, false otherwise
 */
export async function verifyOtpHash(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * OTP Configuration
 * Can be overridden via environment variables
 */
export const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);
export const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);
export const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || "60", 10);


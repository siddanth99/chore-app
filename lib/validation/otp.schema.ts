import { z } from "zod";

/**
 * Schema for requesting an OTP
 * Phone should be in E.164 format (e.g., +919876543210)
 */
export const requestOtpSchema = z.object({
  phone: z.string().min(6, "Phone number must be at least 6 characters"), // ensure at least minimal length; UI should pass E.164
});

/**
 * Schema for verifying an OTP
 */
export const verifyOtpSchema = z.object({
  phone: z.string().min(6, "Phone number must be at least 6 characters"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

/**
 * Schema for signup request
 */
export const signupRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'WORKER']).optional(),
});

/**
 * Schema for signup verification
 */
export const signupVerifySchema = z.object({
  tempId: z.string().min(1, "Temp ID is required"),
  phone: z.string().min(6, "Phone number is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

/**
 * Schema for signin request (phone OTP)
 */
export const signinRequestSchema = z.object({
  phone: z.string().min(6, "Phone number must be at least 6 characters"),
});

/**
 * Schema for signin verification
 */
export const signinVerifySchema = z.object({
  phone: z.string().min(6, "Phone number is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});


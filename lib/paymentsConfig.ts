/**
 * Razorpay Route Configuration
 * 
 * Controls whether Route API calls are made or mocked.
 * 
 * Environment variable:
 * - RAZORPAY_ROUTE_MODE=mock  (development - no real Route calls)
 * - RAZORPAY_ROUTE_MODE=live  (production - real Route API calls)
 * 
 * Defaults to "mock" if not set, for safety during development.
 */

export function isRouteMockEnabled(): boolean {
  return process.env.RAZORPAY_ROUTE_MODE === 'mock' || !process.env.RAZORPAY_ROUTE_MODE
}

export function isRouteLiveEnabled(): boolean {
  return process.env.RAZORPAY_ROUTE_MODE === 'live'
}


import NextAuth from 'next-auth'
import { authOptions } from '@/server/auth/config'

// Add error handling wrapper to catch and log NextAuth errors
const handler = async (req: Request, context: { params: Promise<{ nextauth: string[] }> }) => {
  try {
    // Await the params to get the nextauth segments
    const params = await context.params
    
    // Create the NextAuth handler
    const nextAuthHandler = NextAuth(authOptions)
    
    // Call the handler
    return nextAuthHandler(req, { params: { nextauth: params.nextauth } })
  } catch (error) {
    console.error('[NextAuth] Error in auth handler:', error)
    
    // Return a proper JSON error response instead of HTML
    return new Response(
      JSON.stringify({ 
        error: 'AuthError',
        message: error instanceof Error ? error.message : 'Internal authentication error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export { handler as GET, handler as POST }

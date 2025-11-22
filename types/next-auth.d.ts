import { $Enums } from '@prisma/client'
import 'next-auth'

type UserRole = $Enums.UserRole

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: UserRole
    }
  }

  interface User {
    id: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { hash } from 'bcryptjs'
import { $Enums } from '@prisma/client'

type UserRole = $Enums.UserRole

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, role } = body

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Role defaults to CUSTOMER if not provided or invalid
    const userRole = role && (role === 'CUSTOMER' || role === 'WORKER') 
      ? (role as UserRole)
      : 'CUSTOMER'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user with phone field
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phone: phone || null, // Phone is optional
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    })

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


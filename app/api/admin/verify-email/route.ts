import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'business.r2k2@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Manually verify the email by updating the auth.users table
    // This requires admin privileges
    const { data, error } = await supabase.rpc('verify_user_email', { 
      user_email: email 
    })

    if (error) {
      console.error('Error verifying email:', error)
      return NextResponse.json(
        { error: 'Failed to verify email. You may need to do this in the Supabase dashboard.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Email ${email} has been verified successfully` 
    })
  } catch (error) {
    console.error('Admin verify email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

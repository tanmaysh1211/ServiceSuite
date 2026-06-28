import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export function createSupabaseServerClient() {
  return createServerComponentClient(
    { cookies },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      cookieOptions: {
        name: 'sb-auth-token',
        domain: undefined, // Set to your domain if needed
        path: '/',
        sameSite: 'lax',
        secure: true,
      }
    }
  );
} 
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-gaurd"
import { ModeToggle } from "@/components/theme-toggle"

function SignInContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
    } else {
      router.push("/dashboard")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-950 dark:from-background dark:to-muted p-4">
      <div className="mb-6 flex flex-col items-center">
        {/* Brand/Logo */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-2 shadow-lg">
          <span className="text-white text-2xl font-extrabold tracking-tight">S</span>
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">ServiceSuite</span>
      </div>
      <Card className="w-full max-w-md rounded-2xl shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-primary mb-1">Welcome Back</CardTitle>
          <CardDescription className="text-base">Sign in to your ServiceSuite account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-base font-medium">Email</Label>
              <Input id="email" name="email" type="email" required className="mt-1 h-12 text-base px-4" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password" className="text-base font-medium">Password</Label>
              <Input id="password" name="password" type="password" required className="mt-1 h-12 text-base px-4" autoComplete="current-password" />
            </div>
            {error && (
              <Alert variant="destructive" className="text-base">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
            </p>
          </div>
        </CardContent>
        <div className="flex justify-center py-4 border-t border-gray-100 dark:border-gray-800">
          <ModeToggle />
        </div>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <AuthGuard requireAuth={false}>
      <SignInContent />
    </AuthGuard>
  )
}

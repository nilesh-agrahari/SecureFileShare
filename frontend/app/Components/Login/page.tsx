"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, LogIn } from "lucide-react"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "", // Django ObtainAuthToken expects 'username' field
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("http://localhost:8000/users/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user data
        localStorage.setItem("token", data.token)
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: data.email,
            role: data.role,
          }),
        )

        // Redirect based on role
        if (data.role === "OPS_USER") {
          router.push("/Components/Home/Ops-Home")
        } else {
          router.push("/Components/Home/Client-Home")
        }
      } else {
        // Handle different error cases
        if (response.status === 403) {
          setError(data.message || "Email not verified. Please verify your email first.")
        } else if (response.status === 400) {
          setError("Invalid email or password")
        } else {
          setError(data.message || "Login failed")
        }
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader className="text-center pb-8">
          <LogIn className="h-8 w-8 mx-auto mb-4 text-gray-600" />
          <CardTitle className="text-xl font-medium">Welcome Back</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className="pl-10 border-gray-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10 border-gray-200"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center space-y-2 mt-4">
              <p className="text-sm text-gray-600">
                {"Don't have an account? "}
                <Link href="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline block">
                Forgot password?
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

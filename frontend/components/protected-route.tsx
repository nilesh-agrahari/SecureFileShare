"use client"

import type React from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes?: ("OPS_USER" | "CLIENT_USER")[]
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If no user is logged in, redirect to login
      if (!user) {
        router.push("/login")
        return
      }

      // If specific user types are required, check if user has permission
      if (allowedUserTypes && !allowedUserTypes.includes(user.role)) {
        // Redirect based on user role if they don't have permission
        if (user.role === "OPS_USER") {
          router.push("/Components/Home/Ops-Home")
        } else {
          router.push("/Components/Home/Client-Home")
        }
        return
      }
    }
  }, [user, loading, router, allowedUserTypes])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If no user, don't render anything (redirect will happen)
  if (!user) {
    return null
  }

  // If user doesn't have permission, don't render anything (redirect will happen)
  if (allowedUserTypes && !allowedUserTypes.includes(user.role)) {
    return null
  }

  // User is authenticated and has permission, render children
  return <>{children}</>
}

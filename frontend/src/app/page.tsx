"use client"

import { useState } from "react"
import { setMockSession } from "@/lib/auth"

export default function Home() {
  const [signedIn, setSignedIn] = useState(false)
  const [userName, setUserName] = useState("")

  const handleSignIn = async () => {
    await setMockSession()
    setUserName("Test User")
    setSignedIn(true)
  }

  const handleSignOut = async () => {
    const { clearMockSession } = await import("@/lib/auth")
    await clearMockSession()
    setUserName("")
    setSignedIn(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Content Pipeline</h1>
          {signedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{userName}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-blue-600 hover:underline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
            >
              Sign in
            </button>
          )}
        </div>

        {signedIn ? (
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              Welcome to Content Pipeline!
            </p>
            <a
              href="/dashboard"
              className="inline-block rounded bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-gray-600">
              Sign in to manage your social media content with AI
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
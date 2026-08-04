import { ClerkProvider, SignInButton, UserButton } from "@clerk/nextjs"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Content Pipeline</h1>
          <SignInButton />
          <UserButton />
        </div>
      </div>
    </main>
  )
}
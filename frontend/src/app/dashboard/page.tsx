import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Welcome, {session.userName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/generate"
          className="block rounded-lg border p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Generate</h2>
          <p className="text-sm text-gray-600">
            Create AI-powered posts for your social media accounts
          </p>
        </a>

        <a
          href="/dashboard/posts"
          className="block rounded-lg border p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Posts</h2>
          <p className="text-sm text-gray-600">
            View and manage your scheduled and published posts
          </p>
        </a>

        <a
          href="/dashboard/analytics"
          className="block rounded-lg border p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Analytics</h2>
          <p className="text-sm text-gray-600">
            Track post performance and generation history
          </p>
        </a>
      </div>
    </main>
  )
}
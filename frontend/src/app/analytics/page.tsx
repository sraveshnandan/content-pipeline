import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AnalyticsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-bold mb-8">Analytics</h1>
      <p className="text-gray-500">No analytics data yet.</p>
    </main>
  )
}
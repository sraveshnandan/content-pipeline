import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="w-64 border-r bg-gray-50 p-6">
      <h2 className="text-lg font-bold mb-6">Content Pipeline</h2>
      <nav className="space-y-4">
        <a href="/dashboard" className="block text-blue-600 hover:underline">
          Dashboard
        </a>
        <a href="/dashboard/generate" className="block text-blue-600 hover:underline">
          Generate
        </a>
        <a href="/dashboard/posts" className="block text-blue-600 hover:underline">
          Posts
        </a>
        <a href="/dashboard/analytics" className="block text-blue-600 hover:underline">
          Analytics
        </a>
      </nav>
    </aside>
  )
}
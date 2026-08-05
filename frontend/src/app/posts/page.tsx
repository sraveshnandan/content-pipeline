import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function PostsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-bold mb-8">Posts</h1>
      <p className="text-gray-500">No posts yet. Generate content to get started.</p>
    </main>
  )
}
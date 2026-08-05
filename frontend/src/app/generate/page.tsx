import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function GeneratePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-bold mb-8">Generate Content</h1>

      <form className="max-w-2xl space-y-6">
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium mb-2"
          >
            Topic or Prompt
          </label>
          <textarea
            id="prompt"
            rows={4}
            className="w-full rounded border p-3"
            placeholder="Describe the content you want to create..."
          />
        </div>

        <div>
          <label
            htmlFor="count"
            className="block text-sm font-medium mb-2"
          >
            Number of posts (1-5)
          </label>
          <select
            id="count"
            className="rounded border p-3"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="images" />
          <label htmlFor="images">Include images</label>
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
        >
          Generate
        </button>
      </form>
    </main>
  )
}
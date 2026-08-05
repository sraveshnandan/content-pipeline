export async function getServerSession() {
  const cookies = await import("next/headers").then((m) => m.cookies())
  const session = cookies.get("mock_session")

  if (!session?.value) {
    return null
  }

  return {
    userId: "mock-user-1",
    userName: "Test User",
    userEmail: "test@example.com",
  }
}

export async function setMockSession() {
  const cookies = await import("next/headers").then((m) => m.cookies())
  cookies.set("mock_session", "mock-session-value", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearMockSession() {
  const cookies = await import("next/headers").then((m) => m.cookies())
  cookies.delete("mock_session")
}
import { Suspense } from "react"

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const message = searchParams.message as string
  const error = searchParams.error as string
  const next = searchParams.next as string

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>

        {message && (
          <p className="mb-4 text-gray-600">{decodeURIComponent(message)}</p>
        )}

        {error && (
          <p className="mb-4 text-red-600">{decodeURIComponent(error)}</p>
        )}

        {next && next !== "/" && (
          <div className="mb-6">
            <p className="mb-2">
              You were trying to access: {decodeURIComponent(next)}
            </p>
            <a
              href={decodeURIComponent(next)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again →
            </a>
          </div>
        )}

        <div className="space-y-2">
          <a
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
          <a
            href="/"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

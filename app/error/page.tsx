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
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold">Authentication Error</h1>

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
              className="text-blue-600 underline hover:text-blue-800"
            >
              Try again →
            </a>
          </div>
        )}

        <div className="space-y-2">
          <a
            href="/login"
            className="block w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go to Login
          </a>
          <a
            href="/"
            className="block w-full rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

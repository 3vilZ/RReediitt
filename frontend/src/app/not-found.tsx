import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
      <h2 className="text-3xl font-bold mb-4">404</h2>
      <p className="text-gray-400 mb-6">Esta página no existe</p>
      <Link
        href="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        Volver al inicio
      </Link>
    </div>
  )
}


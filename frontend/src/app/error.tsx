'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
      <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
      <p className="text-gray-400 mb-4">{error.message || 'Ocurrió un error inesperado'}</p>
      <button
        onClick={reset}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}


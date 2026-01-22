'use client'

import { useEffect } from 'react'
import Image from 'next/image'

interface ImageModalProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
}

export default function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-bold z-10"
          aria-label="Cerrar"
        >
          ×
        </button>
        <div
          className="relative w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={imageUrl}
            alt="Imagen ampliada"
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />
        </div>
      </div>
    </div>
  )
}


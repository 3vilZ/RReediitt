import type { Metadata } from 'next'
import Header from '@/components/Header'
import ChatWidget from '@/components/ChatWidget'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'RReediitt',
  description: 'Una red social estilo Reddit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-gray-900">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
        <ChatWidget />
      </body>
    </html>
  )
}


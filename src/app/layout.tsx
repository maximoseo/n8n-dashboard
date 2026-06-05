import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'n8n Dashboard - MaximoSEO',
  description: 'Unified SEO tooling dashboard with Workflows, URLs Previewer, KW Research, and Link Building',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

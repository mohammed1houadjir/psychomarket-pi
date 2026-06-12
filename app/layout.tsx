import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EagleEye Protocol',
  description: 'AI + Web3 Market Intelligence Engine powered by Pi Network',
  themeColor: '#020617',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${geistSans.variable} bg-background`}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}

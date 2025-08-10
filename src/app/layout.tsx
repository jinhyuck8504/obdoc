import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OBDOC',
  description: '의료진과 환자를 위한 통합 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
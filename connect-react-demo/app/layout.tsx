import type { Metadata } from "next"
import "./globals.css"
import { DatadogScript } from "./components/DatadogScript"
import { GeistSans } from "geist/font/sans"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Pipedream Connect Demo",
  description: "One SDK, thousands of API integrations in your app or AI agent. Pipedream Connect provides managed authentication, approved client IDs, durable components and infratructure for powering AI apps in production. Delight users, grow product usage and solve complex use cases in minutes.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="en" className={GeistSans.variable}>
      <DatadogScript />
      <body className={`antialiased ${GeistSans.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

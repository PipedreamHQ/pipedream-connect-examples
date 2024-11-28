import type { Metadata } from "next"
import "./globals.css"
import { DatadogScript } from "./components/DatadogScript"

export const metadata: Metadata = {
  title: "Demo - Pipedream Connect",
  description: "One SDK, thousands of API integrations in your app or AI agent. Pipedream Connect provides managed authentication, approved client IDs, durable components and infratructure for running serverless functions. Delight users, grow product usage and solve complex use cases in minutes.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="en">
      <DatadogScript />
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

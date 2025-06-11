import type { Metadata } from "next"
import "./globals.css"
import { DatadogScript } from "./components/DatadogScript"
import { GoogleAnalytics } from "./components/GoogleAnalytics"
import { GeistSans } from "geist/font/sans"

export const metadata: Metadata = {
  title: "Pipedream Connect - One SDK, thousands of API integrations",
  description: "Pipedream Connect provides managed authentication for 2,700+ APIs and access to 10,000+ prebuilt tools. Roll your own frontend with the server SDK or use @pipedream/connect-react to get started in minutes.",
  openGraph: {
    title: "Pipedream Connect - One SDK, thousands of API integrations",
    description: "Pipedream Connect provides managed authentication for 2,700+ APIs and access to 10,000+ prebuilt tools. Roll your own frontend with the server SDK or use @pipedream/connect-react to get started in minutes.",
    url: "https://pipedream.com/connect",
    siteName: "Pipedream Connect",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Pipedream Connect Demo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pipedream Connect - One SDK, thousands of API integrations",
    description: "Pipedream Connect provides managed authentication for 2,700+ APIs and access to 10,000+ prebuilt tools.",
    images: ["/opengraph-image.png"],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="en" className={GeistSans.variable}>
      <DatadogScript />
      <GoogleAnalytics />
      <body className={`antialiased ${GeistSans.className}`}>
        {children}
      </body>
    </html>
  )
}

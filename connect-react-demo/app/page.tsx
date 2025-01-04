
import { queryParamSchema } from "@/lib/query-params"
import { Metadata, ResolvingMetadata } from "next"
import { Suspense } from "react"
import { ClientWrapper } from "./components/ClientWrapper";
import { backendClient } from "@/lib/backend-client";

export async function generateMetadata(
  { searchParams: _searchParams }: {searchParams: unknown},
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = queryParamSchema.parse(_searchParams)

  const client = backendClient()
 
  let title = (await parent).title?.absolute || ""

  if (searchParams.app) {
    const app = await client.app(searchParams.app)
    title = `Try ${app.data.name} using Pipedream Connect`
  }

  return {
    title,
  };
}

export default function Home({searchParams: _searchParams}: {searchParams: unknown}) {
  return (
    <Suspense>
      <ClientWrapper/>
    </Suspense>
  )
}

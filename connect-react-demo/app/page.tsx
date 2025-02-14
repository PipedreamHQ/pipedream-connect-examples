import { Metadata, ResolvingMetadata } from "next"
import { Suspense } from "react"
import { ClientWrapper } from "./components/ClientWrapper";

export async function generateMetadata(
  { searchParams: _searchParams }: {searchParams: unknown},
  parent: ResolvingMetadata
): Promise<Metadata> {

  const title = (await parent).title?.absolute || ""

  return {
    title,
  };
}

export default async function Home({searchParams: _searchParams}: {searchParams: unknown}) {
  return (
    <Suspense>
      <ClientWrapper/>
    </Suspense>
  )
}

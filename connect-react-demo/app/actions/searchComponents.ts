'use server'

export const searchComponentsAction = async (query: string) => {
  const queryParams = new URLSearchParams({
    query: query.trim()
  }).toString()

  const response = await fetch(
    `https://api.pipedream.com/v1/components/search?${queryParams}&similarity_threshold=0.5&limit=1`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PIPEDREAM_OAUTH_JWT}`,
      }
    }
  )

  const data = await response.json()
  console.log('API Response:', JSON.stringify(data, null, 2))
  return data
} 
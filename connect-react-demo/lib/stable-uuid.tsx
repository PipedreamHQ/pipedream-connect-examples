import { useEffect, useState } from "react"
import { v4 as uuid } from "uuid"


export const useStableUuid = (): [string, () => void] => {
    const [id, setId] = useState<string>("")

    const refresh = () => {
      // Check for override env var first
      const overrideId = process.env.NEXT_PUBLIC_EXTERNAL_USER_ID
      setId(overrideId || `demo-${uuid()}`)
    }

    useEffect(() => {
      refresh()
    }, [])

    return [id, refresh]
}

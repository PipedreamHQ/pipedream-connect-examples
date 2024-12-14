import { useEffect, useState } from "react"
import { v4 as uuid } from "uuid"


export const useStableUuid = (): [string, () => void] => {
    const [id, setId] = useState<string>("")

    const refresh = () => {
//      setId(`demo-${uuid()}`)
      setId("demo-21f43257-9b87-46a8-ac40-d9d0bbcc80fd")
    }

    useEffect(() => {
      refresh()
    }, [])

    return [id, refresh]
}

import { useEffect, useState } from "react"
import { v4 as uuid } from "uuid"


export const useStableUuid = (): [string, () => void] => {
    const [id, setId] = useState<string>("")

    const refresh = () => {
      setId(`demo-${uuid()}`)
    }

    useEffect(() => {
      refresh()
    }, [])

    return [id, refresh]
}

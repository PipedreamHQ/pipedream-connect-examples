import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { queryParamSchema } from "./query-params";


type KeyValPair = {key: keyof z.infer<typeof queryParamSchema>, value: string | undefined}


export const useQueryParams = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const setQueryParams = (keyVals: KeyValPair[]) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        for (const {key, value} of keyVals) {
            if (value && !(Array.isArray(value) && !value.length)) {
                current.set(key, value);
            } else if (current.has(key)) {
                current.delete(key);
            }
        }

        const search = current.toString();
        const query = search ? `?${search}` : "";

        router.replace(`${pathname}${query}`);
    }

    const setQueryParam = (key: KeyValPair["key"], value: KeyValPair["value"]) => {
        setQueryParams([{key, value}]);
    }

    const queryParams = queryParamSchema.parse(Object.fromEntries(searchParams.entries()));

    return {
        setQueryParam,
        setQueryParams,
        queryParams,
    }
}

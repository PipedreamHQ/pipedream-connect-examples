import type { CSSProperties } from "react"
import type { ConfigurableProp, LabelProps } from "@pipedream/connect-react"
import { useCustomize } from "@pipedream/connect-react"

export function CustomLabel<T extends ConfigurableProp>(props: LabelProps<T>) {
  const { text, field } = props
  const { id } = field

  const { getProps, theme } = useCustomize()

  const baseStyles: CSSProperties = {
    color: theme.colors.neutral90,
    fontWeight: 450,
    gridArea: "label",
    textTransform: "capitalize",
    lineHeight: "1.5",
  }

  const required = (!field.prop.optional && !["alert","app"].includes(field.prop.type))
    ? field.prop.type == "boolean" ? typeof field.value != "undefined" : !!field.value
      ? <span style={{color: "#12b825", fontSize: "small", marginLeft: "0.5rem"}}> ✓</span>
      : <span style={{color: "#d0d0d0", fontSize: "small", marginLeft: "0.5rem"}}> ✓</span>
    : ""
  return (
    <label htmlFor={id} {...getProps("label", baseStyles, props)}>{text}{required}</label>
  )
}

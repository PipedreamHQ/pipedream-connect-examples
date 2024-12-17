import { CustomizationConfig } from "@pipedream/connect-react/src/hooks/customization-context"
import { CustomDropdownIndicator } from "./CustomIndicators"
import { CustomLabel } from "./CustomLabel"

const customization: CustomizationConfig = {
  components: {
    Label: CustomLabel,
    controlSelect: {
      DropdownIndicator: CustomDropdownIndicator,
    },
  },
  styles: {
    label: { fontSize: "80%" },
    controlInput: (base, { theme }) => ({
      ...base,
      borderTop: 0,
      borderLeft: 0,
      borderRight: 0,
      border: "solid",
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.neutral0,
    }),
    description: { fontSize: "60%" },
    field: { padding: 2 },
    heading: { fontSize: "80%" },
    controlSelect: {
      control: (base, { theme }) => ({
        ...base,
        borderRadius: 0,
        borderColor: theme.colors.primary25,
        fontSize: "small",
        maxHeight: "36px",
      }),
      container: (base) => ({
        ...base,
        fontSize: "small",
      }),
      menu: (base) => ({
        ...base,
        fontSize: "small",
      }),
    },
    controlSubmit: (base, { form, theme }) => {
      const spinner = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 100 100"><circle fill="none" stroke="#ffffff" stroke-width="8" cx="50" cy="50" r="44" style="opacity:0.5;"/><circle fill="none" stroke="#cccccc" stroke-width="8" cx="50" cy="50" r="44" stroke-dasharray="172" stroke-dashoffset="86.4" transform="rotate(-90.0001 50 50)"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50"/></circle></svg>`
      return {
        ...base,
        backgroundImage: form.submitting ? `url('data:image/svg+xml;base64,${btoa(spinner)}')` : "unset",
        backgroundPosition: "right 15% top 50%",
        backgroundRepeat: "no-repeat",
      }
    },
  },
  theme: {
    borderRadius: 0,
    colors: {
      primary: "hsl(200, 100%, 60%)",
      primary75: "hsl(200, 100%, 55%)",
      primary50: "hsl(200, 100%, 40%)",
      primary25: "hsl(200, 100%, 35%)",

      danger: "#DE350B",
      dangerLight: "#FFBDAD",

      neutral0: "hsl(200, 50%, 97%)",
      neutral5: "hsl(200, 50%, 95%)",
      neutral10: "hsl(200, 50%, 90%)",
      neutral20: "hsl(200, 50%, 80%)",
      neutral30: "hsl(200, 50%, 70%)",
      neutral40: "hsl(200, 50%, 60%)",
      neutral50: "hsl(200, 50%, 50%)",
      neutral60: "hsl(200, 50%, 40%)",
      neutral70: "hsl(200, 50%, 30%)",
      neutral80: "hsl(200, 50%, 20%)",
      neutral90: "hsl(200, 50%, 10%)",
    },
    spacing: {
      baseUnit: 4,
      controlHeight: 10,
      menuGutter: 6,
    },
  },
}

export default customization

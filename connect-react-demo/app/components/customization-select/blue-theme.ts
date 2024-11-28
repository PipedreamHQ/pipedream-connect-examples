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

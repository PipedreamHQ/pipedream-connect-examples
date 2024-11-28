import { CustomizationConfig } from "@pipedream/connect-react/src/hooks/customization-context"

const customization: CustomizationConfig = {
  styles: {
    controlInput: (base, { theme }) => ({
      ...base,
      backgroundColor: theme.colors.neutral20,
    }),
    controlSubmit: (base, { theme }) => ({
      ...base,
      color: theme.colors.neutral90,
      backgroundColor: theme.colors.primary,
    }),
    controlSelect: {
      control: (base, { theme }) => ({
        ...base,
        backgroundColor: theme.colors.neutral80,
        borderColor: "transparent",
      }),
      option: (base, { theme }) => ({
        ...base,
        color: theme.colors.neutral10,
        backgroundColor: theme.colors.neutral80,
      }),
      menuList: (base, { theme }) => ({
        ...base,
        color: theme.colors.neutral10,
        backgroundColor: theme.colors.neutral80,
      }),
      singleValue: (base, { theme }) => ({
        ...base,
        color: theme.colors.neutral10,
      }),
      valueContainer: (base, { theme }) => ({
        ...base,
        backgroundColor: theme.colors.neutral80,
      }),
    },
  },
  theme: {
    borderRadius: 4,
    colors: {
      primary: "#2684FF",
      primary75: "#4C9AFF",
      primary50: "#B2D4FF",
      primary25: "#DEEBFF",

      danger: "#DE350B",
      dangerLight: "#FFBDAD",

      neutral0: "hsl(0, 0%, 10%)",
      neutral5: "hsl(0, 0%, 5%)",
      neutral10: "hsl(0, 0%, 10%)",
      neutral20: "hsl(0, 0%, 20%)",
      neutral30: "hsl(0, 0%, 30%)",
      neutral40: "hsl(0, 0%, 40%)",
      neutral50: "hsl(0, 0%, 50%)",
      neutral60: "hsl(0, 0%, 60%)",
      neutral70: "hsl(0, 0%, 70%)",
      neutral80: "hsl(0, 0%, 80%)",
      neutral90: "hsl(0, 0%, 90%)",
    },
    boxShadow: {
      button:
        "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px",
      card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      dropdown:
        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      input: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    },
    spacing: {
      baseUnit: 4,
      controlHeight: 32,
      menuGutter: 8,
    },
  },
}

export default customization

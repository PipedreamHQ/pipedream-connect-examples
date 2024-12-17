import { CustomizationConfig } from "@pipedream/connect-react/src/hooks/customization-context"

const customization: CustomizationConfig = {
  styles: {
    controlSubmit: (base, { form }) => {
      const spinner = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 100 100"><circle fill="none" stroke="#ffffff" stroke-width="8" cx="50" cy="50" r="44" style="opacity:0.5;"/><circle fill="none" stroke="#cccccc" stroke-width="8" cx="50" cy="50" r="44" stroke-dasharray="172" stroke-dashoffset="86.4" transform="rotate(-90.0001 50 50)"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50"/></circle></svg>`
      return {
        ...base,
        backgroundImage: form.submitting ? `url('data:image/svg+xml;base64,${btoa(spinner)}')` : "unset",
        backgroundPosition: "right 15% top 50%",
        backgroundRepeat: "no-repeat",
      }
    },
  },

}

export default customization

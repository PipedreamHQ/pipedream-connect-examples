import { motion } from "framer-motion"

export const Cursor = () => (
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{
      repeat: Infinity,
      repeatType: "reverse",
      duration: 0.3,
    }}
    className="inline-block w-[8px] h-[16px] -mb-[2px] bg-zinc-300"
  />
)

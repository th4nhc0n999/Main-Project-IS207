/* eslint-disable react-refresh/only-export-components */
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-sage-600 text-white shadow hover:bg-sage-700",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200",
        destructive:
          "border-transparent bg-rose-500 text-white shadow hover:bg-rose-600",
        outline: "text-slate-800 border-slate-300",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 font-medium",
        danger:
          "border-rose-200 bg-rose-50 text-rose-700 font-medium",
        info:
          "border-sage-200 bg-sage-50 text-sage-700 font-medium",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export default Badge

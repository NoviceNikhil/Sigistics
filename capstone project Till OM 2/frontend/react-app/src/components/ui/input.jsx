import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative w-full">
      <input
        type={inputType}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isPassword ? "pr-10" : "",
          className
        )}
        ref={ref}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex="-1"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }

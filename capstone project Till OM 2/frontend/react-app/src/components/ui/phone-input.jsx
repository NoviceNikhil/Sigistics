import * as React from "react"
import { cn } from "@/lib/utils"

const PhoneInput = React.forwardRef(({ className, value, onChange, onBlur, required, error, disabled, ...props }, ref) => {
  // If value exists and starts with a +, try to isolate the country code from the number
  const initialCode = value && value.startsWith("+") ? value.slice(0, value.indexOf(" ", 1) === -1 ? (value.length > 3 ? 3 : value.length) : value.indexOf(" ")) : "+91";
  const initialNumber = value ? value.replace(/^\+\d+\s*/, '') : "";

  const [countryCode, setCountryCode] = React.useState("+91")
  const [number, setNumber] = React.useState("")

  const handleChange = (e) => {
    // Only allow numeric digits and instantly cap at 10 length
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setNumber(rawVal);
    if (onChange) {
      // Pass the fully concatenated E.164 formatted string
      onChange(countryCode + rawVal);
    }
  }

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setCountryCode(code);
    if (onChange) {
      onChange(code + number);
    }
  }

  return (
    <div className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background overflow-hidden relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
      error ? "border-destructive focus-within:ring-destructive border-l-destructive" : "",
      disabled ? "cursor-not-allowed opacity-50" : "",
      className
    )}>
      <div className="flex items-center justify-center w-[50px] sm:w-[58px] h-full bg-muted border-r border-input shrink-0 cursor-not-allowed opacity-80 select-none">
         <span className="text-xs text-muted-foreground">🇮🇳 +91</span>
      </div>
      <input
        type="tel"
        className="flex-1 px-3 py-2 text-base md:text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        placeholder="9876543210"
        value={number}
        onChange={handleChange}
        onBlur={() => {
          // Signal blur explicitly passing the raw number string length for exact 10-digit evaluation
          if (onBlur) onBlur(number);
        }}
        required={required}
        disabled={disabled}
        ref={ref}
        {...props}
      />
    </div>
  )
})
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }

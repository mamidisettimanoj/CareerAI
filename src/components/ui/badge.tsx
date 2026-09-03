import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let vClass = "bg-primary text-primary-foreground hover:bg-primary/80";
  
  if (variant === "secondary") {
    vClass = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  } else if (variant === "destructive") {
    vClass = "bg-destructive text-destructive-foreground hover:bg-destructive/80";
  } else if (variant === "outline") {
    vClass = "text-foreground border border-input hover:bg-accent hover:text-accent-foreground";
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${vClass} ${className || ""}`}
      {...props}
    />
  )
}

'use client'
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Toast = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & ToastProps
>(({ className, variant = "default", title, description, open = true, onOpenChange, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(open)

  React.useEffect(() => {
    setIsVisible(open)
  }, [open])

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onOpenChange?.(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, onOpenChange])

  if (!isVisible) return null

  return (
    <div
      ref={ref}
      className={cn(
        "fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all",
        variant === "default" && "bg-white border-gray-200",
        variant === "destructive" && "bg-red-50 border-red-200",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <div className={cn(
              "text-sm font-semibold",
              variant === "default" && "text-gray-900",
              variant === "destructive" && "text-red-900"
            )}>
              {title}
            </div>
          )}
          {description && (
            <div className={cn(
              "text-sm mt-1",
              variant === "default" && "text-gray-600",
              variant === "destructive" && "text-red-700"
            )}>
              {description}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            onOpenChange?.(false)
          }}
          className={cn(
            "ml-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity",
            variant === "default" && "text-gray-500",
            variant === "destructive" && "text-red-500"
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})
Toast.displayName = "Toast"

export { Toast }
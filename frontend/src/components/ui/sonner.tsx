"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-white" />
        ),
        info: (
          <InfoIcon className="size-4 text-white" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-white" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-white" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-white" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "16px",
          "--success-bg": "#1faa6e",
          "--success-text": "#ffffff",
          "--success-border": "#188c5a",
          "--error-bg": "#dc2626",
          "--error-text": "#ffffff",
          "--error-border": "#b91c1c",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast shadow-xl rounded-2xl border font-medium text-sm py-3.5 px-4",
          success: "!bg-[#1faa6e] !text-white !border-[#188c5a] shadow-emerald-900/20 [&_[data-title]]:!text-white [&_[data-description]]:!text-white/90 [&_svg]:!text-white",
          error: "!bg-red-600 !text-white !border-red-700 shadow-red-900/20 [&_[data-title]]:!text-white [&_[data-description]]:!text-white/90 [&_svg]:!text-white",
          warning: "!bg-amber-600 !text-white !border-amber-700 shadow-amber-900/20 [&_[data-title]]:!text-white [&_[data-description]]:!text-white/90 [&_svg]:!text-white",
          info: "!bg-zinc-900 !text-white !border-zinc-800 shadow-zinc-900/20 [&_[data-title]]:!text-white [&_[data-description]]:!text-white/90 [&_svg]:!text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

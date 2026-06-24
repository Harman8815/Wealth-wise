"use client"

import { useEffect } from "react"
import { Toaster } from "./toaster"
import { toast as appToast } from "@/hooks/use-toast"

export function ToasterProvider() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ;(window as any).wealthwiseToast = (opts: any) => {
          try {
            appToast(opts)
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore
    }

    return () => {
      if (typeof window !== 'undefined') {
        try {
          delete (window as any).wealthwiseToast
        } catch (e) {}
      }
    }
  }, [])

  return <Toaster />
}

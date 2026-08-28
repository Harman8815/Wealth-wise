"use client";

import React from "react";
import { Bug } from "lucide-react";
import { useDebug } from "@/components/debug/debug-context";

export function DebugToggle() {
  const { enabled, toggle } = useDebug();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border text-white shadow-lg transition-colors ${
        enabled ? "border-red-500 bg-red-600 hover:bg-red-700" : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
      title={enabled ? "Debug Mode ON" : "Debug Mode OFF"}
    >
      <Bug className="h-4 w-4" />
    </button>
  );
}

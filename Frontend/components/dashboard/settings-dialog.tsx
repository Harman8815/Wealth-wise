"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { AlertTriangle, Download, Trash2 } from "lucide-react"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [currency, setCurrency] = useState("INR")
  const [language, setLanguage] = useState("en")
  const { theme, setTheme } = useTheme()

  const tabs = [
    { id: "general", label: "General" },
    { id: "appearance", label: "Appearance" },
    { id: "account", label: "Account" },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "appearance":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Theme Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="w-full"
                >
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="w-full"
                >
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="w-full"
                >
                  System
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your preferred theme or let the system decide based on your device settings.
              </p>
            </div>
          </div>
        )

      case "account":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Data Management</h3>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download My Data
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Export all your financial data in a secure format.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">Danger Zone</h3>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
                <div className="flex items-start space-x-2 mt-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    This action cannot be undone. This will permanently delete your account and remove all your data
                    from our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 pr-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6">
            <div className="h-full overflow-y-auto">{renderTabContent()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

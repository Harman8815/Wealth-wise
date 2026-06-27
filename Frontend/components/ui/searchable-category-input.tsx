"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useCategories, useCreateCategory } from "@/hooks"
import { CATEGORY_SYMBOLS, DEFAULT_SYMBOL, DEFAULT_COLOR, DEFAULT_TEXT_COLOR, type CategorySymbol } from "@/data/category-symbols"

interface SearchableCategoryInputProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  type?: "expense" | "income" | "budget" | "goal"
  disabled?: boolean
}

export function SearchableCategoryInput({
  value = "",
  onValueChange,
  placeholder = "Select or create category...",
  type = "expense",
  disabled = false,
}: SearchableCategoryInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { data: categoriesData, isLoading } = useCategories({ type }, undefined, 50)
  const createMutation = useCreateCategory()
  
  const categories = categoriesData?.results || []
  
  const filtered = categories.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  
  const showCreateOption = search.length > 0 && !filtered.some(c => c.name.toLowerCase() === search.toLowerCase())
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((categoryName: string) => {
    setSearch(categoryName)
    onValueChange(categoryName)
    setIsOpen(false)
  }, [onValueChange])

  const handleCreate = useCallback(async () => {
    if (!search.trim()) return
    
    const symbol = CATEGORY_SYMBOLS[0]?.value || DEFAULT_SYMBOL
    try {
      const created = await createMutation.mutateAsync({
        name: search.trim(),
        type,
        color: DEFAULT_COLOR,
        text_color: DEFAULT_TEXT_COLOR,
        icon: symbol,
        symbol,
      })
      setSelectedCategoryId(created.id)
      onValueChange(created.name)
      setIsOpen(false)
      setSearch("")
    } catch (error) {
      console.error("Failed to create category:", error)
    }
  }, [search, type, createMutation, onValueChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearch(newValue)
    setIsOpen(true)
    
    if (newValue && !categories.some(c => c.name.toLowerCase() === newValue.toLowerCase())) {
      onValueChange(newValue)
      setSelectedCategoryId(null)
    } else if (categories.some(c => c.name.toLowerCase() === newValue.toLowerCase())) {
      const match = categories.find(c => c.name.toLowerCase() === newValue.toLowerCase())
      if (match) {
        setSelectedCategoryId(match.id)
        onValueChange(match.name)
      }
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (!search && value) {
      setSearch(value)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={search || value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled || createMutation.isPending}
          className="pr-10"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500">Loading categories...</div>
          ) : filtered.length === 0 && !showCreateOption ? (
            <div className="p-2 text-sm text-gray-500">No categories found.</div>
          ) : (
            <div className="py-1">
              {filtered.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedCategoryId === category.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleSelect(category.name)}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-xs" style={{ color: category.text_color }}>
                      {CATEGORY_SYMBOLS.find(s => s.value === category.symbol)?.label?.[0] || "?"}
                    </span>
                  </div>
                  <span className="flex-1 text-left">{category.name}</span>
                  {selectedCategoryId === category.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
              
              {showCreateOption && (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create &quot;{search}&quot;</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

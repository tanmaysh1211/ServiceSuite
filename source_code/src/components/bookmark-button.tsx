"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { addBookmark, removeBookmark, isBookmarked } from "@/actions/bookmark-actions"
import { toast } from "sonner"

interface BookmarkButtonProps {
  jobId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  showText?: boolean
}

export function BookmarkButton({ 
  jobId, 
  variant = "outline", 
  size = "default", 
  className = "",
  showText = false 
}: BookmarkButtonProps) {
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }

    const checkBookmarkStatus = async () => {
      const result = await isBookmarked(user.id, jobId)
      if (result.success) {
        setBookmarked(result.isBookmarked)
      }
      setChecking(false)
    }

    checkBookmarkStatus()
  }, [user, jobId])

  const handleToggleBookmark = async () => {
    if (!user) {
      toast.error("Please sign in to bookmark jobs")
      return
    }

    setLoading(true)
    
    if (bookmarked) {
      const result = await removeBookmark(user.id, jobId)
      if (result.success) {
        setBookmarked(false)
        toast.success("Job removed from bookmarks")
      } else {
        toast.error("Failed to remove bookmark")
      }
    } else {
      const result = await addBookmark(user.id, jobId)
      if (result.success) {
        setBookmarked(true)
        toast.success("Job added to bookmarks")
      } else {
        toast.error(result.message || "Failed to add bookmark")
      }
    }
    
    setLoading(false)
  }

  if (checking) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        {showText && <span className="ml-2">Loading...</span>}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${bookmarked ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800' : ''}`}
      onClick={handleToggleBookmark}
      disabled={loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : bookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </span>
      )}
    </Button>
  )
} 
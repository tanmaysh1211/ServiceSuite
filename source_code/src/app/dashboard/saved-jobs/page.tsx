"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Job } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Briefcase,
  DollarSign,
  Clock,
  MapPin,
  Award,
  Calendar,
  Eye,
  Send,
  Trash2
} from "lucide-react"
import { AuthGuard } from "@/components/auth-gaurd"
import Link from "next/link"
import { toast } from "sonner"

interface JobWithClient extends Job {
  client_name: string
  client_email: string
  bookmark_id: string
}

// Utility Functions
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

const getGradientColors = (name: string) => {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-blue-600",
    "from-purple-500 to-pink-600",
    "from-orange-500 to-red-600",
    "from-teal-500 to-green-600",
    "from-indigo-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-yellow-500 to-orange-600"
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

const formatBudget = (job: Job) => {
  if (job.budget_type === 'hourly') {
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min}-${job.budget_max}/hr`
    } else if (job.budget_min) {
      return `$${job.budget_min}/hr+`
    } else if (job.budget_max) {
      return `Up to $${job.budget_max}/hr`
    }
    return "Rate negotiable"
  } else if (job.budget_type === 'fixed') {
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min}-${job.budget_max}`
    } else if (job.budget_min) {
      return `$${job.budget_min}+`
    } else if (job.budget_max) {
      return `Up to $${job.budget_max}`
    }
    return "Budget negotiable"
  }
  return "Budget negotiable"
}

function SavedJobsContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [bookmarkedJobs, setBookmarkedJobs] = useState<JobWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Redirect clients to dashboard
  useEffect(() => {
    if (userProfile && userProfile.role === "client") {
      router.push("/dashboard")
    }
  }, [userProfile, router])

  useEffect(() => {
    if (!user) return

    const fetchBookmarkedJobs = async () => {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
          id,
          jobs (
            *,
            profiles!jobs_client_id_fkey (
              name,
              email
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setError("Failed to load your saved jobs.")
        setBookmarkedJobs([])
      } else {
        const transformed = (data || []).map((bookmark: any) => ({
          ...bookmark.jobs,
          client_name: bookmark.jobs.profiles?.name || "Anonymous Client",
          client_email: bookmark.jobs.profiles?.email || "",
          bookmark_id: bookmark.id
        }))
        setBookmarkedJobs(transformed)
      }

      setLoading(false)
    }

    fetchBookmarkedJobs()
  }, [user])

  const handleRemoveBookmark = async (jobId: string) => {
    if (!user) return

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", jobId)

    if (error) {
      toast.error("Failed to remove bookmark")
    } else {
      setBookmarkedJobs(prev => prev.filter(job => job.id !== jobId))
      toast.success("Job removed from bookmarks")
    }
  }

  if (userProfile?.role === "client") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Saved Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Your bookmarked jobs and opportunities
          </p>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your saved jobs...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && bookmarkedJobs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-6xl mb-4">🔖</div>
              <p className="text-muted-foreground text-lg">You haven&apos;t saved any jobs yet.</p>
              <p className="text-muted-foreground mb-6">Start exploring the jobs marketplace to find opportunities you&apos;d like to save for later.</p>
              <Button onClick={() => router.push('/dashboard/jobs-marketplace')}>
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Jobs
              </Button>
            </div>
          )}

          {!loading &&
            !error &&
            bookmarkedJobs.map((job) => (
              <Card
                key={job.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden bg-white dark:bg-gray-800 hover:scale-[1.02]"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left Section */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className={`w-16 h-16 bg-gradient-to-br ${getGradientColors(
                            job.client_name
                          )} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 group-hover:scale-105`}
                        >
                          {getInitials(job.client_name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors duration-300">
                              {job.title}
                            </h3>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Posted by <span className="font-semibold">{job.client_name}</span>
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 line-clamp-1 leading-relaxed">
                            {job.description}
                          </p>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex items-center gap-6 mb-4 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">{formatBudget(job)}</span>
                        </div>
                        {job.project_duration && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="h-4 w-4" />
                            {job.project_duration}
                          </div>
                        )}
                        {job.location_preference && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPin className="h-4 w-4" />
                            {job.location_preference}
                          </div>
                        )}
                        {job.experience_level && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Award className="h-4 w-4" />
                            {job.experience_level}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Required Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills_required.slice(0, 5).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-0 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {job.skills_required.length > 5 && (
                          <Badge
                            variant="outline"
                            className="text-gray-500 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:scale-105"
                          >
                            +{job.skills_required.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="lg:w-64 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-l border-gray-200 dark:border-gray-700">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <p className="text-2xl font-bold text-green-600">
                            {formatBudget(job)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{job.budget_type} project</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/dashboard/jobs-marketplace/${job.id}/apply`}>
                          <Button
                            className="w-full bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg rounded-xl py-3 transition-all duration-300"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Apply Now
                          </Button>
                        </Link>
                        <Link href={`/dashboard/jobs-marketplace/${job.id}`}>
                          <Button
                            variant="outline"
                            className="w-full border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl py-3 font-semibold transition-all duration-300 hover:scale-105"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleRemoveBookmark(job.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>

                      {/* Job Stats */}
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Views:</span>
                          <span className="font-medium">{job.views_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Applications:</span>
                          <span className="font-medium">{job.applications_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}

export default function SavedJobsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <SavedJobsContent />
    </AuthGuard>
  )
} 
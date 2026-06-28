"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Job } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  MapPin, 
  Award, 
  ArrowLeft, 
  User,
  Calendar,
  Send,
  Edit,
  FileText,
  Trash
} from "lucide-react"
import { AuthGuard } from "@/components/auth-gaurd"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteJob } from "@/actions/ai-actions"
import { toast } from "sonner"
import { BookmarkButton } from "@/components/bookmark-button"

interface JobWithClient extends Job {
  client_name: string
  client_email: string
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
  } else if (job.budget_type === 'fixed') {
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min}-${job.budget_max}`
    } else if (job.budget_min) {
      return `$${job.budget_min}+`
    } else if (job.budget_max) {
      return `Up to $${job.budget_max}`
    }
  }
  return "Budget negotiable"
}

function JobDetailsContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string
  
  const [job, setJob] = useState<JobWithClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isOwner, setIsOwner] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const fetchJob = useCallback(async () => {
    setLoading(true)
    setError("")
    
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        client:profiles!jobs_client_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq("id", jobId)
      .single()
    
    // if (error) {
    //   if (error.code === 'PGRST116') {
    //     setError("Job not found or no longer available.")
    //   } else {
    //     setError("Failed to load job details.")
    //   }
    //   setJob(null)
    // }
    if (error) {
  console.error("SUPABASE ERROR:", error);

  if (error.code === "PGRST116") {
    setError("Job not found or no longer available.");
  } else {
    setError(
      `${error.code ?? ""} - ${error.message}${
        error.details ? "\n" + error.details : ""
      }`
    );
  }

  setJob(null);
  return;
}
     else {
      const transformed = {
        ...data,
        client_name: data.profiles?.name || "Anonymous Client",
        client_email: data.profiles?.email || ""
      }
      setJob(transformed)
      if (user?.id === transformed.client_id) {
        setIsOwner(true)
      }
    }
    setLoading(false)
  }, [jobId, user])

  useEffect(() => {
    if (!jobId || !user) return;
    fetchJob();
  }, [jobId, user, fetchJob])

  const handleDeleteJob = async () => {
    if (!job || !user) return
    setIsDeleting(true)
    const result = await deleteJob(job.id, user.id)
    if (result.success) {
      toast.success("Job deleted successfully")
      router.push("/dashboard")
    } else {
      toast.error("Failed to delete job", { description: result.message })
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Job</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!job) return null

  const renderActionButtons = () => {
    if (userProfile?.role === 'provider') {
      return (
        <div className="flex gap-3">
          <BookmarkButton 
            jobId={job.id}
            variant="outline"
            className="border-2 border-yellow-200 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            showText={true}
          />
          <Button
            onClick={() => router.push(`/dashboard/jobs-marketplace/${job.id}/apply`)}
            className="bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg transition-all duration-300"
          >
            <Send className="h-4 w-4 mr-2" />
            Apply Now
          </Button>
        </div>
      )
    }

    if (isOwner) {
      return (
        <div className="flex gap-3">
          <Link href={`/dashboard/my-jobs/${job.id}/edit`}>
            <Button
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Job
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Job
          </Button>
          <Link href={`/dashboard/my-jobs/${job.id}/applications`}>
            <Button className="bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg transition-all duration-300">
              <FileText className="h-4 w-4 mr-2" />
              View Applications
            </Button>
          </Link>
        </div>
      )
    }
    return null
  }

  return (
    <>
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this job?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the job and all its applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteJob} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Job Details
              </h1>
            </div>
          </div>
          {renderActionButtons()}
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {job.title}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{job.category}</Badge>
                  <Badge variant={job.status === 'open' ? "default" : "destructive"}>{job.status}</Badge>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Job Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>

                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Budget & Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-semibold text-green-600">{formatBudget(job)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-semibold capitalize">{job.experience_level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold">{job.project_duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Location</span>
                  <span className="font-semibold capitalize">{job.location_preference}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  About the Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Name</span>
                  <span className="font-semibold">{job.client_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Posted</span>
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default function JobDetailsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <JobDetailsContent />
    </AuthGuard>
  )
} 
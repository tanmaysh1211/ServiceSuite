"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Job, type JobApplication } from "@/lib/supabaseClient"
import {
  Plus,
  Eye,
  Briefcase,
  Users,
  FileText,
  Calendar,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Edit,
  Trash,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { deleteJob } from "@/actions/ai-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface JobWithApplications extends Job {
  job_applications: {
    id: string
    created_at: string
    status: string
    provider_marked_done: boolean
    provider_id: string
    profiles: {
      id: string
      name: string
    } | null
  }[]
}

export function ClientDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobWithApplications[]>([])
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [jobToDelete, setJobToDelete] = useState<JobWithApplications | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchJobsAndApplications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        job_applications (
          id,
          created_at,
          status,
          provider_marked_done,
          provider_id,
          profiles ( id, name )
        )
      `)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })

    // if (error) {
    //   setError("Failed to load your jobs and applications.")
    //   setJobs([])
    // }
    if (error) {
      console.log("SUPABASE ERROR:", error)
      setError(error.message)
      setJobs([])
    } 
    else {
      const jobsData = data as JobWithApplications[]
      setJobs(jobsData)

      const allApplications = jobsData
        .flatMap(job =>
          job.job_applications.map(app => ({
            ...app,
            jobTitle: job.title,
            jobId: job.id,
          }))
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setRecentApplications(allApplications)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchJobsAndApplications()
  }, [fetchJobsAndApplications])

  const handleDeleteJob = async () => {
    if (!jobToDelete || !user) return
    setIsDeleting(true)

    const result = await deleteJob(jobToDelete.id, user.id)

    if (result.success) {
      toast.success("Job deleted successfully")
      setJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id))
      setJobToDelete(null)
    } else {
      toast.error("Failed to delete job", { description: result.message })
    }
    setIsDeleting(false)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "open":
        return "default"
      case "in_progress":
        return "secondary"
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Dialog
        open={!!jobToDelete}
        onOpenChange={(open) => !open && setJobToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this job?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the job "
              {jobToDelete?.title}" and all its applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setJobToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJob}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-950/80 to-purple-900/80 rounded-2xl shadow-lg p-6 mb-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
              Client Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg">
              Manage your job postings and view applications
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto justify-center">
            <Link href="/dashboard/freelancers">
              <Button variant="outline" className="w-full sm:w-auto">
                <Users className="h-4 w-4 mr-2" />
                Find Freelancers
              </Button>
            </Link>
            <Link href="/dashboard/providers-worked-with">
              <Button variant="outline" className="w-full sm:w-auto">
                <Briefcase className="h-4 w-4 mr-2" />
                Providers Worked With
              </Button>
            </Link>
            <Link href="/dashboard/post-job">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Post a New Job
              </Button>
            </Link>
          </div>
        </div>

        {/* My Job Postings */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Briefcase className="h-5 w-5" />
              My Job Postings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading jobs...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
                <Link href="/dashboard/post-job">
                  <Button className="mt-4">Post a Job</Button>
                </Link>
              </div>
            )}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map(job => (
                <Card key={job.id} className="p-4 flex flex-col gap-4 rounded-xl shadow-md border bg-background dark:bg-muted">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant={getStatusVariant(job.status)} className="capitalize px-2 py-1 text-xs font-semibold">
                        {job.status}
                      </Badge>
                      <span className="bg-muted rounded px-2 py-1">{job.job_applications.length} Applications</span>
                      <span className="bg-muted rounded px-2 py-1">Created {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2 mt-2 w-full">
                    <Link href={`/dashboard/jobs-marketplace/${job.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-2" />
                        View Job
                      </Button>
                    </Link>
                    <Link href={`/dashboard/my-jobs/${job.id}/applications`} className="w-full sm:w-auto">
                      <Button size="sm" className="w-full sm:w-auto bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
                        <FileText className="h-4 w-4 mr-2" />
                        View Applications
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setJobToDelete(job)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    {/* Finish Job Button */}
                    {job.status !== "completed" && job.job_applications.length > 0 && job.job_applications.filter(app => app.status === "accepted").length > 0 && job.job_applications.filter(app => app.status === "accepted").every(app => app.provider_marked_done) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={async () => {
                          // Mark job as completed
                          await supabase.from("jobs").update({ status: "completed" }).eq("id", job.id)
                          // Add providers to providers_worked_with
                          const acceptedProviders = job.job_applications.filter(app => app.status === "accepted")
                          console.log("Accepted Providers:", acceptedProviders)
                          for (const app of acceptedProviders) {
                            await supabase.from("providers_worked_with").upsert({
                              client_id: user?.id,
                              provider_id: app.profiles?.id || app.provider_id,
                              job_id: job.id,
                              created_at: new Date().toISOString()
                            }, { onConflict: "client_id,provider_id,job_id" })
                          }
                          // Optionally, refresh jobs
                          fetchJobsAndApplications()
                        }}
                      >
                        Finish Job
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="h-5 w-5" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading applications...</p>}
            {!loading && recentApplications.length === 0 && (
              <p className="text-muted-foreground">No recent applications to display.</p>
            )}
            <div className="space-y-3">
              {recentApplications.map((app, index) => (
                <div
                  key={app.id}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border shadow bg-background dark:bg-muted gap-2`}
                >
                  <div className="space-y-1">
                    <p className="font-semibold leading-none">
                      {app.profiles?.name || "Anonymous"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      applied for {" "}
                      <span className="font-medium text-primary">{app.jobTitle}</span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right space-y-1 w-full sm:w-auto">
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <Link href={`/dashboard/my-jobs/${app.jobId}/applications`}>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

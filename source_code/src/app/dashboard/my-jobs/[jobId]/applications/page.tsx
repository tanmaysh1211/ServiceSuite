"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Job, type JobApplication, type UserProfile } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  User,
  FileText,
  Check,
  X,
  Eye
} from "lucide-react"
import { AuthGuard } from "@/components/auth-gaurd"
import Link from "next/link"
import { toast } from "sonner"
import { sendApplicationAcceptedEmail } from "@/actions/email-actions"

interface ApplicationWithProvider extends JobApplication {
  profiles: UserProfile | null
}

interface JobWithApplications extends Job {
  job_applications: ApplicationWithProvider[]
}

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'accepted':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    case 'pending':
    default:
      return 'default';
  }
};

function ViewApplicationsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string
  
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<ApplicationWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchJobAndApplications = useCallback(async () => {
    if (!user || !jobId) return
    setLoading(true)
    setError("")

    // Fetch job details
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("client_id", user.id)
      .single()

    if (jobError || !jobData) {
      setError("Failed to load job details or you do not own this job.")
      setLoading(false)
      return
    }
    setJob(jobData)

    // Fetch applications with provider profiles
    const { data: appData, error: appError } = await supabase
      .from("job_applications")
      .select(`
        *,
        profiles (*)
      `)
      .eq("job_id", jobId)
    
    if (appError) {
      setError("Failed to load applications.")
    } else {
      setApplications(appData as ApplicationWithProvider[])
    }

    setLoading(false)
  }, [jobId, user])

  useEffect(() => {
    fetchJobAndApplications()
  }, [fetchJobAndApplications])

  const handleUpdateStatus = async (applicationId: string, status: "accepted" | "rejected") => {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", applicationId)
        .select(`
          id,
          status,
          provider:profiles (id, email, name),
          job:jobs (id, title, client:profiles (id, name))
        `)
        .single<any>();

      if (error) throw error;

      if (data) {
        setApplications(
          applications.map((app) => (app.id === applicationId ? { ...app, ...data } : app))
        );
        toast.success(`Application ${status === 'accepted' ? 'Accepted' : 'Rejected'}`, {
          description: "The provider has been notified.",
        });

        // Send email notification if accepted
        if (status === 'accepted' && data.provider?.email) {
          await sendApplicationAcceptedEmail(
            data.provider.email,
            data.provider.name || "Freelancer",
            data.job?.title || "a job",
            data.job?.client?.name || "The Client",
            `/dashboard/my-applications`
          );
        }
      }
    } catch (error: any) {
      toast.error("Error Updating Status", {
        description: `Failed to update application status: ${error.message}`,
      });
      // Revert the UI change if the update fails
      fetchJobAndApplications();
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading applications...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Applications for {job?.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Review and manage applications for your job posting.
          </p>
        </div>

        <div className="space-y-6">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-6xl mb-4">📂</div>
              <p className="text-muted-foreground text-lg">No applications received yet.</p>
            </div>
          ) : (
            applications.map((app) => (
              <Card
                key={app.id}
                className="group hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    {/* Left: Applicant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate">
                          {app.profiles?.name || 'Anonymous Provider'}
                        </h3>
                        <Badge 
                          variant={getStatusBadgeVariant(app.status)} 
                          className={
                            app.status === 'accepted'
                              ? 'capitalize bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0'
                              : app.status === 'rejected'
                              ? 'capitalize bg-red-100 text-white-800 dark:bg-red-900 dark:text-red-200 border-0'
                              : 'capitalize'
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line break-words line-clamp-3">
                        {app.proposal}
                      </p>
                    </div>

                    {/* Right: Offer + Buttons */}
                    <div className="flex flex-col gap-2 sm:items-end sm:text-right w-full sm:w-auto">
                      <div className="text-lg font-semibold text-green-600">${app.proposed_rate}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{app.estimated_duration}</div>

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-2 flex-wrap w-full sm:w-auto">
                        <Link href={`/portfolio/${app.provider_id}`} target="_blank" className="w-full sm:w-auto">
                          <Button variant="outline" className="w-full sm:w-auto">
                            <Eye className="h-4 w-4 mr-2" />
                            Portfolio
                          </Button>
                        </Link>

                        {app.status === 'pending' && (
                          <>
                            <Button
                              variant="destructive"
                              className="w-full sm:w-auto"
                              onClick={() => handleUpdateStatus(app.id, 'rejected')}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              className="w-full sm:w-auto"
                              onClick={() => handleUpdateStatus(app.id, 'accepted')}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function ViewApplicationsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ViewApplicationsContent />
    </AuthGuard>
  )
} 
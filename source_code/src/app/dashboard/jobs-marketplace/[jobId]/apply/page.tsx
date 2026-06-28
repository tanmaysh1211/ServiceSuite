"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Job, type JobApplicationFormData } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthGuard } from "@/components/auth-gaurd"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  MapPin, 
  Award, 
  ArrowLeft, 
  CheckCircle,
  User,
  Calendar,
  Send,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { sendApplicationConfirmationEmail, sendNewApplicationAlertEmail } from "@/actions/email-actions"

interface JobWithClient extends Job {
  client_name: string
  client_email: string
}

function ApplyJobContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string
  
  const [job, setJob] = useState<JobWithClient | null>(null)
  const [form, setForm] = useState<JobApplicationFormData>({
    job_id: jobId,
    provider_id: user?.id || "",
    proposal: "",
    proposed_rate: undefined,
    estimated_duration: "",
    status: "pending"
  })
  const [loading, setLoading] = useState(false)
  const [jobLoading, setJobLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    proposal: "",
    proposed_rate: "",
    estimated_duration: "",
  })

  // Redirect clients to dashboard
  useEffect(() => {
    if (userProfile && userProfile.role === "client") {
      router.push("/dashboard")
    }
  }, [userProfile, router])

  // Fetch job details
  useEffect(() => {
    if (!jobId) return

    const fetchJob = async () => {
      setJobLoading(true)
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
        .eq("status", "open")
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          setError("Job not found or no longer available.")
        } else {
          setError("Failed to load job details.")
        }
        setJob(null)
      } else {
        const transformed = {
          ...data,
          client_name: data.profiles?.name || "Unknown Client",
          client_email: data.profiles?.email || ""
        }
        setJob(transformed)
      }
      setJobLoading(false)
    }

    fetchJob()
  }, [jobId])

  // Check if provider has already applied
  useEffect(() => {
    if (!user?.id || !jobId) return

    const checkExistingApplication = async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("provider_id", user.id)
        .single()
      
      if (data) {
        setError("You have already applied to this job.")
      }
    }

    checkExistingApplication()
  }, [user?.id, jobId])

  const handleChange = (e: any) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? undefined : Number(value)) : value,
    }))
  }

  const validateForm = () => {
    const errors: any = {}
    if (!form.proposal?.trim()) {
      errors.proposal = "Proposal is required."
    }
    if (form.proposal && form.proposal.length < 50) {
      errors.proposal = "Proposal must be at least 50 characters long."
    }
    if (form.proposed_rate !== undefined && form.proposed_rate !== null && Number(form.proposed_rate) < 0) {
      errors.proposed_rate = "Proposed rate must be 0 or greater."
    }
    if (!form.estimated_duration?.trim()) {
      errors.estimated_duration = "Estimated duration is required."
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    if (!validateForm()) return
    setLoading(true)

    try {
      const { data: applicationData, error: applicationError } = await supabase
        .from("job_applications")
        .insert([
          {
            job_id: job?.id,
            provider_id: user?.id || "",
            proposal: form.proposal,
            proposed_rate: form.proposed_rate,
            estimated_duration: form.estimated_duration,
            status: "pending",
          },
        ])
        .select()

      if (applicationError) throw applicationError

      // Send emails
      if (applicationData) {
        // Email to provider
        if (user?.email) {
          await sendApplicationConfirmationEmail(
            user.email,
            user.user_metadata.name || "Freelancer",
            job?.title || "",
            `/dashboard/my-applications`
          )
        }

        // Email to client
        if (job?.client_id) {
            const { data: clientData, error: clientError } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('id', job.client_id)
              .single()

            if (clientError) {
              console.error("Error fetching client email:", clientError)
            } else if (clientData?.email) {
              await sendNewApplicationAlertEmail(
                clientData.email,
                clientData.name || "Client",
                job?.title || "",
                user?.user_metadata?.name || "a freelancer",
                `/dashboard/my-jobs/${job?.id}/applications`
              )
            }
        }
      }

      toast.success("Application Sent!", {
        description: "Your proposal has been successfully submitted.",
      })

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
      toast.error("Submission Failed", {
        description: err.message,
      })
    }
    setLoading(false)
  }

  if (userProfile?.role === "client") {
    return null
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error.includes("already applied") ? "Already Applied" : "Job Not Found"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {error}
            </p>
            <Button
              onClick={() => router.push("/dashboard/jobs-marketplace")}
              className="bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/jobs-marketplace")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Apply for Job
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Submit your proposal to get hired for this project
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-gray-800 sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {job?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {job?.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{job?.client_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{job?.category}</span>
                  </div>

                  {job?.budget_min && job?.budget_max && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">
                        ${job.budget_min} - ${job.budget_max} {job.budget_type}
                      </span>
                    </div>
                  )}

                  {job?.project_duration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{job.project_duration}</span>
                    </div>
                  )}

                  {job?.location_preference && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white capitalize">{job.location_preference}</span>
                    </div>
                  )}

                  {job?.experience_level && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white capitalize">{job.experience_level}</span>
                    </div>
                  )}
                </div>

                {job?.skills_required && job.skills_required.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Posted</span>
                    <span className="text-gray-900 dark:text-white">
                      {job?.created_at ? new Date(job.created_at).toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500">Applications</span>
                    <span className="text-gray-900 dark:text-white">{job?.applications_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-indigo-600" />
                  Your Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                {success ? (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="text-center sm:text-left mt-2 mb-4 font-medium text-green-800 dark:text-green-200">
                        Application submitted successfully!
                      </div>
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => router.push("/dashboard/jobs-marketplace")} 
                          className="w-full sm:w-auto"
                        >
                          Browse More Jobs
                        </Button>
                        <Button 
                          onClick={() => router.push("/dashboard")} 
                          className="w-full sm:w-auto"
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="proposal" className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Your Proposal *
                      </Label>
                      <Textarea
                        id="proposal"
                        name="proposal"
                        value={form.proposal}
                        onChange={handleChange}
                        placeholder="Describe your approach to this project, your relevant experience, and why you're the best fit for this job..."
                        className="mt-1 min-h-[200px]"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Minimum 50 characters. Be specific about your approach and experience.
                      </p>
                      {fieldErrors.proposal && <div className="text-red-500 text-sm mt-1">{fieldErrors.proposal}</div>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="proposed_rate" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Your {job?.budget_type === 'hourly' ? 'Hourly Rate' : 'Proposed Rate'} (USD)
                        </Label>
                        <Input
                          id="proposed_rate"
                          name="proposed_rate"
                          type="number"
                          value={form.proposed_rate ?? ""}
                          onChange={handleChange}
                          min={0}
                          step={0.01}
                          placeholder={job?.budget_type === 'hourly' ? "50" : "1000"}
                          className="mt-1"
                        />
                        {fieldErrors.proposed_rate && <div className="text-red-500 text-sm mt-1">{fieldErrors.proposed_rate}</div>}
                      </div>

                      <div>
                        <Label htmlFor="estimated_duration" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Estimated Duration *
                        </Label>
                        <Input
                          id="estimated_duration"
                          name="estimated_duration"
                          value={form.estimated_duration}
                          onChange={handleChange}
                          placeholder="e.g., 2-3 weeks, 1 month"
                          className="mt-1"
                        />
                        {fieldErrors.estimated_duration && <div className="text-red-500 text-sm mt-1">{fieldErrors.estimated_duration}</div>}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Application Tips
                          </h4>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Be specific about your approach and methodology</li>
                            <li>• Highlight relevant experience and past projects</li>
                            <li>• Explain why you're the best fit for this project</li>
                            <li>• Provide realistic timelines and rates</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loading ? "Submitting..." : "Submit Application"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/jobs-marketplace")}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ApplyJobPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ApplyJobContent />
    </AuthGuard>
  )
} 
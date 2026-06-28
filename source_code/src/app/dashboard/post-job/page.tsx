"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type JobFormData, Job } from "@/lib/supabaseClient"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AuthGuard } from "@/components/auth-gaurd"
import { 
  Briefcase,
  DollarSign,
  Award,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
  X,
  Terminal
} from "lucide-react"
import {
  sendJobPostConfirmationEmail,
  sendApplicationConfirmationEmail,
} from "@/actions/email-actions"
import { updateJob } from "@/actions/ai-actions"
import { toast } from "sonner"

interface PostJobContentProps {
  job?: Job | null
}

function PostJobContent({ job }: PostJobContentProps) {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<JobFormData>({
    title: "",
    description: "",
    category: "",
    budget_min: undefined,
    budget_max: undefined,
    budget_type: "hourly",
    skills_required: [],
    experience_level: "intermediate",
    project_duration: "",
    location_preference: "remote",
    attachments: [],
    status: "open",
    is_featured: false,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [skillsInput, setSkillsInput] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    skills_required: "",
  })
  const [alert, setAlert] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || "",
        description: job.description || "",
        category: job.category || "",
        budget_min: job.budget_min,
        budget_max: job.budget_max,
        budget_type: job.budget_type || "hourly",
        skills_required: job.skills_required || [],
        experience_level: job.experience_level || "intermediate",
        project_duration: job.project_duration || "",
        location_preference: job.location_preference || "remote",
        attachments: job.attachments || [],
        status: job.status || "open",
        is_featured: job.is_featured || false,
      })
      setSkillsInput(job.skills_required.join(", "))
    }
  }, [job])

  const handlePostAnother = () => {
    setForm({
      title: "",
      description: "",
      category: "",
      budget_min: undefined,
      budget_max: undefined,
      budget_type: "hourly",
      skills_required: [],
      experience_level: "intermediate",
      project_duration: "",
      location_preference: "remote",
      attachments: [],
      status: "open",
      is_featured: false,
    })
    setSkillsInput("")
    setSuccess(false)
  }

  // Redirect providers to dashboard
  useEffect(() => {
    if (userProfile && userProfile.role === "provider") {
      router.push("/dashboard")
    }
  }, [userProfile, router])
  
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const validateForm = () => {
    const errors: any = {}
    if (!form.title.trim()) {
      errors.title = "Job title is required."
    }
    if (!form.description?.trim()) {
      errors.description = "Job description is required."
    }
    if (!form.category.trim()) {
      errors.category = "Category is required."
    }
    const skillsArr = skillsInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
    if (skillsArr.length === 0) {
      errors.skills_required = "At least one required skill is needed."
    }
    if (form.budget_min !== undefined && form.budget_min !== null && Number(form.budget_min) < 0) {
      errors.budget_min = "Minimum budget must be 0 or greater."
    }
    if (form.budget_max !== undefined && form.budget_max !== null && Number(form.budget_max) < 0) {
      errors.budget_max = "Maximum budget must be 0 or greater."
    }
    if (form.budget_min && form.budget_max && Number(form.budget_min) > Number(form.budget_max)) {
      errors.budget_max = "Maximum budget must be greater than minimum budget."
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!user) {
      setAlert({ type: 'error', message: 'You must be logged in to post a job.' })
      return
    }
    setError("")
    setSuccess(false)
    if (!validateForm()) return
    setLoading(true)
    setAlert(null)

    const formToSave = {
      ...form,
      skills_required: skillsInput
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }

    try {
      if (job) {
        // Update existing job
        const result = await updateJob(job.id, user.id, formToSave)
        if (!result.success) {
          throw new Error(result.message)
        }
        toast.success("Job updated successfully!")
        router.push(`/dashboard/my-jobs/${job.id}/applications`)
      } else {
        // Create new job
        const { data, error } = await supabase
          .from("jobs")
          .insert([{ ...formToSave, client_id: user?.id }])
          .select("id")

        if (error) throw error
        setSuccess(true)

        // Send confirmation email
        if (user?.email && data?.[0]) {
          await sendJobPostConfirmationEmail(
            user.email,
            userProfile?.name || "Valued Client",
            form.title,
            `/dashboard/my-jobs/${data[0].id}`
          )
        }
      }
    } catch (err: any) {
      setError(err.message)
      toast.error("An error occurred", { description: err.message })
    }
    setLoading(false)
  }

  if (userProfile?.role === "provider") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {job ? "Edit Job" : "Post a New Job"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {job
              ? "Update the details of your job posting."
              : "Create a detailed job posting to attract talented providers"}
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="text-center sm:text-left mt-2 mb-4 font-medium text-green-800 dark:text-green-200">
                    Job posted successfully!
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePostAnother}
                      className="w-full sm:w-auto"
                    >
                      Post Another Job
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="w-full sm:w-auto"
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {alert && (
                  <Alert
                    variant={alert.type === "error" ? "destructive" : "default"}
                  >
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>
                      {alert.type === "success" ? "Success" : "Error"}
                    </AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="title"
                        className="flex items-center gap-2"
                      >
                        <Briefcase className="h-4 w-4" />
                        Job Title *
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="e.g., Full-Stack Developer Needed"
                        className="mt-1"
                      />
                      {fieldErrors.title && (
                        <div className="text-red-500 text-sm mt-1">
                          {fieldErrors.title}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="category"
                        className="flex items-center gap-2"
                      >
                        <Briefcase className="h-4 w-4" />
                        Category *
                      </Label>
                      <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                      >
                        <option value="">Select a category</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Development">
                          Mobile Development
                        </option>
                        <option value="UI/UX Design">UI/UX Design</option>
                        <option value="Graphic Design">Graphic Design</option>
                        <option value="Content Writing">Content Writing</option>
                        <option value="Digital Marketing">
                          Digital Marketing
                        </option>
                        <option value="Data Science">Data Science</option>
                        <option value="Video Editing">Video Editing</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.category && (
                        <div className="text-red-500 text-sm mt-1">
                          {fieldErrors.category}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="description"
                      className="flex items-center gap-2"
                    >
                      <Briefcase className="h-4 w-4" />
                      Job Description *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe the project requirements, deliverables, and any specific details..."
                      className="mt-1 min-h-[120px]"
                    />
                    {fieldErrors.description && (
                      <div className="text-red-500 text-sm mt-1">
                        {fieldErrors.description}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="skills_required"
                      className="flex items-center gap-2"
                    >
                      <Award className="h-4 w-4" />
                      Required Skills *
                    </Label>
                    <Input
                      id="skills_required"
                      name="skills_required"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g., React, Node.js, Python, Design, Marketing"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Separate skills with commas
                    </p>
                    {fieldErrors.skills_required && (
                      <div className="text-red-500 text-sm mt-1">
                        {fieldErrors.skills_required}
                      </div>
                    )}
                  </div>

                  {/* Budget Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label
                        htmlFor="budget_type"
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Budget Type
                      </Label>
                      <select
                        id="budget_type"
                        name="budget_type"
                        value={form.budget_type}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                      >
                        <option value="hourly">Hourly Rate</option>
                        <option value="fixed">Fixed Price</option>
                        <option value="range">Budget Range</option>
                      </select>
                    </div>

                    <div>
                      <Label
                        htmlFor="budget_min"
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        {form.budget_type === "hourly"
                          ? "Min Hourly Rate"
                          : "Min Budget"}
                      </Label>
                      <Input
                        id="budget_min"
                        name="budget_min"
                        type="number"
                        value={form.budget_min ?? ""}
                        onChange={handleChange}
                        min={0}
                        placeholder="50"
                        className="mt-1"
                      />
                      {fieldErrors.budget_min && (
                        <div className="text-red-500 text-sm mt-1">
                          {fieldErrors.budget_min}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="budget_max"
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        {form.budget_type === "hourly"
                          ? "Max Hourly Rate"
                          : "Max Budget"}
                      </Label>
                      <Input
                        id="budget_max"
                        name="budget_max"
                        type="number"
                        value={form.budget_max ?? ""}
                        onChange={handleChange}
                        min={0}
                        placeholder="100"
                        className="mt-1"
                      />
                      {fieldErrors.budget_max && (
                        <div className="text-red-500 text-sm mt-1">
                          {fieldErrors.budget_max}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label
                        htmlFor="experience_level"
                        className="flex items-center gap-2"
                      >
                        <Award className="h-4 w-4" />
                        Experience Level
                      </Label>
                      <select
                        id="experience_level"
                        name="experience_level"
                        value={form.experience_level}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <Label
                        htmlFor="project_duration"
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Project Duration
                      </Label>
                      <Input
                        id="project_duration"
                        name="project_duration"
                        value={form.project_duration}
                        onChange={handleChange}
                        placeholder="e.g., 2-4 weeks"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="location_preference"
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Location Preference
                      </Label>
                      <select
                        id="location_preference"
                        name="location_preference"
                        value={form.location_preference}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                      >
                        <option value="remote">Remote</option>
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                    >
                      {loading
                        ? job
                          ? "Updating..."
                          : "Posting..."
                        : job
                        ? "Update Job"
                        : "Post Job"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PostJobPage({ job }: PostJobContentProps) {
  return (
    <AuthGuard>
      <PostJobContent job={job} />
    </AuthGuard>
  )
} 
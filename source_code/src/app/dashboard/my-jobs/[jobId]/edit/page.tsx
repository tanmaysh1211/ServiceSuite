"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Job } from "@/lib/supabaseClient"
import PostJobContent from "../../../post-job/page"
import { AuthGuard } from "@/components/auth-gaurd"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

function EditJobPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!jobId || !user) return

    const fetchJob = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("client_id", user.id)
        .single()

      if (error || !data) {
        setError("Job not found or you don't have permission to edit it.")
        setJob(null)
      } else {
        setJob(data)
      }
      setLoading(false)
    }

    fetchJob()
  }, [jobId, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return <PostJobContent job={job} />
}

export default function GuardedEditJobPage() {
  return (
    <AuthGuard requireAuth={true}>
      <EditJobPage />
    </AuthGuard>
  )
} 
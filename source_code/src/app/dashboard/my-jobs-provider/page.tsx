"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type JobApplication } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, DollarSign, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ApplicationWithJob extends JobApplication {
  jobs: {
    id: string
    title: string
    client_id: string
    profiles: { name: string } | null
  } | null
}

export default function MyJobsProviderPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return
    const fetchApplications = async () => {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from("job_applications")
        .select(`*, jobs:jobs (*, profiles (name))`)
        .eq("provider_id", user.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
      if (error) {
        setError("Failed to load your jobs.")
        setApplications([])
      } else {
        setApplications(data as ApplicationWithJob[])
      }
      setLoading(false)
    }
    fetchApplications()
  }, [user])

  const handleMarkDone = async (applicationId: string) => {
    await supabase
      .from("job_applications")
      .update({ provider_marked_done: true })
      .eq("id", applicationId)
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, provider_marked_done: true } : app
      )
    )
  }

  if (userProfile?.role === "client") return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">My Jobs (Provider)</h1>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && applications.length === 0 && (
          <div className="text-muted-foreground">No accepted jobs yet.</div>
        )}
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">{app.jobs?.title || "Job Title"}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <Badge>{app.jobs?.profiles?.name || "Client"}</Badge>
                  <span>Accepted on {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {app.proposed_rate && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4" />${app.proposed_rate}
                    </span>
                  )}
                  {app.estimated_duration && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-4 w-4" />{app.estimated_duration}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                {app.provider_marked_done ? (
                  <Badge variant="secondary">Marked as Done</Badge>
                ) : (
                  <Button onClick={() => handleMarkDone(app.id)}>
                    Payment Received
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 
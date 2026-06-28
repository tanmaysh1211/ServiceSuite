"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type JobApplication } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Briefcase,
  Clock,
  DollarSign,
  Eye,
  Calendar
} from "lucide-react"
import { AuthGuard } from "@/components/auth-gaurd"
import Link from "next/link"

interface ApplicationWithDetails extends JobApplication {
  jobs: {
    id: string
    title: string
    profiles: {
      name: string
    } | null
  } | null
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

function MyApplicationsContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (userProfile && userProfile.role === "client") {
      router.push("/dashboard")
    }
  }, [userProfile, router])

  useEffect(() => {
    if (!user) return

    const fetchApplications = async () => {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs (
            id,
            title,
            profiles (
              name
            )
          )
        `)
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setError("Failed to load your applications.")
        setApplications([])
      } else {
        setApplications(data as ApplicationWithDetails[])
      }

      setLoading(false)
    }

    fetchApplications()
  }, [user])

  if (userProfile?.role === "client") {
    return null
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
            My Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track the status of all your job applications
          </p>
        </div>

        <div className="space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your applications...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && applications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-6xl mb-4">📂</div>
              <p className="text-muted-foreground text-lg">You haven't applied to any jobs yet.</p>
              <Button onClick={() => router.push('/dashboard/jobs-marketplace')} className="mt-4">
                <Briefcase className="h-4 w-4 mr-2" />
                Find Jobs
              </Button>
            </div>
          )}

          {!loading && !error && applications.map((app) => (
              <Card
                key={app.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white dark:bg-gray-800"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors duration-300">
                          {app.jobs?.title || "Job Title Not Available"}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(app.status)} className="capitalize">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Client: <span className="font-medium text-gray-700 dark:text-gray-300">{app.jobs?.profiles?.name || 'N/A'}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Your Proposal:</span> {app.proposal}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end sm:text-right gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4"/>
                            Applied on {new Date(app.created_at).toLocaleDateString()}
                        </div>
                        {app.proposed_rate && (
                            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                                <DollarSign className="h-4 w-4"/>
                                ${app.proposed_rate}
                            </div>
                        )}
                        {app.estimated_duration && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4"/>
                                {app.estimated_duration}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-stretch mt-4 sm:mt-0">
                        <Link href={`/dashboard/jobs-marketplace/${app.job_id}`}>
                            <Button variant="outline" className="w-full">
                                <Eye className="h-4 w-4 mr-2"/>
                                View Job
                            </Button>
                        </Link>
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

export default function MyApplicationsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <MyApplicationsContent />
    </AuthGuard>
  )
} 
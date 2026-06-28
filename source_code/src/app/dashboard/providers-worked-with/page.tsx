"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

interface ProviderWorkedWith {
  id: string
  client_id: string
  provider_id: string
  job_id: string
  created_at: string
  provider_profile?: { name: string }
  job?: { title: string }
  review?: { id: string, rating: number, review_text: string }
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

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

export default function ProvidersWorkedWithPage() {
  const { user, userProfile } = useAuth()
  const [providers, setProviders] = useState<ProviderWorkedWith[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reviewInputs, setReviewInputs] = useState<{ [id: string]: { rating: number, review_text: string } }>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchProviders = async () => {
      setLoading(true)
      setError("")
      // const { data, error } = await supabase
      //   .from("providers_worked_with")
      //   .select(`*, provider_profile:profiles!providers_worked_with_provider_id_fkey(name), 
      //     job:jobs!providers_worked_with_job_id_fkey(title)`)
      //   .eq("client_id", user.id)
      //   .order("created_at", { ascending: false })
      const { data, error } = await supabase
      .from("providers_worked_with")
      .select("*")
      .eq("client_id", user.id)

    console.log("DATA =", data)
    console.log("ERROR =", error)
      if (error) {
        setError("Failed to load providers.")
        setProviders([])
        setLoading(false)
        return
      }
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, provider_id, job_id, rating, review_text")
        .eq("client_id", user.id)
      const providersWithReview = (data as ProviderWorkedWith[]).map((provider) => {
        const review = (reviewsData || []).find(
          (r: any) => r.provider_id === provider.provider_id && r.job_id === provider.job_id
        )
        return { ...provider, review }
      })
      setProviders(providersWithReview)
      setLoading(false)
    }
    fetchProviders()
  }, [user, submitting])

  const handleReviewChange = (id: string, field: "rating" | "review_text", value: any) => {
    setReviewInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  const handleSubmitReview = async (provider: ProviderWorkedWith) => {
    setSubmitting(provider.id)
    const input = reviewInputs[provider.id]
    if (!input || !input.rating) return
    await supabase.from("reviews").insert({
      client_id: provider.client_id,
      provider_id: provider.provider_id,
      job_id: provider.job_id,
      rating: input.rating,
      review_text: input.review_text || "",
      created_at: new Date().toISOString()
    })
    setSubmitting(null)
  }

  if (userProfile?.role === "provider") return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Providers Worked With</h1>
        </div>

        {loading && <div className="text-center text-muted-foreground">Loading providers...</div>}
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {!loading && providers.length === 0 && (
          <div className="text-muted-foreground text-center">You haven't worked with any providers yet.</div>
        )}

        <div className="space-y-6">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg border-0 bg-white dark:bg-gray-800 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${getGradientColors(
                    provider.provider_profile?.name || "Provider"
                  )} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                >
                  {getInitials(provider.provider_profile?.name || "P")}
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                    {provider.provider_profile?.name || "Provider"}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-0">
                      {provider.job?.title || "Job"}
                    </Badge>
                    <span className="text-xs">Worked on {new Date(provider.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 mt-4 md:mt-0">
                {provider.review ? (
                  <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-600">Reviewed</Badge>
                ) : (
                  <form onSubmit={e => { e.preventDefault(); handleSubmitReview(provider) }} className="space-y-2">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="Rating (1–5)"
                      value={reviewInputs[provider.id]?.rating || ""}
                      onChange={e => handleReviewChange(provider.id, "rating", Number(e.target.value))}
                      required
                    />
                    <Textarea
                      placeholder="Write a review (optional)"
                      value={reviewInputs[provider.id]?.review_text || ""}
                      onChange={e => handleReviewChange(provider.id, "review_text", e.target.value)}
                      className="min-h-[60px]"
                    />
                    <Button type="submit" disabled={submitting === provider.id} className="w-full">
                      {submitting === provider.id ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

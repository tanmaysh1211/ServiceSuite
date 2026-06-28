"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Portfolio } from "@/lib/supabaseClient"
import {
  Search,
  Star,
  MapPin,
  Clock,
  Eye,
  DollarSign,
  Award,
  CheckCircle,
  ArrowLeft
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-gaurd"

interface PortfolioWithProvider extends Portfolio {
  provider_name: string
  provider_email: string
  avg_rating?: number
  reviews_count: number
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

function FreelancersContent() {
  const [portfolios, setPortfolios] = useState<PortfolioWithProvider[]>([])
  const [filteredPortfolios, setFilteredPortfolios] = useState<PortfolioWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const { userProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect providers to their dashboard
    if (userProfile && userProfile.role === "provider") {
      router.push("/dashboard")
    }
  }, [userProfile, router])

  useEffect(() => {
    const fetchPortfoliosAndReviews = async () => {
      setLoading(true)
      setError("")

      // Fetch portfolios (without reviews join)
      const { data: portfoliosData, error: portfoliosError } = await supabase
        .from("portfolios")
        .select(`*, profiles!portfolios_provider_id_fkey ( name, email )`)
        .eq("is_available", true)
        .eq("is_verified", true)
        .order("created_at", { ascending: false })

      // Fetch all reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("provider_id, rating")

      if (portfoliosError || reviewsError) {
        setError("Failed to load portfolios.")
        setPortfolios([])
        setFilteredPortfolios([])
      } else {
        const transformed = (portfoliosData || []).map((portfolio: any) => {
          const providerReviews = (reviewsData || []).filter((r: any) => r.provider_id === portfolio.provider_id)
          const ratings = providerReviews.map((r: any) => r.rating)
          const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : 0
          return {
            ...portfolio,
            provider_name: portfolio.profiles?.name || "Unknown Provider",
            provider_email: portfolio.profiles?.email || "",
            avg_rating: avgRating,
            reviews_count: ratings.length
          }
        })
        setPortfolios(transformed)
        setFilteredPortfolios(transformed)
      }

      setLoading(false)
    }

    fetchPortfoliosAndReviews()
  }, [])

  // Search/filter logic
  useEffect(() => {
    if (!search.trim()) {
      setFilteredPortfolios(portfolios)
      return
    }
    const q = search.toLowerCase()
    setFilteredPortfolios(
      portfolios.filter((p) =>
        p.provider_name.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        (Array.isArray(p.skills) && p.skills.some((s: string) => s.toLowerCase().includes(q)))
      )
    )
  }, [search, portfolios])

  if (userProfile?.role === "provider") {
    return null;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Find Service Providers
                </h1>
                <p className="text-muted-foreground mt-2">
                    Discover talented freelancers and creators for your projects
                </p>
            </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="p-6">
          <form className="flex gap-4" onSubmit={e => { e.preventDefault(); }}>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search for services, skills, or providers..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 shadow-sm transition-all duration-200"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  ×
                </button>
              )}
            </div>
            <Button variant="outline" className="px-6 py-3 rounded-xl border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105" type="button" disabled>
              Filters
            </Button>
            <Button className="bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 px-6 py-3 rounded-xl shadow-lg transition-all duration-300" type="submit">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Portfolios */}
      <div className="grid gap-6">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading portfolios...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && filteredPortfolios.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-6xl mb-4">🔍</div>
            <p className="text-muted-foreground text-lg">No portfolios found.</p>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredPortfolios.map((portfolio) => (
            <Card
              key={portfolio.id}
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden bg-white dark:bg-gray-800 hover:scale-[1.02]"
            >
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Left Section */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${getGradientColors(
                          portfolio.provider_name
                        )} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 group-hover:scale-105`}
                      >
                        {getInitials(portfolio.provider_name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors duration-300">
                            {portfolio.provider_name}
                          </h3>
                          {portfolio.is_verified && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-lg text-indigo-600 dark:text-indigo-400 mb-2">
                          {portfolio.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-1 leading-relaxed">
                          {portfolio.bio}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-4 text-sm">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-semibold">
                          {portfolio.avg_rating?.toFixed(1) ?? "-"}
                        </span>
                        <span className="text-gray-500">
                          ({portfolio.reviews_count} reviews)
                        </span>
                      </div>
                      {portfolio.location && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {portfolio.location}
                        </div>
                      )}
                      {portfolio.availability && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          {portfolio.availability}
                        </div>
                      )}
                      {portfolio.experience_years && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Award className="h-4 w-4" />
                          {portfolio.experience_years} years exp.
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {portfolio.skills.slice(0, 5).map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-0 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {portfolio.skills.length > 5 && (
                        <Badge
                          variant="outline"
                          className="text-gray-500 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:scale-105"
                        >
                          +{portfolio.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="lg:w-64 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-l border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <p className="text-3xl font-bold text-green-600">
                          ${portfolio.hourly_rate ?? "0"}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">per hour</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link href={`/portfolio/${portfolio.provider_id}`}>
                        <Button className="w-full bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg rounded-xl py-3 transition-all duration-300">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Portfolio
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl py-3 font-semibold transition-all duration-300 hover:scale-105"
                      >
                        Contact Now
                      </Button>
                    </div>

                    {portfolio.education && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Education</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {portfolio.education}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}

export default function FreelancersPage() {
    return (
        <AuthGuard requireAuth={true}>
            <FreelancersContent />
        </AuthGuard>
    )
} 
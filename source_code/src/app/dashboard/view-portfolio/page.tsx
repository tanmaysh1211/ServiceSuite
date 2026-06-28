"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Portfolio } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Award, 
  CheckCircle, 
  ArrowLeft, 
  Edit,
  MessageCircle,
  GraduationCap,
  Link as LinkIcon,
  Calendar,
  User,
  ExternalLink
} from "lucide-react"
import { AuthGuard } from "@/components/auth-gaurd"

interface PortfolioWithProvider extends Portfolio {
  provider_name: string
  provider_email: string
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

function ViewPortfolioContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<PortfolioWithProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewsCount, setReviewsCount] = useState<number>(0)

  useEffect(() => {
    // Redirect clients to dashboard
    if (userProfile && userProfile.role === "client") {
      router.push("/dashboard")
      return
    }

    if (!user) return

    const fetchPortfolioAndReviews = async () => {
      setLoading(true)
      setError("")
      // Fetch portfolio
      const { data, error } = await supabase
        .from("portfolios")
        .select(`*, profiles!portfolios_provider_id_fkey ( name, email )`)
        .eq("provider_id", user.id)
        .single()
      if (error) {
        if (error.code === 'PGRST116') {
          setError("You haven't created a portfolio yet.")
        } else {
          setError("Failed to load portfolio.")
        }
        setPortfolio(null)
        setAvgRating(null)
        setReviewsCount(0)
      } else {
        const transformed = {
          ...data,
          provider_name: data.profiles?.name || "Unknown Provider",
          provider_email: data.profiles?.email || ""
        }
        setPortfolio(transformed)
        // Fetch reviews for this provider
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("rating")
          .eq("provider_id", user.id)
        if (reviewsError) {
          setAvgRating(null)
          setReviewsCount(0)
        } else {
          const ratings = (reviewsData || []).map((r: any) => r.rating)
          setReviewsCount(ratings.length)
          setAvgRating(ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null)
        }
      }
      setLoading(false)
    }

    fetchPortfolioAndReviews()
  }, [user, userProfile, router])

  if (userProfile?.role === "client") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Your Public Profile
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                This is exactly how clients see your portfolio
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/dashboard/portfolio")}
            className="bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg transition-all duration-300 w-full sm:w-auto"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Portfolio
          </Button>
        </div>

        {/* Portfolio Display */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your portfolio...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error.includes("haven't created") ? "No Portfolio Found" : "Error Loading Portfolio"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {error.includes("haven't created") 
                ? "You haven't created your portfolio yet. Create one to start attracting clients!"
                : error
              }
            </p>
            <Button
              onClick={() => router.push("/dashboard/portfolio")}
              className="bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg transition-all duration-300"
            >
              <Edit className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </div>
        )}

        {!loading && !error && portfolio && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 w-full">
              {/* Profile Overview */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 w-full">
                <CardContent className="p-4 sm:p-6 w-full">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 w-full">
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${getGradientColors(
                        portfolio.provider_name
                      )} rounded-3xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg`}
                    >
                      {getInitials(portfolio.provider_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {portfolio.provider_name}
                        </h2>
                        {portfolio.is_verified && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                        {portfolio.title}
                      </h3>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-yellow-600">
                            {avgRating !== null ? avgRating.toFixed(1) : "-"}
                          </span>
                          <span>({reviewsCount} reviews)</span>
                        </div>
                        {portfolio.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {portfolio.location}
                          </div>
                        )}
                        {portfolio.availability && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {portfolio.availability}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full Bio */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                      About Me
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {portfolio.bio}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                      Skills & Expertise
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.skills.map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-0 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience & Education */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {portfolio.experience_years && (
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Award className="h-5 w-5 text-indigo-600" />
                          Experience
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {portfolio.experience_years} years of professional experience
                        </p>
                      </div>
                    )}
                    
                    {portfolio.education && (
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-indigo-600" />
                          Education
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {portfolio.education}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Certifications */}
                  {portfolio.certifications && portfolio.certifications.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                        Certifications
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {portfolio.certifications.map((cert, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
                          >
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Links */}
                  {portfolio.portfolio_links && portfolio.portfolio_links.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-indigo-600" />
                        Portfolio Links
                      </h4>
                      <div className="space-y-2">
                        {portfolio.portfolio_links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 w-full">
              {/* Pricing Card */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-4xl font-bold text-green-600">
                        ${portfolio.hourly_rate ?? "0"}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">per hour</p>
                  </div>
                  <Button 
                    onClick={() => router.push("/dashboard/portfolio")}
                    className="w-full bg-gradient-to-r from-indigo-700 to-purple-800 hover:shadow-2xl hover:brightness-105 shadow-lg transition-all duration-300"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Portfolio
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-900 dark:text-white">{portfolio.provider_email}</span>
                  </div>
                  {portfolio.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{portfolio.location}</span>
                    </div>
                  )}
                  {portfolio.availability && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{portfolio.availability}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Usually responds within a few hours
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ViewPortfolioPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ViewPortfolioContent />
    </AuthGuard>
  )
} 
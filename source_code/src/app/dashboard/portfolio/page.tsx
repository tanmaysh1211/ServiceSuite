"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type PortfolioFormData } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthGuard } from "@/components/auth-gaurd"
import { User, MapPin, DollarSign, Clock, GraduationCap, Award, LinkIcon, CheckCircle } from "lucide-react"
import ProfileCompletenessMeter from "@/components/profile-completeness-meter"

function PortfolioContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<PortfolioFormData>({
    title: "",
    bio: "",
    skills: [],
    location: "",
    hourly_rate: undefined,
    availability: "",
    experience_years: undefined,
    education: "",
    certifications: [],
    portfolio_links: [],
    profile_image_url: "",
    is_verified: false,
    is_available: true,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const [skillsInput, setSkillsInput] = useState("")
  const [certificationsInput, setCertificationsInput] = useState("")
  const [portfolioLinksInput, setPortfolioLinksInput] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    bio: "",
    skills: "",
    hourly_rate: "",
    experience_years: "",
  })

  // Redirect clients to dashboard
  useEffect(() => {
    if (userProfile && userProfile.role === "client") {
      router.push("/dashboard")
    }
  }, [userProfile, router])

  // Fetch existing portfolio if any
  useEffect(() => {
    if (!user) return
    const fetchPortfolio = async () => {
      const { data } = await supabase.from("portfolios").select("*").eq("provider_id", user.id).single()
      if (data) {
        setForm({ ...form, ...data })
        setSkillsInput((data.skills || []).join(", "))
        setCertificationsInput((data.certifications || []).join(", "))
        setPortfolioLinksInput((data.portfolio_links || []).join(", "))
        setEditing(true)
      }
    }
    fetchPortfolio()
    // eslint-disable-next-line
  }, [user])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const errors: any = {}
    if (!form.title.trim()) {
      errors.title = "Title is required."
    }
    if (!form.bio?.trim()) {
      errors.bio = "Bio is required."
    }
    const skillsArr = skillsInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
    if (skillsArr.length === 0) {
      errors.skills = "At least one skill is required."
    }
    if (form.hourly_rate !== undefined && form.hourly_rate !== null && Number(form.hourly_rate) < 0) {
      errors.hourly_rate = "Hourly rate must be 0 or greater."
    }
    if (form.experience_years !== undefined && form.experience_years !== null && Number(form.experience_years) < 0) {
      errors.experience_years = "Experience years must be 0 or greater."
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

    const formToSave = {
      ...form,
      skills: skillsInput
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      certifications: certificationsInput
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      portfolio_links: portfolioLinksInput
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }

    try {
      let res
      if (editing) {
        res = await supabase
          .from("portfolios")
          .update({ ...formToSave, updated_at: new Date().toISOString() })
          .eq("provider_id", user?.id)
      } else {
        res = await supabase.from("portfolios").insert([{ ...formToSave, provider_id: user?.id }])
      }
      if (res.error) throw res.error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  // Calculate profile completeness
  const calculateCompleteness = () => {
    const fields = [
      form.title,
      form.bio,
      skillsInput,
      form.location,
      form.hourly_rate,
      form.availability,
      form.experience_years,
      form.education,
      certificationsInput,
      portfolioLinksInput,
      form.profile_image_url,
    ]
    const total = fields.length
    const filled = fields.filter((f) => {
      if (Array.isArray(f)) return f.length > 0
      if (typeof f === "number") return f !== undefined && f !== null
      return f && String(f).trim().length > 0
    }).length
    return Math.round((filled / total) * 100)
  }

  if (userProfile?.role === "client") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Completeness Meter */}
        {calculateCompleteness() < 100 && (
          <ProfileCompletenessMeter completeness={calculateCompleteness()} />
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {editing ? "Edit Your Portfolio" : "Create Your Portfolio"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Showcase your skills and experience to attract potential clients
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Professional Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="text-center sm:text-left mt-2 mb-4 font-medium text-green-800 dark:text-green-200">
                    Portfolio saved successfully!
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button variant="outline" onClick={() => setSuccess(false)} className="w-full sm:w-auto">
                      Modify Portfolio
                    </Button>
                    <Button onClick={() => router.push("/dashboard")} className="w-full sm:w-auto">
                      Return to Dashboard
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Professional Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g., Full-Stack Developer, UI/UX Designer"
                      className="mt-1"
                    />
                    {fieldErrors.title && <div className="text-red-500 text-sm mt-1">{fieldErrors.title}</div>}
                  </div>

                  <div>
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g., San Francisco, CA"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Professional Bio *
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={form.bio ?? ""}
                    onChange={handleChange}
                    placeholder="Tell clients about your experience, expertise, and what makes you unique..."
                    className="mt-1 min-h-[120px]"
                  />
                  {fieldErrors.bio && <div className="text-red-500 text-sm mt-1">{fieldErrors.bio}</div>}
                </div>

                <div>
                  <Label htmlFor="skills" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Skills *
                  </Label>
                  <Input
                    id="skills"
                    name="skills"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g., React, Node.js, Python, Design, Marketing"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
                  {fieldErrors.skills && <div className="text-red-500 text-sm mt-1">{fieldErrors.skills}</div>}
                </div>

                {/* Professional Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="hourly_rate" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Hourly Rate (USD)
                    </Label>
                    <Input
                      id="hourly_rate"
                      name="hourly_rate"
                      type="number"
                      value={form.hourly_rate ?? ""}
                      onChange={handleChange}
                      min={0}
                      placeholder="50"
                      className="mt-1"
                    />
                    {fieldErrors.hourly_rate && (
                      <div className="text-red-500 text-sm mt-1">{fieldErrors.hourly_rate}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="experience_years" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Years of Experience
                    </Label>
                    <Input
                      id="experience_years"
                      name="experience_years"
                      type="number"
                      value={form.experience_years ?? ""}
                      onChange={handleChange}
                      min={0}
                      placeholder="3"
                      className="mt-1"
                    />
                    {fieldErrors.experience_years && (
                      <div className="text-red-500 text-sm mt-1">{fieldErrors.experience_years}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="availability" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Availability
                    </Label>
                    <Input
                      id="availability"
                      name="availability"
                      value={form.availability}
                      onChange={handleChange}
                      placeholder="e.g., Available now, Part-time"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="education" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </Label>
                  <Input
                    id="education"
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    placeholder="e.g., BS Computer Science, Stanford University"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="certifications" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications
                  </Label>
                  <Input
                    id="certifications"
                    name="certifications"
                    value={certificationsInput}
                    onChange={(e) => setCertificationsInput(e.target.value)}
                    placeholder="e.g., AWS Certified, Google Analytics, Adobe Certified"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">Separate certifications with commas</p>
                </div>

                <div>
                  <Label htmlFor="portfolio_links" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Portfolio Links
                  </Label>
                  <Input
                    id="portfolio_links"
                    name="portfolio_links"
                    value={portfolioLinksInput}
                    onChange={(e) => setPortfolioLinksInput(e.target.value)}
                    placeholder="e.g., https://myportfolio.com, https://github.com/username"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">Separate links with commas</p>
                </div>

                <div>
                  <Label htmlFor="profile_image_url" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile Image URL
                  </Label>
                  <Input
                    id="profile_image_url"
                    name="profile_image_url"
                    value={form.profile_image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/your-photo.jpg"
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? "Saving..." : editing ? "Update Portfolio" : "Create Portfolio"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="w-full sm:w-auto"
                  >
                    Return to Dashboard
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
  )
}

export default function PortfolioPage() {
  return (
    <AuthGuard requireAuth={true}>
      <PortfolioContent />
    </AuthGuard>
  )
}

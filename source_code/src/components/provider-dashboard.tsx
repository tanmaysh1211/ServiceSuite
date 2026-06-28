"use client"

import { useState, useEffect } from "react"
import { AITaskboard } from "./ai-taskboard"
import { CalendarExport } from "./calender-export"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, DollarSign, Users, TrendingUp, Calendar, MessageSquare, Eye, FileText, Bookmark, Menu } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Task } from "@/lib/supabaseClient"
import { InvoiceGenerator } from "./invoice-generator"
import { Button } from "@/components/ui/button"
import ProfileCompletenessMeter from "@/components/profile-completeness-meter"
// If you have shadcn/ui Drawer, import it. If not, you will need to add it to your project.
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"

export function ProviderDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalClients: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchDashboardStats()
      fetchPortfolio()
    }
  }, [user])

  const fetchTasks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const fetchDashboardStats = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch all tasks for the user
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)

      if (error) throw error

      // Calculate unique projects
      const uniqueProjects = new Set(
        (tasks || []).filter(task => task.project_name).map(task => task.project_name)
      )

      // Calculate unique clients
      const uniqueClients = new Set(
        (tasks || []).filter(task => task.client_email).map(task => task.client_email)
      )

      // Calculate monthly revenue (estimated based on completed tasks)
      const completedTasks = (tasks || []).filter(task => task.status === "completed")
      const monthlyRevenue = completedTasks.reduce((sum, task) => {
        // Assuming $50/hour average rate - you can adjust this
        return sum + (task.estimated_hours * 50)
      }, 0)

      setStats({
        activeProjects: uniqueProjects.size,
        totalClients: uniqueClients.size,
        monthlyRevenue: monthlyRevenue
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPortfolio = async () => {
    if (!user) return
    setPortfolioLoading(true)
    try {
      const { data } = await supabase.from("portfolios").select("*").eq("provider_id", user.id).single()
      setPortfolio(data)
    } catch (error) {
      setPortfolio(null)
    } finally {
      setPortfolioLoading(false)
    }
  }

  // Calculate profile completeness
  const calculateCompleteness = () => {
    if (!portfolio) return 0
    const fields = [
      portfolio.title,
      portfolio.bio,
      (portfolio.skills || []).join(", "),
      portfolio.location,
      portfolio.hourly_rate,
      portfolio.availability,
      portfolio.experience_years,
      portfolio.education,
      (portfolio.certifications || []).join(", "),
      (portfolio.portfolio_links || []).join(", "),
      portfolio.profile_image_url,
    ]
    const total = fields.length
    const filled = fields.filter((f) => {
      if (Array.isArray(f)) return f.length > 0
      if (typeof f === "number") return f !== undefined && f !== null
      return f && String(f).trim().length > 0
    }).length
    return Math.round((filled / total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Mobile Navigation Drawer */}
      <div className="md:hidden flex justify-between items-center px-4 pt-2">
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation menu">
              <Menu className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 max-w-xs w-full">
            <DialogTitle className="px-4 pt-4 pb-2">Job Manager</DialogTitle>
            <nav className="flex flex-col gap-2 p-4">
              <Link href="/dashboard/jobs-marketplace" onClick={() => setDrawerOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" /> View Current Jobs
                </Button>
              </Link>
              <Link href="/dashboard/saved-jobs" onClick={() => setDrawerOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Bookmark className="h-4 w-4 mr-2" /> Saved Jobs
                </Button>
              </Link>
              <Link href="/dashboard/my-applications" onClick={() => setDrawerOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" /> My Applications
                </Button>
              </Link>
              <Link href="/dashboard/my-jobs-provider" onClick={() => setDrawerOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" /> My Jobs
                </Button>
              </Link>
            </nav>
          </DialogContent>
        </Dialog>
        <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Job Manager</span>
      </div>
      {/* Desktop Action Buttons */}
      <div className="hidden md:flex justify-end gap-4">
        <Link href="/dashboard/jobs-marketplace">
          <Button variant="outline">
            <Briefcase className="h-4 w-4 mr-2" />
            View Current Jobs
          </Button>
        </Link>
        <Link href="/dashboard/saved-jobs">
          <Button variant="outline">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Jobs
          </Button>
        </Link>
        <Link href="/dashboard/my-applications">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            My Applications
          </Button>
        </Link>
        <Link href="/dashboard/my-jobs-provider">
          <Button variant="outline">
            <Briefcase className="h-4 w-4 mr-2" />
            My Jobs
          </Button>
        </Link>
      </div>
      {/* Profile Completeness Meter */}
      {(!portfolioLoading && calculateCompleteness() < 100) && (
        <div className="px-2 md:px-0">
          <ProfileCompletenessMeter completeness={calculateCompleteness()} />
        </div>
      )}
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-2 md:px-0">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : stats.activeProjects}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : `$${stats.monthlyRevenue.toLocaleString()}`}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : stats.totalClients}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Taskboard */}
      <div className="px-2 md:px-0">
        <AITaskboard />
      </div>

      {/* Portfolio Management */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Portfolio Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/portfolio">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                <Users className="h-4 w-4 mr-2" />
                Manage Portfolio
              </Button>
            </Link>
            <Link href="/dashboard/view-portfolio">
              <Button variant="outline" className="w-full sm:w-auto">
                <Eye className="h-4 w-4 mr-2" />
                View Public Profile
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Manage your professional portfolio and showcase your work to potential clients.
          </p>
        </CardContent>
      </Card>

      {/* Invoice Generator */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceGenerator />
        </CardContent>
      </Card>

      {/* Calendar Export */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarExport tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  generateTasks,
  updateTaskStatus,
  deleteTask,
  generateTaskSuggestions,
  generateProjectInsights,
  generateTaskBreakdown,
  generateProjectIdeas,
} from "@/actions/ai-actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sparkles,
  Clock,
  CheckCircle,
  Play,
  Pause,
  Trash2,
  Plus,
  Lightbulb,
  AlertCircle,
  Zap,
  BarChart3,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronRight,
  Rocket,
  TestTube,
  Bug,
  Filter,
  Users,
  Building,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Task } from "@/lib/supabaseClient"

export function AITaskboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [projectIdeas, setProjectIdeas] = useState<any[]>([])
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [taskBreakdowns, setTaskBreakdowns] = useState<{ [key: string]: any[] }>({})
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)

  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [clients, setClients] = useState<Array<{ name: string; email: string; company?: string }>>([])
  const [projects, setProjects] = useState<string[]>([])

  const [showManualTaskForm, setShowManualTaskForm] = useState(false)
  const [manualTaskLoading, setManualTaskLoading] = useState(false)
  const [selectedClientForTask, setSelectedClientForTask] = useState<string>("")

  const [isTasksListCollapsed, setIsTasksListCollapsed] = useState(false)

  const [isInsightsCollapsed, setIsInsightsCollapsed] = useState(false)
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(false)

  const [isProjectIdeasCollapsed, setIsProjectIdeasCollapsed] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  useEffect(() => {
    filterTasks()
  }, [tasks, selectedClient, selectedProject, selectedStatus, selectedPriority])

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

      const uniqueClients = Array.from(
        new Map(
          (data || [])
            .filter((task) => task.client_name && task.client_email)
            .map((task) => [
              task.client_email,
              {
                name: task.client_name!,
                email: task.client_email!,
                company: task.client_company || undefined,
              },
            ]),
        ).values(),
      )

      const uniqueProjects = Array.from(
        new Set((data || []).filter((task) => task.project_name).map((task) => task.project_name!)),
      )

      setClients(uniqueClients)
      setProjects(uniqueProjects)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const filterTasks = () => {
    let filtered = [...tasks]

    if (selectedClient !== "all") {
      filtered = filtered.filter((task) => task.client_email === selectedClient)
    }

    if (selectedProject !== "all") {
      filtered = filtered.filter((task) => task.project_name === selectedProject)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((task) => task.status === selectedStatus)
    }

    if (selectedPriority !== "all") {
      filtered = filtered.filter((task) => task.priority === selectedPriority)
    }

    setFilteredTasks(filtered)
  }

  const clearFilters = () => {
    setSelectedClient("all")
    setSelectedProject("all")
    setSelectedStatus("all")
    setSelectedPriority("all")
  }

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const collapseAllTasks = () => {
    setCollapsedTasks(new Set(filteredTasks.map(task => task.id)))
  }

  const expandAllTasks = () => {
    setCollapsedTasks(new Set())
  }

  const toggleTasksListCollapse = () => {
    setIsTasksListCollapsed(prev => !prev)
  }

  const toggleInsightsCollapse = () => {
    setIsInsightsCollapsed(prev => !prev)
  }

  const toggleSuggestionsCollapse = () => {
    setIsSuggestionsCollapsed(prev => !prev)
  }

  const toggleProjectIdeasCollapse = () => {
    setIsProjectIdeasCollapsed(prev => !prev)
  }

  const handleManualTaskCreation = async (formData: FormData) => {
    if (!user) return

    setManualTaskLoading(true)
    setMessage("")

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const priority = formData.get("priority") as "high" | "medium" | "low"
    const estimatedHours = Number(formData.get("estimatedHours"))
    const clientEmail = formData.get("clientEmail") as string
    const projectName = formData.get("projectName") as string

    try {
      let clientName = ""
      let clientCompany = ""
      if (clientEmail && clientEmail !== "new" && clientEmail !== "none") {
        const client = clients.find(c => c.email === clientEmail)
        if (client) {
          clientName = client.name
          clientCompany = client.company || ""
        }
      } else if (clientEmail === "new") {
        clientName = formData.get("newClientName") as string
        clientCompany = formData.get("newClientCompany") as string
      }

      const newTask = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        estimated_hours: estimatedHours,
        status: "todo" as const,
        client_name: clientName || null,
        client_email: clientEmail !== "new" && clientEmail !== "none" ? clientEmail : null,
        client_company: clientCompany || null,
        project_name: projectName || null,
      }

      const { data, error } = await supabase.from("tasks").insert([newTask]).select()

      if (error) throw error

      setTasks(prevTasks => [data[0], ...prevTasks])
      setMessage("Task created successfully!")
      setShowManualTaskForm(false)
      setSelectedClientForTask("")
    } catch (error) {
      console.error("Error creating task:", error)
      setMessage("Failed to create task. Please try again.")
    } finally {
      setManualTaskLoading(false)
    }
  }

  const handleGenerateTasks = async (formData: FormData) => {
    if (!user) return

    setLoading(true)
    setMessage("")
    const projectDescription = formData.get("project") as string
    const clientName = formData.get("clientName") as string
    const clientEmail = formData.get("clientEmail") as string
    const clientCompany = formData.get("clientCompany") as string
    const projectName = formData.get("projectName") as string

    try {
      const result = await generateTasks(
        projectDescription,
        user.id,
        clientName || undefined,
        clientEmail || undefined,
        clientCompany || undefined,
        projectName || undefined,
      )
      if (result.success && result.tasks) {
        setTasks((prevTasks) => [...result.tasks, ...prevTasks])
        if (result.message) {
          setMessage(result.message)
        }
      } else {
        setMessage(result.message || "Failed to generate tasks")
      }
    } catch (error) {
      console.error("Error generating tasks:", error)
      setMessage("An error occurred while generating tasks")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateProjectIdeas = async (formData: FormData) => {
    setLoadingIdeas(true)
    const industry = formData.get("industry") as string
    const skillsInput = formData.get("skills") as string
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      const result = await generateProjectIdeas(industry, skills)
      if (result.success) {
        setProjectIdeas(result.projectIdeas)
      }
    } catch (error) {
      console.error("Error generating project ideas:", error)
    } finally {
      setLoadingIdeas(false)
    }
  }

  const handleTaskBreakdown = async (task: Task) => {
    if (taskBreakdowns[task.id]) {
      if (expandedTask === task.id) {
        setExpandedTask(null)
      } else {
        setExpandedTask(task.id)
      }
      return
    }

    try {
      const result = await generateTaskBreakdown(task.title, task.description)
      if (result.success) {
        setTaskBreakdowns((prev) => ({ ...prev, [task.id]: result.subtasks }))
        setExpandedTask(task.id)
      }
    } catch (error) {
      console.error("Error generating task breakdown:", error)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, status: Task["status"]) => {
    try {
      await updateTaskStatus(taskId, status)
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status } : task)))
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!filteredTasks.length) return

    setLoadingSuggestions(true)
    try {
      const currentTaskTitles = filteredTasks.map((task) => task.title)
      const result = await generateTaskSuggestions(currentTaskTitles, "general project")

      if (result.success) {
        setSuggestions(result.suggestions)
      }
    } catch (error) {
      console.error("Error generating suggestions:", error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleGenerateInsights = async () => {
    if (!filteredTasks.length) return

    setLoadingInsights(true)
    try {
      const result = await generateProjectInsights(filteredTasks)
      if (result.success) {
        setInsights(result.insights)
      }
    } catch (error) {
      console.error("Error generating insights:", error)
    } finally {
      setLoadingInsights(false)
    }
  }

  const addSuggestionAsTask = async (suggestion: any) => {
  if (!user) return

  try {
    const taskToInsert = {
      user_id: user.id,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      estimated_hours: suggestion.estimatedHours,
      status: "todo" as const,
      client_name:
        selectedClient !== "all"
          ? clients.find((c) => c.email === selectedClient)?.name
          : null,
      client_email: selectedClient !== "all" ? selectedClient : null,
      client_company:
        selectedClient !== "all"
          ? clients.find((c) => c.email === selectedClient)?.company
          : null,
      project_name: selectedProject !== "all" ? selectedProject : null,
    }

    const result = await supabase
      .from("tasks")
      .insert([taskToInsert])
      .select()


    if (result.error) {
     
      throw result.error
    }

    const data = result.data

    if (data && data[0]) {
      setTasks((prevTasks) => [data[0], ...prevTasks])
      setSuggestions((prevSuggestions) =>
        prevSuggestions.filter((s) => s.title !== suggestion.title)
      )
    }
  } catch (error) {
    console.error("Error adding suggestion as task:", error)
    setMessage("Failed to add suggestion as task")
  }
}

  const addProjectIdeaAsTasks = async (idea: any) => {
  if (!user) return

  try {
    const mainTask = {
      user_id: user.id,
      title: idea.title,
      description: idea.description,
      priority: "high" as const,
      estimated_hours: 40,
      status: "todo" as const,
      client_name:
        selectedClient !== "all"
          ? clients.find((c) => c.email === selectedClient)?.name
          : null,
      client_email: selectedClient !== "all" ? selectedClient : null,
      client_company:
        selectedClient !== "all"
          ? clients.find((c) => c.email === selectedClient)?.company
          : null,
      project_name: selectedProject !== "all" ? selectedProject : null,
    }

    const result = await supabase
      .from("tasks")
      .insert([mainTask])
      .select()


    if (result.error) {
     
      throw result.error
    }

    const data = result.data

    if (data && data[0]) {
      setTasks((prevTasks) => [data[0], ...prevTasks])
      setProjectIdeas((prevIdeas) =>
        prevIdeas.filter((p) => p.title !== idea.title)
      )
    }
  } catch (error) {
    console.error("Error adding project idea as task:", error)
    setMessage("Failed to add project idea as task")
  }
}

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <Play className="h-4 w-4 text-orange-600" />
      case "todo":
        return <Pause className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusDistribution = () => {
    const total = filteredTasks.length
    if (total === 0) return { todo: 0, inProgress: 0, completed: 0, percentages: { todo: 0, inProgress: 0, completed: 0 } }

    const todo = filteredTasks.filter(task => task.status === "todo").length
    const inProgress = filteredTasks.filter(task => task.status === "in_progress").length
    const completed = filteredTasks.filter(task => task.status === "completed").length

    return {
      todo,
      inProgress,
      completed,
      percentages: {
        todo: Math.round((todo / total) * 100),
        inProgress: Math.round((inProgress / total) * 100),
        completed: Math.round((completed / total) * 100)
      }
    }
  }

  const completedTasks = filteredTasks.filter((task) => task.status === "completed").length
  const inProgressTasks = filteredTasks.filter((task) => task.status === "in_progress").length
  const totalHours = filteredTasks.reduce((sum, task) => sum + task.estimated_hours, 0)
  const completedHours = filteredTasks
    .filter((task) => task.status === "completed")
    .reduce((sum, task) => sum + task.estimated_hours, 0)

  return (
    <div className="space-y-6">
      {filteredTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedClient !== "all" || selectedProject !== "all" ? "Filtered" : "Total"} Tasks
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredTasks.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressTasks}</p>
                </div>
                <Play className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {filteredTasks.length > 0 ? Math.round((completedTasks / filteredTasks.length) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-orange-600" />
              Project Ideas Generator
            </CardTitle>
            {projectIdeas.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleProjectIdeasCollapse}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {isProjectIdeasCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Get AI-generated project ideas based on your industry and skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleGenerateProjectIdeas} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry" className="text-gray-700 dark:text-gray-300">
                  Industry
                </Label>
                <Input
                  id="industry"
                  name="industry"
                  placeholder="e.g., Technology, Healthcare, Education"
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <Label htmlFor="skills" className="text-gray-700 dark:text-gray-300">
                  Your Skills (comma-separated)
                </Label>
                <Input
                  id="skills"
                  name="skills"
                  placeholder="e.g., React, Design, Marketing, Writing"
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loadingIdeas}
              className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              {loadingIdeas ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Generate Project Ideas
                </>
              )}
            </Button>
          </form>

          <AnimatePresence>
            {projectIdeas.length > 0 && !isProjectIdeasCollapsed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut",
                  opacity: { duration: 0.3 }
                }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Generated Project Ideas</h4>
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {projectIdeas.map((idea, index) => (
                        <motion.div
                          key={idea.title + index}
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ 
                            opacity: 0, 
                            x: -100, 
                            scale: 0.8,
                            transition: { duration: 0.3, ease: "easeInOut" }
                          }}
                          transition={{ 
                            delay: index * 0.15, 
                            duration: 0.4,
                            ease: "easeOut"
                          }}
                          layout
                          className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">{idea.title}</h5>
                            <div className="flex items-center gap-2">
                              <Badge className={getDifficultyColor(idea.difficulty)}>{idea.difficulty}</Badge>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button size="sm" onClick={() => addProjectIdeaAsTasks(idea)}>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add as Task
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{idea.description}</p>
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15 + 0.2, duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs"
                          >
                            <div>
                              <span className="font-medium">Timeframe:</span> {idea.estimatedTimeframe}
                            </div>
                            <div>
                              <span className="font-medium">Revenue:</span> {idea.potentialRevenue}
                            </div>
                            <div>
                              <span className="font-medium">Skills:</span> {idea.requiredSkills?.join(", ")}
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            AI Task Generator
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Describe your project and let AI generate a detailed task list using OPENAI's lightning-fast LLM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleGenerateTasks} className="space-y-4">
            <div>
              <Label htmlFor="project" className="text-gray-700 dark:text-gray-300">
                Project Description
              </Label>
              <Textarea
                id="project"
                name="project"
                placeholder="E.g., Build a mobile app for food delivery, Create a marketing campaign for a new product, Design a website for a local business..."
                className="min-h-[100px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Client Name
                </Label>
                <Input
                  id="clientName"
                  name="clientName"
                  placeholder="John Smith"
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  placeholder="john@example.com"
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientCompany" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Client Company
                </Label>
                <Input
                  id="clientCompany"
                  name="clientCompany"
                  placeholder="Acme Corp"
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  placeholder="Website Redesign"
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {loading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating Tasks with OPENAI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Tasks
                </>
              )}
            </Button>
          </form>

          {message && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Manual Task Creation
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Create tasks manually for specific clients and projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {!showManualTaskForm ? (
              <motion.div 
                key="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-center py-8"
              >
                <Button
                  onClick={() => setShowManualTaskForm(true)}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Task
                </Button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut",
                  opacity: { duration: 0.3 }
                }}
                action={handleManualTaskCreation} 
                className="space-y-4 overflow-hidden"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                      Task Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Design homepage mockup"
                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-gray-700 dark:text-gray-300">
                      Priority *
                    </Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                    Task Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what needs to be done..."
                    className="min-h-[80px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    required
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <Label htmlFor="estimatedHours" className="text-gray-700 dark:text-gray-300">
                      Estimated Hours *
                    </Label>
                    <Input
                      id="estimatedHours"
                      name="estimatedHours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="4"
                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectName" className="text-gray-700 dark:text-gray-300">
                      Project Name
                    </Label>
                    <Input
                      id="projectName"
                      name="projectName"
                      placeholder="e.g., Website Redesign"
                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <Label htmlFor="clientEmail" className="text-gray-700 dark:text-gray-300">
                    Client
                  </Label>
                  <Select 
                    name="clientEmail" 
                    value={selectedClientForTask} 
                    onValueChange={setSelectedClientForTask}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client or create new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.email} value={client.email}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Create New Client</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <AnimatePresence>
                  {selectedClientForTask === "new" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden"
                    >
                      <div>
                        <Label htmlFor="newClientName" className="text-gray-700 dark:text-gray-300">
                          New Client Name *
                        </Label>
                        <Input
                          id="newClientName"
                          name="newClientName"
                          placeholder="John Smith"
                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientCompany" className="text-gray-700 dark:text-gray-300">
                          Company
                        </Label>
                        <Input
                          id="newClientCompany"
                          name="newClientCompany"
                          placeholder="Acme Corp"
                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="flex gap-2"
                >
                  <Button
                    type="submit"
                    disabled={manualTaskLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    {manualTaskLoading ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Creating Task...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowManualTaskForm(false)
                      setSelectedClientForTask("")
                    }}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {tasks.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Project Insights
              </CardTitle>
              {insights && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleInsightsCollapse}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {isInsightsCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Get AI-powered analysis of your project progress and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateInsights} disabled={loadingInsights} variant="outline" className="mb-4">
              {loadingInsights ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Project...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>

            <AnimatePresence>
              {insights && !isInsightsCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: "easeInOut",
                    opacity: { duration: 0.3 }
                  }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Progress Analysis</h4>
                      <p className="text-blue-800 dark:text-blue-200">{insights.progressAnalysis}</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {insights.recommendations?.map((rec: string, index: number) => (
                          <motion.li 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                            className="text-green-800 dark:text-green-200 flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-1">•</span>
                            {rec}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                      >
                        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">Estimated Completion</h4>
                        <p className="text-purple-800 dark:text-purple-200">{insights.estimatedCompletion}</p>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                      >
                        <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-2">Risk Factors</h4>
                        <ul className="space-y-1">
                          {insights.riskFactors?.map((risk: string, index: number) => (
                            <motion.li 
                              key={index} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.05, duration: 0.2 }}
                              className="text-orange-800 dark:text-orange-200 flex items-start gap-2"
                            >
                              <span className="text-orange-600 mt-1">⚠</span>
                              {risk}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Smart Suggestions
              </CardTitle>
              {suggestions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSuggestionsCollapse}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {isSuggestionsCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Get AI-powered suggestions for additional tasks based on your current project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateSuggestions}
              disabled={loadingSuggestions}
              variant="outline"
              className="mb-4"
            >
              {loadingSuggestions ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Get Task Suggestions
                </>
              )}
            </Button>

            <AnimatePresence>
              {suggestions.length > 0 && !isSuggestionsCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: "easeInOut",
                    opacity: { duration: 0.3 }
                  }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: index * 0.1, 
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                        className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{suggestion.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getPriorityColor(suggestion.priority)}>{suggestion.priority}</Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {suggestion.estimatedHours}h estimated
                              </span>
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button size="sm" onClick={() => addSuggestionAsTask(suggestion)} className="ml-3">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
      {tasks.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Filter Tasks
              {(selectedClient !== "all" || selectedProject !== "all" || selectedStatus !== "all" || selectedPriority !== "all") && (
                <Badge variant="secondary">
                  {[selectedClient !== "all", selectedProject !== "all", selectedStatus !== "all", selectedPriority !== "all"].filter(Boolean).length > 1
                    ? "Multiple Filters"
                    : selectedClient !== "all"
                      ? "Client"
                      : selectedProject !== "all"
                        ? "Project"
                        : selectedStatus !== "all"
                          ? "Status"
                          : "Priority"}{" "}
                  Filter Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="clientFilter" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Filter by Client
                </Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.email} value={client.email}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="projectFilter" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Filter by Project
                </Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="statusFilter" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Filter by Status
                </Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="todo">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priorityFilter" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Filter by Priority
                </Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {(selectedClient !== "all" || selectedProject !== "all" || selectedStatus !== "all" || selectedPriority !== "all") && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Task Status Distribution
              {(selectedClient !== "all" || selectedProject !== "all" || selectedStatus !== "all" || selectedPriority !== "all") && (
                <Badge variant="secondary" className="text-xs">
                  Filtered View
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Visual representation of task status distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  {(() => {
                    const distribution = getStatusDistribution()
                    return (
                      <>
                        {distribution.todo > 0 && (
                          <div 
                            className="bg-red-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                            style={{ width: `${distribution.percentages.todo}%` }}
                            title={`${distribution.todo} pending tasks (${distribution.percentages.todo}%)`}
                          >
                            {distribution.percentages.todo > 10 && `${distribution.percentages.todo}%`}
                          </div>
                        )}
                        
                        {distribution.inProgress > 0 && (
                          <div 
                            className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                            style={{ width: `${distribution.percentages.inProgress}%` }}
                            title={`${distribution.inProgress} in progress tasks (${distribution.percentages.inProgress}%)`}
                          >
                            {distribution.percentages.inProgress > 10 && `${distribution.percentages.inProgress}%`}
                          </div>
                        )}
                        
                        {distribution.completed > 0 && (
                          <div 
                            className="bg-green-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                            style={{ width: `${distribution.percentages.completed}%` }}
                            title={`${distribution.completed} completed tasks (${distribution.percentages.completed}%)`}
                          >
                            {distribution.percentages.completed > 10 && `${distribution.percentages.completed}%`}
                          </div>
                        )}
                        
                        {distribution.todo === 0 && distribution.inProgress === 0 && distribution.completed === 0 && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                            No tasks match current filters
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {(() => {
                  const distribution = getStatusDistribution()
                  return (
                    <>
                      {distribution.todo > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Pending: {distribution.todo} ({distribution.percentages.todo}%)
                          </span>
                        </div>
                      )}
                      
                      {distribution.inProgress > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-gray-700 dark:text-gray-300">
                            In Progress: {distribution.inProgress} ({distribution.percentages.inProgress}%)
                          </span>
                        </div>
                      )}
                      
                      {distribution.completed > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Completed: {distribution.completed} ({distribution.percentages.completed}%)
                          </span>
                        </div>
                      )}
                      
                      {distribution.todo === 0 && distribution.inProgress === 0 && distribution.completed === 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-400 rounded"></div>
                          <span className="text-gray-500 dark:text-gray-400">
                            No tasks available
                          </span>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-0">
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
              onClick={toggleTasksListCollapse}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                <div className="flex flex-wrap items-center gap-2 w-full">
                  {isTasksListCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedClient !== "all" || selectedProject !== "all" || selectedStatus !== "all" || selectedPriority !== "all" ? "Filtered Tasks" : "Your Tasks"}
                  </h3>
                  <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-xs sm:text-sm px-2 py-1">
                    {filteredTasks.length} tasks
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-xs sm:text-sm px-2 py-1">
                    {completedTasks}/{filteredTasks.length} completed
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs sm:text-sm px-2 py-1">
                    {completedHours}/{totalHours}h done
                  </Badge>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {!isTasksListCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: "easeInOut",
                    opacity: { duration: 0.3 }
                  }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    {filteredTasks.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={collapseAllTasks}
                              className="text-xs"
                            >
                              <ChevronRight className="h-3 w-3 mr-1" />
                              Collapse All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={expandAllTasks}
                              className="text-xs"
                            >
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Expand All
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid gap-4">
                          <AnimatePresence mode="popLayout">
                            {filteredTasks.map((task, index) => (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ 
                                  opacity: 0, 
                                  x: -100, 
                                  scale: 0.8,
                                  transition: { duration: 0.3, ease: "easeInOut" }
                                }}
                                transition={{ 
                                  duration: 0.4, 
                                  delay: index * 0.1,
                                  ease: "easeOut"
                                }}
                                layout
                                className="w-full"
                              >
                                <Card className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800 w-full">
                                  <CardContent className="p-0">
                                    <div 
                                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                      onClick={() => toggleTaskCollapse(task.id)}
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {collapsedTasks.has(task.id) ? (
                                              <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            ) : (
                                              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            )}
                                            <h4 className="font-medium text-base sm:text-lg text-gray-900 dark:text-white break-words max-w-xs sm:max-w-none">{task.title}</h4>
                                          </div>
                                          {(task.client_name || task.project_name) && (
                                            <div className="flex flex-wrap items-center gap-2 mt-1 ml-6">
                                              {task.client_name && (
                                                <Badge variant="outline" className="text-xs">
                                                  <Users className="h-3 w-3 mr-1" />
                                                  {task.client_name}
                                                  {task.client_company && ` (${task.client_company})`}
                                                </Badge>
                                              )}
                                              {task.project_name && (
                                                <Badge variant="outline" className="text-xs">
                                                  <Building className="h-3 w-3 mr-1" />
                                                  {task.project_name}
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                                          {getStatusIcon(task.status)}
                                        </div>
                                      </div>
                                    </div>

                                    <AnimatePresence>
                                      {!collapsedTasks.has(task.id) && (
                                        <motion.div 
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.3, ease: "easeInOut" }}
                                          className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 overflow-x-auto"
                                        >
                                          <p className="text-gray-600 dark:text-gray-300 mb-3 mt-3 text-sm break-words max-w-full">{task.description}</p>

                                          <div className="mb-3">
                                            <Button variant="outline" size="sm" onClick={() => handleTaskBreakdown(task)} className="text-xs">
                                              {expandedTask === task.id ? (
                                                <ChevronDown className="h-3 w-3 mr-1" />
                                              ) : (
                                                <ChevronRight className="h-3 w-3 mr-1" />
                                              )}
                                              {taskBreakdowns[task.id] ? "Subtasks" : "Break Down Task"}
                                            </Button>

                                            <AnimatePresence>
                                              {Array.isArray(taskBreakdowns[task.id]) && (
                                                <motion.div 
                                                  initial={{ opacity: 0, x: -20 }}
                                                  animate={{ opacity: 1, x: 0 }}
                                                  exit={{ opacity: 0, x: -20 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600"
                                                >
                                                  {taskBreakdowns[task.id].map((subtask: any, index: number) => (
                                                    <motion.div 
                                                      key={index} 
                                                      initial={{ opacity: 0, x: -10 }}
                                                      animate={{ opacity: 1, x: 0 }}
                                                      transition={{ delay: index * 0.05 }}
                                                      className="py-1 text-sm text-gray-600 dark:text-gray-300"
                                                    >
                                                      <span className="font-medium">•</span> {subtask.subtask}
                                                      <span className="text-xs text-gray-500 ml-2">({subtask.estimatedMinutes}min)</span>
                                                    </motion.div>
                                                  ))}
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>

                                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                              <Clock className="h-4 w-4" />
                                              {task.estimated_hours}h estimated
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              {task.status === "todo" && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                                                >
                                                  <Play className="h-4 w-4 mr-1" />
                                                  Start
                                                </Button>
                                              )}
                                              {task.status === "in_progress" && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                                                >
                                                  <CheckCircle className="h-4 w-4 mr-1" />
                                                  Complete
                                                </Button>
                                              )}
                                              {task.status === "completed" && (
                                                <Button variant="outline" size="sm" onClick={() => handleUpdateTaskStatus(task.id, "todo")}> 
                                                  <Pause className="h-4 w-4 mr-1" />
                                                  Reopen
                                                </Button>
                                              )}
                                              <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                              >
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleDeleteTask(task.id)}
                                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </motion.div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Filter className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No tasks match your filters
                            </h4>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              Try adjusting your filters or create new tasks to get started.
                            </p>
                            <Button
                              variant="outline"
                              onClick={clearFilters}
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Clear All Filters
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

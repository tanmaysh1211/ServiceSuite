"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Calendar, Download, ExternalLink, Clock, AlertCircle } from "lucide-react"
import { downloadICS, openGoogleCalendar, taskToCalendarEvent } from "@/lib/calender-utils"
import type { Task } from "@/lib/supabaseClient"

interface CalendarExportProps {
  tasks: Task[]
}

export function CalendarExport({ tasks }: CalendarExportProps) {
  const [exporting, setExporting] = useState(false)

  // Filter tasks that have deadlines (pending or in_progress)
  const tasksWithDeadlines = tasks.filter((task) => task.status === "todo" || task.status === "in_progress")

  const handleExportToAppleCalendar = async () => {
    setExporting(true)
    try {
      const events = tasksWithDeadlines.map(taskToCalendarEvent)
      downloadICS(events, `ServiceSuite-deadlines-${new Date().toISOString().split("T")[0]}.ics`)
    } catch (error) {
      console.error("Error exporting to Apple Calendar:", error)
    } finally {
      setExporting(false)
    }
  }

  const handleExportAllToGoogle = () => {
    tasksWithDeadlines.forEach((task, index) => {
      setTimeout(() => {
        const event = taskToCalendarEvent(task)
        openGoogleCalendar(event)
      }, index * 1000) // Stagger the opens to avoid popup blocking
    })
  }

  const handleExportSingleToGoogle = (task: Task) => {
    const event = taskToCalendarEvent(task)
    openGoogleCalendar(event)
  }

  if (tasksWithDeadlines.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Calendar Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No pending tasks with deadlines to export</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Calendar Export
          <Badge variant="secondary">{tasksWithDeadlines.length} deadlines</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export All Options */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExportToAppleCalendar}
            disabled={exporting}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export to Apple Calendar"}
          </Button>

          <Button
            onClick={handleExportAllToGoogle}
            variant="outline"
            className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Export All to Google
          </Button>
        </div>

        {/* Individual Task Export */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Export Individual Tasks:</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tasksWithDeadlines.map((task) => {
              const deadline = new Date()
              deadline.setDate(deadline.getDate() + Math.ceil(task.estimated_hours / 8))

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={
                          task.priority === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        }
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {deadline.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportSingleToGoogle(task)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Add to Google Calendar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const event = taskToCalendarEvent(task)
                          downloadICS([event], `${task.title.replace(/[^a-zA-Z0-9]/g, "-")}.ics`)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download .ics file
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-3 border-t">
          <p>
            <strong>Apple Calendar:</strong> Downloads .ics file that opens in Calendar app
          </p>
          <p>
            <strong>Google Calendar:</strong> Opens Google Calendar in browser to add events
          </p>
          <p>
            <strong>Note:</strong> Deadlines are calculated based on estimated hours (8 hours = 1 day)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

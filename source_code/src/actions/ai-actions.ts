"use server"

// import Groq from "groq-sdk"
import OpenAI from "openai"
import { supabase } from "@/lib/supabaseClient"
import type { Invoice } from "@/lib/supabaseClient"

// Initialize Groq with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateTasks(
  projectDescription: string,
  userId: string,
  clientName?: string,
  clientEmail?: string,
  clientCompany?: string,
  projectName?: string,
) {
  try {
    console.log("📡 Making OpenAI API call for task generation...")

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that creates detailed task lists for entrepreneurs and creators. 
          
          Generate 5-8 specific, actionable tasks based on the project description. Each task should be realistic and help the user achieve their project goals.
          
          Return ONLY a valid JSON array with this exact structure:
          [
            {
              "title": "Task title (max 50 characters)",
              "description": "Detailed description of what needs to be done",
              "priority": "high" | "medium" | "low",
              "estimatedHours": number (realistic time estimate)
            }
          ]
          
          Make sure the JSON is valid and properly formatted. Make sure you follow the structure exactly and do not include any additional text or formatting. Write the structure with the keys.`,
        },
        {
          role: "user",
          content: `Create a detailed task list for this project, only the json: ${projectDescription}`,
        },
      ],
      // model: "gemma2-9b-it",
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2048,
    })

    console.log("✅ OPENAI API call successful for task generation!")

    const responseText = completion.choices[0]?.message?.content || ""
    console.log("📝 Raw response text:", responseText)

    if (!responseText) {
      console.error("❌ Empty response from OPENAI API")
      throw new Error("Empty response from OPENAI API")
    }

    // Clean the response to ensure it's valid JSON
    let cleanedText = responseText.trim()
    console.log("🧹 Text before cleaning:", cleanedText.substring(0, 300))

    // Remove any markdown code blocks if present
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
      console.log("🧹 Removed ```json blocks")
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/, "").replace(/\n?```$/, "")
      console.log("🧹 Removed ``` blocks")
    }

    console.log("🧹 Cleaned text:", cleanedText)

    let tasks
    try {
      tasks = JSON.parse(cleanedText)
      console.log("✅ JSON parsing successful!")
      console.log("📋 Parsed tasks:", tasks)
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError)
      console.error("🔍 Raw response that failed to parse:", responseText)
      console.error("🔍 Cleaned text that failed to parse:", cleanedText)
      throw new Error(`Failed to parse JSON response: ${parseError}`)
    }

    // Validate the tasks array
    if (!Array.isArray(tasks)) {
      console.error("❌ Response is not an array:", typeof tasks, tasks)
      throw new Error("Response is not an array")
    }

    console.log("✅ Validation passed - tasks is an array with", tasks.length, "items")

    // Validate each task has required fields
    const validatedTasks = tasks.map((task: any, index: number) => {
      console.log(`🔍 Validating task ${index + 1}:`, task)

      if (!task.title || !task.description || !task.priority || typeof task.estimatedHours !== "number") {
        console.error(`❌ Invalid task structure at index ${index}:`, task)
        throw new Error(`Invalid task structure at index ${index}`)
      }

      return {
        user_id: userId,
        title: String(task.title).substring(0, 100),
        description: String(task.description),
        priority: task.priority,
        estimated_hours: Number(task.estimatedHours),
        // status: "pending" as const,
        status: "todo" as const,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_company: clientCompany || null,
        project_name: projectName || null,
      }
    })

    console.log("💾 Saving to Supabase...")
    console.log("📋 Tasks to insert:", validatedTasks)

    const { data, error } = await supabase.from("tasks").insert(validatedTasks).select()

    if (error) {
      console.error("❌ Supabase error:", error)
      console.error("🔍 Supabase error details:", JSON.stringify(error, null, 2))
      throw error
    }

    console.log("✅ Successfully saved", data?.length, "tasks to database")
    console.log("📋 Saved tasks:", data)

    return { success: true, tasks: data || [] }
  } catch (error: any) {
    console.error("❌ Error in generateTasks:", error)
    console.error("🔍 Error name:", error.name)
    console.error("🔍 Error message:", error.message)
    console.error("🔍 Error stack:", error.stack)

    // Fallback: Create some default tasks if AI fails
    console.log("🔄 Using fallback tasks due to error:", error.message)
    const fallbackTasks = [
      {
        user_id: userId,
        title: "Project Planning & Research",
        description: "Research market needs, define project scope, and create a detailed project plan",
        priority: "high",
        estimated_hours: 4,
        // status: "pending",
        status: "todo" as const,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_company: clientCompany || null,
        project_name: projectName || null,
      },
      {
        user_id: userId,
        title: "Create Project Timeline",
        description: "Break down the project into phases with specific deadlines and milestones",
        priority: "high",
        estimated_hours: 2,
        // status: "pending",
        status: "todo" as const,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_company: clientCompany || null,
        project_name: projectName || null,
      },
      {
        user_id: userId,
        title: "Design & Prototyping",
        description: "Create initial designs, wireframes, or prototypes for the project",
        priority: "medium",
        estimated_hours: 6,
        // status: "pending",
        status: "todo" as const,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_company: clientCompany || null,
        project_name: projectName || null,
      },
      {
        user_id: userId,
        title: "Testing & Quality Assurance",
        description: "Test all features and ensure quality standards are met",
        priority: "medium",
        estimated_hours: 3,
        // status: "pending",
        status: "todo" as const,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_company: clientCompany || null,
        project_name: projectName || null,
      },
    ]

    try {
      console.log("💾 Saving fallback tasks to Supabase...")
      const { data, error: fallbackError } = await supabase.from("tasks").insert(fallbackTasks).select()

      if (fallbackError) {
        console.error("❌ Fallback save failed:", fallbackError)
        throw fallbackError
      }

      console.log("✅ Fallback tasks saved successfully")
      return {
        success: true,
        tasks: data || [],
        message: `AI service temporarily unavailable. Generated fallback tasks. Original error: ${error.message}`,
      }
    } catch (fallbackError: any) {
      console.error("❌ Fallback also failed:", fallbackError)
      return {
        success: false,
        message: `Failed to generate tasks. Original error: ${error.message}. Fallback error: ${fallbackError.message}`,
        tasks: [],
      }
    }
  }
}

export async function updateTaskStatus(taskId: string, status: "todo" | "in_progress" | "completed") {
  try {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, message: "Failed to update task" }
  }
}

export async function deleteTask(taskId: string) {
  try {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, message: "Failed to delete task" }
  }
}

export async function generateTaskSuggestions(currentTasks: string[], projectType: string) {
  try {
    const completion = await openai.chat.completions.create({
      // model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that suggests additional tasks based on existing project tasks.
          
          Given the current tasks and project type, suggest 3-5 additional tasks that would complement the existing work.
          
          Return ONLY a valid JSON array with this structure:
          [
            {
              "title": "Task title",
              "description": "Task description", 
              "priority": "high" | "medium" | "low",
              "estimatedHours": number
            }
          ]
          
          Make sure the JSON is valid and properly formatted. Make sure you follow the structure exactly and do not include any additional text or formatting.`,
        },
        {
          role: "user",
          content: `Project type: ${projectType}
          
          Current tasks: ${currentTasks.join(", ")}
          
          Suggest additional complementary tasks:`,
        },
      ],
      // model: "llama3-70b-8192",
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 1024,
    })

    const responseText = completion.choices[0]?.message?.content || ""

    let cleanedText = responseText.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
    }

    const suggestions = JSON.parse(cleanedText)
    return { success: true, suggestions }
  } catch (error) {
    console.error("Error generating task suggestions:", error)
    return { success: false, message: "Failed to generate suggestions" }
  }
}

export async function generateProjectInsights(tasks: any[]) {
  try {
    const completedTasks = tasks.filter((task) => task.status === "completed")
    const todoTasks = tasks.filter((task) => task.status === "todo")
    const inProgressTasks = tasks.filter((task) => task.status === "in_progress")

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI project management assistant. Analyze the given tasks and provide insights about project progress, potential bottlenecks, and recommendations.
          
          Return a JSON object with this structure:
          {
            "progressAnalysis": "Brief analysis of current progress",
            "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
            "estimatedCompletion": "Estimated completion timeframe",
            "riskFactors": ["risk 1", "risk 2"]
          }
            
          Make sure the JSON is valid and properly formatted. Make sure you follow the structure exactly and do not include any additional text or formatting.`,
        },
        {
          role: "user",
          content: `Analyze this project:
          
          Total tasks: ${tasks.length}
          Completed: ${completedTasks.length}
          In Progress: ${inProgressTasks.length}
          todo: ${todoTasks.length}
          
          Task details: ${JSON.stringify(tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority, hours: t.estimated_hours })))}
          
          Provide project insights, RETURN ONLY JSON:`,
        },
      ],
      // model: "gemma2-9b-it",
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 1536,
    })

    const responseText = completion.choices[0]?.message?.content || ""

    let cleanedText = responseText.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
    }

    const insights = JSON.parse(cleanedText)
    return { success: true, insights }
  } catch (error) {
    console.error("Error generating insights:", error)
    return { success: false, message: "Failed to generate insights" }
  }
}

export async function generateTaskBreakdown(taskTitle: string, taskDescription: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that breaks down complex tasks into smaller, manageable subtasks.
          
          Given a task title and description, create 3-5 specific subtasks that would help complete the main task.
          
          Return ONLY a valid JSON array with this structure:
          [
            {
              "subtask": "Specific subtask description",
              "estimatedMinutes": number (realistic time estimate in minutes)
            }
          ]
            
          Make sure the JSON is valid and properly formatted. Make sure you follow the structure exactly and do not include any additional text or formatting.`,
        },
        {
          role: "user",
          content: `Break down this task:
          
          Title: ${taskTitle}
          Description: ${taskDescription}
          
          Create specific subtasks:`,
        },
      ],
      // model: "llama3-70b-8192",
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 1024,
    })

    const responseText = completion.choices[0]?.message?.content || ""

    let cleanedText = responseText.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
    }

    const subtasks = JSON.parse(cleanedText)
    return { success: true, subtasks }
  } catch (error) {
    console.error("Error generating task breakdown:", error)
    return { success: false, message: "Failed to generate task breakdown" }
  }
}

export async function generateProjectIdeas(industry: string, skills: string[]) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that generates creative project ideas for entrepreneurs and creators.
          
          Given an industry and skills, suggest 5-7 innovative project ideas that could be profitable and achievable.
          
          Return ONLY a valid JSON array with this structure:
          [
            {
              "title": "Project title",
              "description": "Detailed project description",
              "difficulty": "beginner" | "intermediate" | "advanced",
              "estimatedTimeframe": "Realistic timeframe to complete",
              "potentialRevenue": "Revenue potential description",
              "requiredSkills": ["skill1", "skill2"]
            }
          ]
            
          Make sure the JSON is valid and properly formatted. Make sure you follow the structure exactly and do not include any additional text or formatting.`,
        },
        {
          role: "user",
          content: `Generate project ideas for:
          
          Industry: ${industry}
          Available Skills: ${skills.join(", ")}
          
          Suggest innovative and profitable project ideas AND MAKE SURE YOU ONLY RETURN JSON:`,
        },
      ],
      // model: "gemma2-9b-it",
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 2048,
    })

    const responseText = completion.choices[0]?.message?.content || ""

    let cleanedText = responseText.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
    }

    const projectIdeas = JSON.parse(cleanedText)
    return { success: true, projectIdeas }
  } catch (error) {
    console.error("Error generating project ideas:", error)
    return { success: false, message: "Failed to generate project ideas" }
  }
}

// Invoice Actions - Using admin client to bypass RLS, fallback to regular client
export async function saveInvoice(invoiceData: any, userId: string) {
  try {
    const invoiceToInsert = {
      user_id: userId,
      invoice_number: invoiceData.invoiceNumber,
      invoice_date: invoiceData.invoiceDate.toISOString(),
      due_date: invoiceData.dueDate.toISOString(),
      provider: invoiceData.provider,
      client: invoiceData.client,
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      tax: invoiceData.tax,
      total: invoiceData.total,
      notes: invoiceData.notes,
      payment_terms: invoiceData.paymentTerms,
      status: "draft" as const,
    }

    // Use admin client if available, otherwise use regular client
    const client = supabase
    const { data, error } = await client.from("invoices").insert([invoiceToInsert]).select()

    if (error) throw error

    return { success: true, invoice: data[0] }
  } catch (error) {
    console.error("Error saving invoice:", error)
    return { success: false, message: "Failed to save invoice" }
  }
}

export async function getInvoices(userId: string) {
  try {
    // Use admin client if available, otherwise use regular client
    const client = supabase
    const { data, error } = await client
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, invoices: data }
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return { success: false, message: "Failed to fetch invoices" }
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: "draft" | "sent" | "paid" | "overdue") {
  try {
    // Use admin client if available, otherwise use regular client
    const client = supabase
    const { error } = await client.from("invoices").update({ status }).eq("id", invoiceId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, message: "Failed to update invoice status" }
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    // Use admin client if available, otherwise use regular client
    const client = supabase
    const { error } = await client.from("invoices").delete().eq("id", invoiceId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, message: "Failed to delete invoice" }
  }
}

export async function deleteJob(jobId: string, userId: string) {
  const client = supabase
  try {
    // First, delete all applications for the job
    await client
      .from("job_applications")
      .delete()
      .eq("job_id", jobId)

    // Then, delete the job itself, ensuring the user owns it
    const { error: jobError } = await client
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("client_id", userId)

    if (jobError) {
      throw jobError
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateJob(jobId: string, userId: string, jobData: any) {
  const client = supabase
  try {
    const { error } = await client
      .from("jobs")
      .update(jobData)
      .eq("id", jobId)
      .eq("client_id", userId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

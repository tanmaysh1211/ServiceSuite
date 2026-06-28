import { supabase } from "@/lib/supabaseClient"

export async function addBookmark(userId: string, jobId: string) {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        job_id: jobId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, message: "Job is already bookmarked" }
      }
      throw error
    }

    return { success: true, data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errorMessage }
  }
}

export async function removeBookmark(userId: string, jobId: string) {
  try {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("job_id", jobId)

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errorMessage }
  }
}

export async function getBookmarks(userId: string) {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        *,
        jobs (
          *,
          profiles!jobs_client_id_fkey (
            name,
            email
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errorMessage, data: [] }
  }
}

export async function isBookmarked(userId: string, jobId: string) {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return { success: true, isBookmarked: !!data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errorMessage, isBookmarked: false }
  }
} 
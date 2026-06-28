-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_job_id ON bookmarks(job_id);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id); 
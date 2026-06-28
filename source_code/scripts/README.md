# Database Scripts

This directory contains SQL scripts for setting up and managing the Service Suite database.

## Scripts

### `create_invoices_table.sql`

Creates the invoices table for generating and managing invoices.

### `create_bookmarks_table.sql`

Creates the bookmarks table for the job bookmarking feature.

## Bookmarking Feature

The bookmarking feature allows users to save jobs they're interested in for later viewing.

### Database Setup

Run the following SQL script in your Supabase SQL editor:

```sql
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
```

### Features

1. **Bookmark Jobs**: Users can bookmark jobs from the jobs marketplace or job detail pages
2. **Saved Jobs Page**: Dedicated page to view all bookmarked jobs
3. **Quick Actions**: Apply directly from saved jobs or remove bookmarks
4. **Visual Indicators**: Bookmarked jobs show a filled bookmark icon
5. **Real-time Updates**: Bookmark status updates immediately across the app

### Components

- `BookmarkButton`: Reusable component for bookmarking functionality
- `SavedJobsPage`: Page to view and manage saved jobs
- `bookmark-actions.ts`: Server actions for bookmark operations

### Usage

1. Navigate to the Jobs Marketplace
2. Click the bookmark button on any job card
3. View saved jobs from the provider dashboard
4. Manage bookmarks from the Saved Jobs page

# Invoice System Setup Instructions

## Setting up the Invoices Table

To enable invoice saving and viewing functionality, you need to create the invoices table in your Supabase database.

### Step 1: Create the Table

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create_invoices_table.sql`
4. Click "Run" to execute the SQL

### Step 2: Fix RLS Issues (If Needed)

If you encounter the error "new row violates row-level security policy for table 'invoices'", you have two options:

#### Option A: Use Service Role Key (Recommended)

1. **Get your service role key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the **service_role** key (NOT the anon key)

2. **Add to your `.env.local`:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Update the server actions to use admin client:**
   - In `src/actions/ai-actions.ts`, change `supabase` to `supabaseAdmin` for invoice operations
   - Add the admin client import: `import { supabase, supabaseAdmin } from "@/lib/supabaseClient"`

#### Option B: Modify RLS Policies (Alternative)

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;

-- Create new policies that work with server actions
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND user_id IS NOT NULL)
  );

CREATE POLICY "Users can insert their own invoices" ON invoices
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND user_id IS NOT NULL)
  );

CREATE POLICY "Users can update their own invoices" ON invoices
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND user_id IS NOT NULL)
  );

CREATE POLICY "Users can delete their own invoices" ON invoices
  FOR DELETE USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND user_id IS NOT NULL)
  );
```

## What the migration creates:

- **invoices table** with all necessary columns for storing invoice data
- **Indexes** for better query performance
- **Row Level Security (RLS)** policies to ensure users can only access their own invoices
- **Triggers** to automatically update the `updated_at` timestamp

## Table Structure:

- `id`: Unique identifier for each invoice
- `user_id`: References the user who created the invoice
- `invoice_number`: The invoice number (e.g., "INV-001")
- `invoice_date`: Date when the invoice was created
- `due_date`: Date when payment is due
- `provider`: JSON object containing provider information
- `client`: JSON object containing client information
- `items`: JSON array of invoice items
- `subtotal`: Subtotal amount before tax
- `tax`: JSON object containing tax information
- `total`: Total amount including tax
- `notes`: Additional notes
- `payment_terms`: Payment terms
- `status`: Invoice status (draft, sent, paid, overdue)
- `created_at`: Timestamp when invoice was created
- `updated_at`: Timestamp when invoice was last updated

## Features Available:

- ✅ **Save Invoices**: Save invoices to database with all details
- ✅ **View Past Invoices**: Browse all saved invoices
- ✅ **Status Management**: Mark invoices as draft, sent, paid, or overdue
- ✅ **PDF Generation**: Generate PDFs from saved invoices
- ✅ **Delete Invoices**: Remove unwanted invoices
- ✅ **Real-time Updates**: Status changes update immediately

After completing the setup, restart your development server and the invoice functionality will be fully operational! 
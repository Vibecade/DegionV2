/*
  # Add missing columns to token_info and create token_sales_details table

  1. Updates to token_info table
    - Add missing columns: name, status, launch_date, seed_price, vesting_end, description, links
    - These columns will be populated by the Edge Function alongside the existing data JSONB column

  2. New Tables
    - `token_sales_details` table for storing sales information
      - `token_id` (text, primary key)
      - `address` (text, contract address)
      - `network` (text, blockchain network)
      - `funds_raised_usdc` (numeric, funds raised in USDC)
      - `participants` (integer, number of participants)
      - `transactions` (integer, number of transactions)
      - `updated_at` (timestamp)

  3. Security
    - Enable RLS on new table
    - Add appropriate policies for public read access and service role management

  4. Performance
    - Add indexes on commonly queried columns
*/

-- Add missing columns to token_info table
DO $$
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'name'
  ) THEN
    ALTER TABLE token_info ADD COLUMN name text;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'status'
  ) THEN
    ALTER TABLE token_info ADD COLUMN status text;
  END IF;

  -- Add launch_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'launch_date'
  ) THEN
    ALTER TABLE token_info ADD COLUMN launch_date text;
  END IF;

  -- Add seed_price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'seed_price'
  ) THEN
    ALTER TABLE token_info ADD COLUMN seed_price text;
  END IF;

  -- Add vesting_end column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'vesting_end'
  ) THEN
    ALTER TABLE token_info ADD COLUMN vesting_end text;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'description'
  ) THEN
    ALTER TABLE token_info ADD COLUMN description text;
  END IF;

  -- Add links column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'links'
  ) THEN
    ALTER TABLE token_info ADD COLUMN links jsonb;
  END IF;
END $$;

-- Create token_sales_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS token_sales_details (
  token_id text PRIMARY KEY,
  address text,
  network text,
  funds_raised_usdc numeric DEFAULT 0,
  participants integer DEFAULT 0,
  transactions integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on token_sales_details table if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'token_sales_details' 
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE token_sales_details ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add policies for token_sales_details if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'token_sales_details' 
    AND policyname = 'Allow public read access to token_sales_details'
  ) THEN
    CREATE POLICY "Allow public read access to token_sales_details"
      ON token_sales_details
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'token_sales_details' 
    AND policyname = 'Allow service role full access to token_sales_details'
  ) THEN
    CREATE POLICY "Allow service role full access to token_sales_details"
      ON token_sales_details
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS token_sales_details_updated_at_idx 
  ON token_sales_details USING btree (updated_at);

CREATE INDEX IF NOT EXISTS token_sales_details_network_idx 
  ON token_sales_details USING btree (network);

-- Add index on token_info name column for sorting
CREATE INDEX IF NOT EXISTS token_info_name_idx 
  ON token_info USING btree (name);

-- Add index on token_info status column for filtering
CREATE INDEX IF NOT EXISTS token_info_status_idx 
  ON token_info USING btree (status);
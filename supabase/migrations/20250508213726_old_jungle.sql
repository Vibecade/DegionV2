/*
  # Add token_info and legion_api_logs tables
  
  1. New Tables
    - `token_info`: Stores detailed token information from Legion API
      - `token_id` (text, primary key)
      - `data` (jsonb, stores the token information)
      - `updated_at` (timestamp)
      
    - `legion_api_logs`: Logs API fetch operations
      - `id` (uuid, primary key)
      - `timestamp` (timestamp)
      - `projects_count` (integer)
      - `updates` (jsonb, details of update operations)
      - `success` (integer, count of successful updates)
      - `errors` (integer, count of failed updates)
      
  2. Functions
    - `create_token_info_table`: Function to create token_info table if it doesn't exist
    
  3. Security
    - Enable RLS on all tables
    - Add policies for read/write access
*/

-- Create token_info table
CREATE TABLE IF NOT EXISTS token_info (
  token_id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create legion_api_logs table
CREATE TABLE IF NOT EXISTS legion_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  projects_count integer NOT NULL,
  updates jsonb NOT NULL,
  success integer NOT NULL,
  errors integer NOT NULL
);

-- Enable RLS
ALTER TABLE token_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE legion_api_logs ENABLE ROW LEVEL SECURITY;

-- Create function to create token_info table
CREATE OR REPLACE FUNCTION create_token_info_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'token_info'
  ) THEN
    CREATE TABLE token_info (
      token_id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    
    ALTER TABLE token_info ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- Add policies for token_info
CREATE POLICY "Allow public read access to token_info"
  ON token_info
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role full access to token_info"
  ON token_info
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add policies for legion_api_logs
CREATE POLICY "Allow service role full access to legion_api_logs"
  ON legion_api_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read legion_api_logs"
  ON legion_api_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS token_info_updated_at_idx ON token_info (updated_at);
CREATE INDEX IF NOT EXISTS legion_api_logs_timestamp_idx ON legion_api_logs (timestamp);
/*
  # Update dune_sales_data table policies

  This migration checks if policies already exist before creating them to avoid errors.
*/

-- Check if the table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dune_sales_data') THEN
    CREATE TABLE dune_sales_data (
      id integer PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    
    ALTER TABLE dune_sales_data ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check if the read policy exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dune_sales_data' 
    AND policyname = 'Allow public read access to dune_sales_data'
  ) THEN
    CREATE POLICY "Allow public read access to dune_sales_data"
      ON dune_sales_data
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Check if the update policy exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dune_sales_data' 
    AND policyname = 'Allow anonymous users to update dune_sales_data'
  ) THEN
    CREATE POLICY "Allow anonymous users to update dune_sales_data"
      ON dune_sales_data
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
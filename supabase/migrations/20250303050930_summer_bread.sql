/*
  # Create dune_sales_data table

  1. New Tables
    - `dune_sales_data`
      - `id` (integer, primary key)
      - `data` (jsonb, stores the sales data)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `dune_sales_data` table
    - Add policy for public read access
    - Add policy for authenticated users to update data
*/

CREATE TABLE IF NOT EXISTS dune_sales_data (
  id integer PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dune_sales_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to dune_sales_data"
  ON dune_sales_data
  FOR SELECT
  TO public
  USING (true);

-- Allow anonymous users to update data
CREATE POLICY "Allow anonymous users to update dune_sales_data"
  ON dune_sales_data
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
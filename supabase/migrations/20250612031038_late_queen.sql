/*
  # Add ATH and ATL columns to token_prices table

  1. Changes
    - Add `ath` (numeric) column for All-Time High price
    - Add `atl` (numeric) column for All-Time Low price
    - Add `ath_date` (timestamp) column for ATH date
    - Add `atl_date` (timestamp) column for ATL date

  2. Performance
    - Add indexes for ATH/ATL queries
*/

-- Add ATH column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'ath'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN ath numeric;
  END IF;
END $$;

-- Add ATL column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'atl'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN atl numeric;
  END IF;
END $$;

-- Add ATH date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'ath_date'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN ath_date timestamptz;
  END IF;
END $$;

-- Add ATL date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'atl_date'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN atl_date timestamptz;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS token_prices_ath_idx ON token_prices (ath);
CREATE INDEX IF NOT EXISTS token_prices_atl_idx ON token_prices (atl);
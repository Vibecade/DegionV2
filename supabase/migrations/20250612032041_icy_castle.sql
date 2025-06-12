/*
  # Add ATH/ATL columns to token_prices table

  1. Schema Changes
    - Add `ath` column (numeric) - All-time high price
    - Add `atl` column (numeric) - All-time low price  
    - Add `ath_date` column (text) - Date when ATH was reached
    - Add `atl_date` column (text) - Date when ATL was reached

  2. Notes
    - All new columns are nullable to maintain compatibility with existing data
    - Uses numeric type for price precision
    - Uses text type for dates to store ISO strings from CoinGecko API
*/

-- Add ATH (All-Time High) column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'ath'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN ath numeric;
  END IF;
END $$;

-- Add ATL (All-Time Low) column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'atl'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN atl numeric;
  END IF;
END $$;

-- Add ATH date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'ath_date'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN ath_date text;
  END IF;
END $$;

-- Add ATL date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_prices' AND column_name = 'atl_date'
  ) THEN
    ALTER TABLE token_prices ADD COLUMN atl_date text;
  END IF;
END $$;
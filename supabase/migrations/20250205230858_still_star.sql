/*
  # Add discussion forum

  1. New Tables
    - `discussions`
      - `id` (uuid, primary key)
      - `token_id` (text, references tokens)
      - `title` (text)
      - `content` (text)
      - `author_ip` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `comments`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, references discussions)
      - `content` (text)
      - `author_ip` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Allow public to read all discussions and comments
    - Allow anonymous users to create discussions and comments
*/

CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  author_ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to discussions"
  ON discussions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

-- Allow anonymous users to create discussions and comments
CREATE POLICY "Allow anonymous users to create discussions"
  ON discussions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to create comments"
  ON comments
  FOR INSERT
  TO anon
  WITH CHECK (true);
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Get client IP and hash it
async function getAuthorHash(): Promise<string> {
  const response = await fetch('https://api.ipify.org?format=json');
  const { ip } = await response.json();
  return hashIP(ip);
}

function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function getDiscussions(tokenId: string) {
  const { data, error } = await supabase
    .from('discussions')
    .select(`
      *,
      comments (
        *
      )
    `)
    .eq('token_id', tokenId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching discussions:', error);
    return [];
  }

  return data;
}

export async function createDiscussion(tokenId: string, title: string, content: string) {
  const authorIp = await getAuthorHash();

  const { data, error } = await supabase
    .from('discussions')
    .insert({
      token_id: tokenId,
      title,
      content,
      author_ip: authorIp
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating discussion:', error);
    throw error;
  }

  return data;
}

export async function addComment(discussionId: string, content: string) {
  const authorIp = await getAuthorHash();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      discussion_id: discussionId,
      content,
      author_ip: authorIp
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
}
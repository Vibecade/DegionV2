import { createClient } from '@supabase/supabase-js';
import { TokenSentiment } from '../types';
import { RateLimiter } from '../utils/rateLimiter';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Create rate limiters
const voteRateLimiter = new RateLimiter(5, 60 * 1000); // 5 votes per minute

// Simple hash function for IP addresses
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function getTokenSentiment(tokenId: string): Promise<TokenSentiment> {
  try {
    const { data, error } = await supabase
      .from('token_sentiment')
      .select('sentiment')
      .eq('token_id', tokenId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching sentiment:', error);
      return { rocket: 0, poop: 0 };
    }

    const sentiment = data.reduce((acc, vote) => {
      acc[vote.sentiment as 'rocket' | 'poop']++;
      return acc;
    }, { rocket: 0, poop: 0 });

    return sentiment;
  } catch (error) {
    console.error('Error in getTokenSentiment:', error);
    return { rocket: 0, poop: 0 };
  }
}

export async function submitVote(tokenId: string, sentiment: 'rocket' | 'poop'): Promise<boolean> {
  try {
    // Get client IP using a service
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();
    const ipHash = hashIP(ip);

    // Check rate limit
    if (!voteRateLimiter.tryRequest(ipHash)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Get client IP using a service
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();
    const ipHash = hashIP(ip);

    const { error } = await supabase
      .from('token_sentiment')
      .insert({
        token_id: tokenId,
        sentiment,
        ip_hash: ipHash
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        console.log('User has already voted for this token');
      } else {
        console.error('Error submitting vote:', error);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in submitVote:', error);
    return false;
  }
}
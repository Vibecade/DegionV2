import { TokenSentiment } from '../types';
import { RateLimiter } from '../utils/rateLimiter';
import { supabase, isSupabaseAvailable } from './supabaseClient';
import { validateInput } from '../utils/security';
import { useNotifications } from '../components/NotificationSystem';

// Create rate limiters
const voteRateLimiter = new RateLimiter(3, 60 * 1000); // 3 votes per minute (more restrictive)
const sentimentRateLimiter = new RateLimiter(10, 60 * 1000); // 10 sentiment fetches per minute

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

// Get client IP and hash it
async function getAuthorHash(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    return hashIP(ip);
  } catch (error) {
    // Fallback to a random hash if IP service fails
    return hashIP(Math.random().toString());
  }
}

export async function getTokenSentiment(tokenId: string): Promise<TokenSentiment> {
  try {
    // Validate input
    if (!validateInput.tokenId(tokenId)) {
      throw new Error('Invalid token ID');
    }
    
    if (!isSupabaseAvailable) {
      console.warn('Sentiment feature not available - Supabase not configured');
      return { rocket: 0, poop: 0 };
    }

    const authorHash = await getAuthorHash();
    
    // Check rate limit for sentiment fetching
    if (!sentimentRateLimiter.tryRequest(authorHash)) {
      console.warn('Sentiment fetch rate limit exceeded');
      return { rocket: 0, poop: 0 };
    }

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

export async function submitVote(
  tokenId: string, 
  sentiment: 'rocket' | 'poop',
  onOptimisticUpdate?: (newSentiment: TokenSentiment) => void
): Promise<boolean> {
  try {
    // Validate inputs
    if (!validateInput.tokenId(tokenId)) {
      throw new Error('Invalid token ID');
    }
    
    if (!['rocket', 'poop'].includes(sentiment)) {
      throw new Error('Invalid sentiment value');
    }
    
    if (!isSupabaseAvailable) {
      console.warn('Voting feature not available - Supabase not configured');
      return false;
    }

    const authorHash = await getAuthorHash();

    // Check rate limit
    if (!voteRateLimiter.tryRequest(authorHash)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Perform optimistic update if callback provided
    if (onOptimisticUpdate) {
      // Get current sentiment to calculate optimistic update
      const currentSentiment = await getTokenSentiment(tokenId);
      const optimisticSentiment = {
        ...currentSentiment,
        [sentiment]: currentSentiment[sentiment] + 1
      };
      onOptimisticUpdate(optimisticSentiment);
    }

    const { error } = await supabase
      .from('token_sentiment')
      .insert({
        token_id: tokenId,
        sentiment,
        ip_hash: authorHash
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        console.log('User has already voted for this token');
        // Revert optimistic update
        if (onOptimisticUpdate) {
          const currentSentiment = await getTokenSentiment(tokenId);
          onOptimisticUpdate(currentSentiment);
        }
        return false;
      } else {
        console.error('Error submitting vote:', error);
        // Revert optimistic update
        if (onOptimisticUpdate) {
          const currentSentiment = await getTokenSentiment(tokenId);
          onOptimisticUpdate(currentSentiment);
        }
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in submitVote:', error);
    // Revert optimistic update on error
    if (onOptimisticUpdate) {
      try {
        const currentSentiment = await getTokenSentiment(tokenId);
        onOptimisticUpdate(currentSentiment);
      } catch (revertError) {
        console.error('Failed to revert optimistic update:', revertError);
      }
    }
    return false;
  }
}
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tokens } from '../data/tokens';
import { SEOHead } from '../components/SEOHead';
import { getDiscussions, createDiscussion, addComment } from '../services/discussion';
import { useAnnouncement } from '../hooks/useAccessibility';
import { useNotifications } from '../components/NotificationSystem';
import { MessageSquarePlus, MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';

export const DiscussionPage = () => {
  const { tokenId } = useParams();
  const token = tokens.find(t => t.id.toLowerCase() === tokenId?.toLowerCase());
  const announce = useAnnouncement();
  const { addNotification } = useNotifications();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [newComment, setNewComment] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<{ [discussionId: string]: any[] }>({});

  // Generate SEO data
  const seoTitle = token ? `${token.name} Discussions - Community Sentiment & Analysis | Degion.xyz` : 'Token Not Found | Degion.xyz';
  const seoDescription = token ? `Join the ${token.name} community discussion. Share insights, analysis, and sentiment about ${token.name} token performance and future prospects.` : 'Token not found on Degion.xyz';

  useEffect(() => {
    if (tokenId) {
      loadDiscussions();
    }
  }, [tokenId]);

  const loadDiscussions = async () => {
    if (!tokenId) return;
    setIsLoading(true);
    try {
      const data = await getDiscussions(tokenId);
      setDiscussions(data);
      announce(`Loaded ${data.length} discussions`, 'polite');
    } catch (err) {
      setError('Failed to load discussions');
      announce('Failed to load discussions', 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId || !newDiscussion.title || !newDiscussion.content) return;

    // Create optimistic discussion
    const optimisticDiscussion = {
      id: `temp-${Date.now()}`,
      token_id: tokenId,
      title: newDiscussion.title,
      content: newDiscussion.content,
      author_ip: 'temp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      comments: [],
      isOptimistic: true
    };

    // Add optimistic discussion to UI
    setDiscussions(prev => [optimisticDiscussion, ...prev]);
    setNewDiscussion({ title: '', content: '' });
    
    addNotification({
      type: 'info',
      title: 'Creating Discussion',
      message: 'Your discussion is being created...'
    });

    try {
      await createDiscussion(tokenId, newDiscussion.title, newDiscussion.content);
      await loadDiscussions();
      
      addNotification({
        type: 'success',
        title: 'Discussion Created',
        message: 'Your discussion has been created successfully!'
      });
      announce('Discussion created successfully', 'polite');
    } catch (err) {
      // Remove optimistic discussion on error
      setDiscussions(prev => prev.filter(d => d.id !== optimisticDiscussion.id));
      setNewDiscussion({ title: newDiscussion.title, content: newDiscussion.content });
      
      setError('Failed to create discussion');
      addNotification({
        type: 'error',
        title: 'Failed to Create Discussion',
        message: 'There was an error creating your discussion. Please try again.'
      });
      announce('Failed to create discussion', 'assertive');
    }
  };

  const handleAddComment = async (discussionId: string) => {
    if (!newComment) return;

    // Create optimistic comment
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      discussion_id: discussionId,
      content: newComment,
      author_ip: 'temp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isOptimistic: true
    };

    // Add optimistic comment to UI
    setOptimisticComments(prev => ({
      ...prev,
      [discussionId]: [...(prev[discussionId] || []), optimisticComment]
    }));
    
    const commentText = newComment;
    setNewComment('');
    setSelectedDiscussion(null);
    
    addNotification({
      type: 'info',
      title: 'Adding Comment',
      message: 'Your comment is being added...'
    });

    try {
      await addComment(discussionId, commentText, (comment) => {
        if (comment.shouldRemove) {
          // Remove optimistic comment on error
          setOptimisticComments(prev => ({
            ...prev,
            [discussionId]: (prev[discussionId] || []).filter(c => c.id !== comment.id)
          }));
        }
      });
      
      // Clear optimistic comment and reload actual data
      setOptimisticComments(prev => ({
        ...prev,
        [discussionId]: []
      }));
      await loadDiscussions();
      
      addNotification({
        type: 'success',
        title: 'Comment Added',
        message: 'Your comment has been added successfully!'
      });
      announce('Comment added successfully', 'polite');
    } catch (err) {
      // Remove optimistic comment and restore form
      setOptimisticComments(prev => ({
        ...prev,
        [discussionId]: (prev[discussionId] || []).filter(c => c.id !== optimisticComment.id)
      }));
      setNewComment(commentText);
      setSelectedDiscussion(discussionId);
      
      setError('Failed to add comment');
      addNotification({
        type: 'error',
        title: 'Failed to Add Comment',
        message: 'There was an error adding your comment. Please try again.'
      });
      announce('Failed to add comment', 'assertive');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-8">
        <SEOHead 
          title="Token Not Found | Degion.xyz"
          description="The requested token was not found on Degion.xyz"
        />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#00ffee] mb-4 font-orbitron">Token Not Found</h1>
          <Link to="/" className="btn-outline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-4 sm:p-8">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={`https://degion.xyz/${tokenId}/discussions`}
      />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-4">
            <Link 
              to="/"
              className="inline-flex items-center text-[#00ffee] hover:text-[#37fffc] transition-colors group"
              aria-label="Return to home page"
            >
              <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
            <Link 
              to={`/${tokenId}`}
              className="text-[#00ffee] hover:text-[#37fffc] transition-colors"
              aria-label={`View ${token.name} details`}
            >
              {token.name}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
            <span className="text-gray-300">Discussions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00ffee] font-orbitron">{token.name} Discussions</h1>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Create New Discussion */}
        <div className="glass-panel rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#00ffee] mb-4 flex items-center font-orbitron">
            <MessageSquarePlus className="w-5 h-5 mr-2" />
            Start a New Discussion
          </h2>
          <form onSubmit={handleCreateDiscussion} className="space-y-4">
            <input
              type="text"
              placeholder="Discussion Title"
              value={newDiscussion.title}
              onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-black/20 border border-[rgba(0,255,238,0.2)] rounded-lg p-3 text-[#cfd0d1] focus:outline-none focus:border-[#00ffee] transition-colors"
            />
            <textarea
              placeholder="Discussion Content"
              value={newDiscussion.content}
              onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
              className="w-full bg-black/20 border border-[rgba(0,255,238,0.2)] rounded-lg p-3 text-[#cfd0d1] focus:outline-none focus:border-[#00ffee] transition-colors h-32"
            />
            <button
              type="submit"
              className="btn-primary"
            >
              Create Discussion
            </button>
          </form>
        </div>

        {/* Discussions List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00ffee] mb-2"></div>
            <p>Loading discussions...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12 bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)]">
            <div className="mb-4 text-[#00ffee]/50">
              <MessageSquarePlus className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-400 mb-2">No discussions yet.</p>
            <p className="text-sm text-gray-500">Be the first to start one!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {discussions.map((discussion) => (
              <div
                key={discussion.id}
                className={`glass-panel rounded-lg p-6 hover-card ${
                  discussion.isOptimistic ? 'opacity-75 animate-pulse border-blue-500/30' : ''
                }`}
              >
                {discussion.isOptimistic && (
                  <div className="mb-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      Creating discussion...
                    </div>
                  </div>
                )}
                <h3 className="text-xl font-bold text-[#00ffee] mb-2 font-orbitron">{discussion.title}</h3>
                <p className="text-gray-300 mb-4 bg-black/20 p-3 rounded-lg border border-[rgba(0,255,238,0.05)]">{discussion.content}</p>
                <div className="text-sm text-gray-400 mb-4">
                  Posted {new Date(discussion.created_at).toLocaleDateString()}
                </div>

                {/* Comments */}
                {(discussion.comments?.length > 0 || optimisticComments[discussion.id]?.length > 0) && (
                  <div className="ml-8 space-y-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Comments</h4>
                    
                    {/* Real comments */}
                    {discussion.comments.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="bg-black/20 border border-[rgba(0,255,238,0.1)] rounded-lg p-4"
                      >
                        <p className="text-gray-300">{comment.content}</p>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    
                    {/* Optimistic comments */}
                    {optimisticComments[discussion.id]?.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="bg-black/20 border border-blue-500/30 rounded-lg p-4 opacity-75 animate-pulse"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-blue-400 text-xs">Adding comment...</span>
                        </div>
                        <p className="text-gray-300">{comment.content}</p>
                        <div className="text-xs text-gray-400 mt-2">
                          Just now
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="mt-4">
                  {selectedDiscussion === discussion.id ? (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-black/20 border border-[rgba(0,255,238,0.2)] rounded-lg p-3 text-[#cfd0d1] focus:outline-none focus:border-[#00ffee] transition-colors h-20"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setSelectedDiscussion(null)}
                          className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddComment(discussion.id)}
                          className="btn-primary"
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedDiscussion(discussion.id)}
                      className="flex items-center text-[#00ffee] hover:text-[#37fffc] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Add Comment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
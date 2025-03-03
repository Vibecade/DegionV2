import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tokens } from '../data/tokens';
import { getDiscussions, createDiscussion, addComment } from '../services/discussion';
import { MessageSquarePlus, MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';

export const DiscussionPage = () => {
  const { tokenId } = useParams();
  const token = tokens.find(t => t.id.toLowerCase() === tokenId?.toLowerCase());
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [newComment, setNewComment] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (err) {
      setError('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId || !newDiscussion.title || !newDiscussion.content) return;

    try {
      await createDiscussion(tokenId, newDiscussion.title, newDiscussion.content);
      setNewDiscussion({ title: '', content: '' });
      await loadDiscussions();
    } catch (err) {
      setError('Failed to create discussion');
    }
  };

  const handleAddComment = async (discussionId: string) => {
    if (!newComment) return;

    try {
      await addComment(discussionId, newComment);
      setNewComment('');
      setSelectedDiscussion(null);
      await loadDiscussions();
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#00ffee] mb-4 font-orbitron">Token Not Found</h1>
          <Link to="/" className="btn-outline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-4">
            <Link 
              to="/"
              className="inline-flex items-center text-[#00ffee] hover:text-[#37fffc] transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
            <Link 
              to={`/${tokenId}`}
              className="text-[#00ffee] hover:text-[#37fffc] transition-colors"
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
                className="glass-panel rounded-lg p-6 hover-card"
              >
                <h3 className="text-xl font-bold text-[#00ffee] mb-2 font-orbitron">{discussion.title}</h3>
                <p className="text-gray-300 mb-4 bg-black/20 p-3 rounded-lg border border-[rgba(0,255,238,0.05)]">{discussion.content}</p>
                <div className="text-sm text-gray-400 mb-4">
                  Posted {new Date(discussion.created_at).toLocaleDateString()}
                </div>

                {/* Comments */}
                {discussion.comments && discussion.comments.length > 0 && (
                  <div className="ml-8 space-y-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Comments</h4>
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Heart, ChevronDown, ChevronUp, Plus, X, Send, TrendingUp, Clock, Search, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { useApp } from '../context/AppContext';
import {
  type ApiCommunityPost,
  createCommunityCommentApi,
  createCommunityPostApi,
  getErrorMessage,
  getCommunityPostsApi,
  reportCommunityContentApi,
  toggleCommunityLikeApi,
} from '../lib/api';

const fallbackTags = ['All', 'Session Prep', 'Triggers', 'Wins', 'Homework', 'Boundaries', 'Anxiety', 'General'];
const PAGE_SIZE = 12;

function relativeTime(value: string) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return 'just now';
  }
}

function mergeUniquePosts(prev: ApiCommunityPost[], next: ApiCommunityPost[]) {
  const map = new Map<string, ApiCommunityPost>();
  for (const item of prev) map.set(item.id, item);
  for (const item of next) map.set(item.id, item);
  return Array.from(map.values());
}

export function Discussions() {
  const { token } = useApp();

  const [discussions, setDiscussions] = useState<ApiCommunityPost[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(fallbackTags);
  const [reportReasons, setReportReasons] = useState<string[]>(['Other']);
  const [activeTag, setActiveTag] = useState('All');
  const [sortBy, setSortBy] = useState<'trending' | 'recent'>('trending');
  const [replyFilter, setReplyFilter] = useState<'all' | 'with' | 'without'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTag, setNewTag] = useState('General');

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [myAlias, setMyAlias] = useState('Anonymous');

  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isPostingReplyFor, setIsPostingReplyFor] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const loadDiscussions = useCallback(async (options?: { append?: boolean; cursor?: string | null }) => {
    if (!token) return;

    const append = Boolean(options?.append);
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getCommunityPostsApi(token, {
        tag: activeTag,
        sort: sortBy,
        search: debouncedSearch,
        replies: replyFilter,
        cursor: options?.cursor ?? null,
        limit: PAGE_SIZE,
      });

      setDiscussions(prev => (append ? mergeUniquePosts(prev, response.posts) : response.posts));
      setAvailableTags(response.tags.length > 0 ? response.tags : fallbackTags);
      setReportReasons(response.reportReasons.length > 0 ? response.reportReasons : ['Other']);
      setMyAlias(response.viewerAlias || 'Anonymous');
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load community posts.'));
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [activeTag, debouncedSearch, replyFilter, sortBy, token]);

  useEffect(() => {
    setExpandedId(null);
    void loadDiscussions({ append: false, cursor: null });
  }, [loadDiscussions]);

  const handleLikeDiscussion = async (id: string) => {
    if (!token) {
      toast.error('Please log in first.');
      return;
    }

    const current = discussions.find(d => d.id === id);
    if (!current) return;

    const optimisticLiked = !current.liked;
    const optimisticLikes = current.likes + (optimisticLiked ? 1 : -1);

    setDiscussions(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              liked: optimisticLiked,
              likes: Math.max(0, optimisticLikes),
            }
          : d,
      ),
    );

    try {
      const response = await toggleCommunityLikeApi(token, {
        targetType: 'post',
        targetId: id,
      });

      setDiscussions(prev =>
        prev.map(d =>
          d.id === id
            ? {
                ...d,
                liked: response.liked,
                likes: response.likes,
              }
            : d,
        ),
      );
    } catch {
      void loadDiscussions({ append: false, cursor: null });
      toast.error('Could not update like right now.');
    }
  };

  const handleLikeReply = async (discussionId: string, replyId: string) => {
    if (!token) {
      toast.error('Please log in first.');
      return;
    }

    const discussion = discussions.find(d => d.id === discussionId);
    const reply = discussion?.replies.find(r => r.id === replyId);
    if (!reply) return;

    const optimisticLiked = !reply.liked;
    const optimisticLikes = reply.likes + (optimisticLiked ? 1 : -1);

    setDiscussions(prev =>
      prev.map(d =>
        d.id !== discussionId
          ? d
          : {
              ...d,
              replies: d.replies.map(r =>
                r.id === replyId
                  ? {
                      ...r,
                      liked: optimisticLiked,
                      likes: Math.max(0, optimisticLikes),
                    }
                  : r,
              ),
            },
      ),
    );

    try {
      const response = await toggleCommunityLikeApi(token, {
        targetType: 'comment',
        targetId: replyId,
      });

      setDiscussions(prev =>
        prev.map(d =>
          d.id !== discussionId
            ? d
            : {
                ...d,
                replies: d.replies.map(r =>
                  r.id === replyId
                    ? {
                        ...r,
                        liked: response.liked,
                        likes: response.likes,
                      }
                    : r,
                ),
              },
        ),
      );
    } catch {
      void loadDiscussions({ append: false, cursor: null });
      toast.error('Could not update like right now.');
    }
  };

  const handleNewPost = async () => {
    if (!token) {
      toast.error('Please log in first.');
      return;
    }

    if (!newTitle.trim() || !newBody.trim()) {
      toast.error('Please add a title and body for your post.');
      return;
    }

    setIsCreatingPost(true);
    try {
      await createCommunityPostApi(token, {
        title: newTitle.trim(),
        body: newBody.trim(),
        tag: newTag,
      });

      setNewTitle('');
      setNewBody('');
      setNewTag('General');
      setShowNewPost(false);
      toast.success('Post shared anonymously.');
      await loadDiscussions({ append: false, cursor: null });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to share post.'));
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleReply = async (discussionId: string) => {
    if (!token) {
      toast.error('Please log in first.');
      return;
    }

    if (!replyText.trim()) return;

    setIsPostingReplyFor(discussionId);
    try {
      const response = await createCommunityCommentApi(token, {
        postId: discussionId,
        body: replyText.trim(),
      });

      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId
            ? {
                ...d,
                replies: [...d.replies, response.comment],
                repliesCount: d.repliesCount + 1,
              }
            : d,
        ),
      );

      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply posted.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to post reply.'));
    } finally {
      setIsPostingReplyFor(null);
    }
  };

  const handleReport = async (targetType: 'post' | 'comment', targetId: string) => {
    if (!token) {
      toast.error('Please log in first.');
      return;
    }

    const defaultReason = reportReasons[0] || 'Other';
    const reasonInput = window.prompt(`Reason (${reportReasons.join(', ')}):`, defaultReason);
    if (!reasonInput) return;

    const reason = reportReasons.find(option => option.toLowerCase() === reasonInput.trim().toLowerCase());
    if (!reason) {
      toast.error('Please use one of the listed report reasons.');
      return;
    }

    const detailsInput = window.prompt('Optional details (max 500 chars):', '');
    const details = detailsInput ? detailsInput.slice(0, 500) : undefined;

    try {
      const response = await reportCommunityContentApi(token, {
        targetType,
        targetId,
        reason,
        details,
      });

      if (response.duplicate) {
        toast('Already reported. Thanks for flagging this.', { duration: 2500 });
      } else {
        toast.success('Report submitted. Thanks for helping keep community safe.');
      }

      await loadDiscussions({ append: false, cursor: null });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to submit report.'));
    }
  };

  const tags = useMemo(() => (availableTags.length > 0 ? availableTags : fallbackTags), [availableTags]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px' }}>
            Community
          </h1>
          <p className="text-muted-foreground text-[14px]">
            Anonymous discussions with people who get it. Real posts, real replies.
          </p>
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-terracotta text-white rounded-lg text-[14px] hover:bg-terracotta/90 transition-all active:translate-y-px flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-sage/20 flex items-center justify-center text-sage text-[11px]">
          {myAlias.split(' ').map(w => w[0]).join('')}
        </div>
        <span className="text-[13px] text-muted-foreground">
          You're posting as <strong className="text-foreground">{myAlias}</strong>
        </span>
        <span className="text-[11px] text-muted-foreground ml-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          anonymous
        </span>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search posts, replies, topics..."
            className="w-full bg-input-background border border-border rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-terracotta/40"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => setSortBy('trending')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
              sortBy === 'trending' ? 'bg-terracotta/10 text-terracotta' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Trending
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
              sortBy === 'recent' ? 'bg-terracotta/10 text-terracotta' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3 h-3" /> Recent
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => setReplyFilter('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
              replyFilter === 'all' ? 'bg-sage text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setReplyFilter('with')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
              replyFilter === 'with' ? 'bg-sage text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            With replies
          </button>
          <button
            onClick={() => setReplyFilter('without')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
              replyFilter === 'without' ? 'bg-sage text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            No replies
          </button>
        </div>

        <div className="w-full" />

        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                activeTag === tag ? 'bg-terracotta text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {showNewPost && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Start a discussion</h3>
            <button onClick={() => setShowNewPost(false)} className="p-1 rounded hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            placeholder="What's on your mind?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-[14px] text-foreground placeholder-muted-foreground/60 outline-none focus:border-terracotta/40 mb-3 transition-colors"
          />
          <textarea
            placeholder="Share more details..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            rows={4}
            className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-[14px] text-foreground placeholder-muted-foreground/60 outline-none focus:border-terracotta/40 mb-3 resize-none transition-colors"
          />
          <div className="flex items-center justify-between">
            <select
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-[13px] text-foreground outline-none"
            >
              {tags.filter(t => t !== 'All').map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={() => void handleNewPost()}
              disabled={isCreatingPost}
              className="flex items-center gap-1.5 px-4 py-2 bg-terracotta text-white rounded-lg text-[13px] hover:bg-terracotta/90 transition-all disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" /> {isCreatingPost ? 'Posting...' : 'Post anonymously'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center text-[13px] text-muted-foreground">
            Loading community posts...
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-[14px]">No discussions match these filters yet.</p>
          </div>
        ) : (
          discussions.map(d => (
            <div key={d.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground/20 transition-colors">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-terracotta/15 flex items-center justify-center text-terracotta text-[10px]">
                    {d.alias.split(' ').map(w => w[0]).join('')}
                  </div>
                  <span className="text-[13px] text-foreground">{d.alias}</span>
                  <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {relativeTime(d.createdAt)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground ml-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {d.tag}
                  </span>
                </div>

                <h3
                  className="text-foreground mb-2 cursor-pointer hover:text-terracotta transition-colors"
                  style={{ fontSize: '15px' }}
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                >
                  {d.title}
                </h3>

                <p className={`text-muted-foreground text-[13px] leading-relaxed ${expandedId === d.id ? '' : 'line-clamp-2'}`}>
                  {d.body}
                </p>

                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => void handleLikeDiscussion(d.id)}
                    className={`flex items-center gap-1.5 text-[13px] transition-colors ${
                      d.liked ? 'text-terracotta' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${d.liked ? 'fill-current' : ''}`} /> {d.likes}
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> {d.repliesCount} {d.repliesCount === 1 ? 'reply' : 'replies'}
                    {expandedId === d.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => void handleReport('post', d.id)}
                    className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                </div>
              </div>

              {expandedId === d.id && (
                <div className="border-t border-border bg-secondary/30">
                  {d.replies.map(r => (
                    <div key={r.id} className="px-5 py-4 border-b border-border last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-sage/15 flex items-center justify-center text-sage text-[9px]">
                          {r.alias.split(' ').map(w => w[0]).join('')}
                        </div>
                        <span className="text-[12px] text-foreground">{r.alias}</span>
                        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {relativeTime(r.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[13px] leading-relaxed ml-8 mb-2">{r.body}</p>
                      <div className="flex items-center gap-3 ml-8">
                        <button
                          onClick={() => void handleLikeReply(d.id, r.id)}
                          className={`flex items-center gap-1 text-[12px] transition-colors ${
                            r.liked ? 'text-terracotta' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${r.liked ? 'fill-current' : ''}`} /> {r.likes}
                        </button>
                        <button
                          onClick={() => void handleReport('comment', r.id)}
                          className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Flag className="w-3.5 h-3.5" /> Report
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="px-5 py-4">
                    {replyingTo === d.id ? (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center text-sage text-[9px] mt-1 flex-shrink-0">
                          {myAlias.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            autoFocus
                            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder-muted-foreground/60 outline-none focus:border-terracotta/40 resize-none transition-colors"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => void handleReply(d.id)}
                              disabled={isPostingReplyFor === d.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-terracotta text-white rounded-md text-[12px] hover:bg-terracotta/90 transition-all disabled:opacity-60"
                            >
                              <Send className="w-3 h-3" /> {isPostingReplyFor === d.id ? 'Posting...' : 'Reply'}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(d.id)}
                        className="text-[13px] text-muted-foreground hover:text-terracotta transition-colors"
                      >
                        + Add a reply
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={() => {
              if (!nextCursor || isLoadingMore) return;
              void loadDiscussions({ append: true, cursor: nextCursor });
            }}
            disabled={isLoadingMore || !nextCursor}
            className="px-4 py-2 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      <div className="mt-8 bg-card border border-border rounded-xl p-5">
        <h4 className="text-foreground text-[14px] mb-2">Community guidelines</h4>
        <ul className="text-[12px] text-muted-foreground space-y-1.5 leading-relaxed">
          <li>&#8226; All posts are anonymous. Your identity is represented by an alias.</li>
          <li>&#8226; Be kind. Everyone here is working through something.</li>
          <li>&#8226; Don't share identifying personal information (yours or others').</li>
          <li>&#8226; Links and contact info are blocked for safety.</li>
          <li>&#8226; This is not a substitute for therapy or crisis support.</li>
          <li>&#8226; If you or someone is in crisis, contact 988 Suicide & Crisis Lifeline (call/text 988).</li>
        </ul>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '../ui';
import { Comment } from '@/types';
import { format } from 'date-fns';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => void;
  onDeleteComment?: (id: string) => void;
  currentUser?: string;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  currentUser,
  level = 0
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  onDelete?: (id: string) => void;
  currentUser?: string;
  level?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id);
      setReplyContent('');
      setShowReplyForm(false);
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {comment.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-gray-900">{comment.author}</div>
              <div className="text-xs text-gray-500">
                {format(new Date(comment.timestamp), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
          </div>

          {currentUser === comment.author && onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          )}
        </div>

        <p className="text-gray-700 mb-3">{comment.content}</p>

        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Reply
        </button>

        {showReplyForm && (
          <div className="mt-3 pt-3 border-t">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowReplyForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmitReply}>
                Reply
              </Button>
            </div>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUser={currentUser}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({
  comments,
  onAddComment,
  onDeleteComment,
  currentUser
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleReply = (parentId: string) => {
    // This would be called from CommentItem with reply content
    // Implementation depends on your specific needs
  };

  // Organize comments into a tree structure
  const rootComments = comments.filter(c => !c.parentId);

  return (
    <Card>
      <CardHeader
        title="Comments"
        subtitle={`${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
      />

      <CardContent>
        {/* New Comment Form */}
        <div className="mb-6">
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleSubmit} disabled={!newComment.trim()}>
              Add Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {rootComments.length > 0 ? (
            rootComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onDelete={onDeleteComment}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

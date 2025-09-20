'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

// Define types for the comment and user
interface CommentUser {
  id: number;
  name: string | null;
}

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentsSectionProps {
  articleId: number;
  isUserLoggedIn: boolean;
}

export const CommentsSection = ({ articleId, isUserLoggedIn }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [articleId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const createdComment = await response.json();
        // Add the new comment to the top of the list
        setComments([createdComment, ...comments]);
        setNewComment('');
      } else {
        console.error("Failed to post comment");
        // Optionally, show an error to the user
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isUserLoggedIn ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder="نظر خود را بنویسید..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-24"
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'در حال ارسال...' : 'ارسال نظر'}
          </Button>
        </form>
      ) : (
        <div className="text-center py-8 text-journal-light border rounded-lg">
          <p className="text-lg mb-4">برای مشاهده و ارسال نظرات وارد حساب کاربری خود شوید</p>
          <Link href="/login">
            <Button variant="outline">ورود به حساب کاربری</Button>
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {isLoading ? (
          <p>در حال بارگذاری نظرات...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar>
                <AvatarFallback>{comment.user.name?.charAt(0) || '؟'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-journal">{comment.user.name || 'کاربر ناشناس'}</span>
                  <span className="text-xs text-journal-light">
                    {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(comment.createdAt))}
                  </span>
                </div>
                <p className="text-journal-light mt-2">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-journal-light py-4">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
        )}
      </div>
    </div>
  );
};

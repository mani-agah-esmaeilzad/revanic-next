'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
  articleId: number;
  initialLikes: number;
  initialLiked: boolean;
}

export const LikeButton = ({ articleId, initialLikes, initialLiked }: LikeButtonProps) => {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLike = async () => {
    setIsLoading(true);

    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      const response = await fetch(`/api/articles/${articleId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // If the token is expired or invalid, the middleware should have caught it,
        // but if the API fails for other reasons, we revert the state.
        if (response.status === 401) {
            router.push('/login');
            return;
        }
        // Revert optimistic update on failure
        setLiked(liked);
        setLikes(likes);
        console.error("Failed to update like status");
      } else {
        // Optionally, update state with response from server
        const data = await response.json();
        setLikes(data.likes);
      }
    } catch (error) {
      // Revert optimistic update on network error
      setLiked(liked);
      setLikes(likes);
      console.error("An error occurred:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleLike} disabled={isLoading} className="flex items-center gap-2">
      <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : 'text-journal-light'}`} />
      <span>{likes}</span>
    </Button>
  );
};

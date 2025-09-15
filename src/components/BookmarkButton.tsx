'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
  articleId: number;
  initialBookmarked: boolean;
}

export const BookmarkButton = ({ articleId, initialBookmarked }: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBookmark = async () => {
    setIsLoading(true);

    // Optimistic update
    setIsBookmarked(!isBookmarked);

    try {
      const response = await fetch(`/api/articles/${articleId}/bookmark`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        // Revert on failure
        setIsBookmarked(isBookmarked);
        console.error("Failed to update bookmark status");
      }
      // We can optionally refresh the router if bookmarks affect other parts of the page
      // router.refresh();
    } catch (error) {
      // Revert on network error
      setIsBookmarked(isBookmarked);
      console.error("An error occurred:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleBookmark} disabled={isLoading} size="icon">
      <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-yellow-400 text-yellow-500' : 'text-journal-light'}`} />
    </Button>
  );
};

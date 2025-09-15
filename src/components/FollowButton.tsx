'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  targetUserId: number;
  initialFollowing: boolean;
}

export const FollowButton = ({ targetUserId, initialFollowing }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFollow = async () => {
    setIsLoading(true);

    // Optimistic update
    setIsFollowing(!isFollowing);

    try {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        // Revert on failure
        setIsFollowing(isFollowing);
        console.error("Failed to update follow status");
      }
    } catch (error) {
      // Revert on network error
      setIsFollowing(isFollowing);
      console.error("An error occurred:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleFollow} disabled={isLoading} variant={isFollowing ? 'outline' : 'default'}>
      {isFollowing ? (
        <>
          <UserCheck className="ml-2 h-4 w-4" />
          دنبال می‌کنید
        </>
      ) : (
        <>
          <UserPlus className="ml-2 h-4 w-4" />
          دنبال کردن
        </>
      )}
    </Button>
  );
};

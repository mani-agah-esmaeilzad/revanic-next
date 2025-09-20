
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Hand } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ClapButtonProps {
  articleId: number;
  initialTotalClaps: number;
  initialUserClaps: number;
}

export const ClapButton = ({ articleId, initialTotalClaps, initialUserClaps }: ClapButtonProps) => {
  const [totalClaps, setTotalClaps] = useState(initialTotalClaps);
  const [userClaps, setUserClaps] = useState(initialUserClaps);
  const [isClapping, setIsClapping] = useState(false);
  const [clapQueue, setClapQueue] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (clapQueue === 0) return;

    const handler = setTimeout(() => {
      setIsClapping(true);
      fetch(`/api/articles/${articleId}/clap`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: clapQueue })
      })
      .then(res => {
        if (!res.ok) {
            if (res.status === 401) router.push('/login');
            
            setTotalClaps(prev => prev - clapQueue);
            setUserClaps(prev => prev - clapQueue);
        }
        return res.json();
      })
      .then(data => {
        if(data) {
            setTotalClaps(data.totalClaps);
            setUserClaps(data.userClaps);
        }
      })
      .catch(error => {
        console.error("An error occurred:", error);
        setTotalClaps(prev => prev - clapQueue);
        setUserClaps(prev => prev - clapQueue);
      })
      .finally(() => {
        setIsClapping(false);
        setClapQueue(0);
      });
    }, 500); 

    return () => clearTimeout(handler);
  }, [clapQueue, articleId, router]);


  const handleClap = () => {
    if (userClaps >= 50) return;
    
    
    setClapQueue(prev => prev + 1);
    setTotalClaps(prev => prev + 1);
    setUserClaps(prev => prev + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        onClick={handleClap} 
        disabled={isClapping || userClaps >= 50} 
        className={cn("rounded-full h-10 w-10 p-0 relative overflow-hidden transition-colors", 
            userClaps > 0 ? "border-journal-green bg-journal-green/10 text-journal-green" : "border-border"
        )}
        >
        <Hand className="h-5 w-5" />
        {userClaps > 0 && 
            <span className="absolute top-0 right-0 h-5 w-5 bg-journal-green text-white text-xs rounded-full flex items-center justify-center">
                {userClaps}
            </span>
        }
      </Button>
      <span className="text-sm text-journal-light font-medium">{totalClaps.toLocaleString('fa-IR')}</span>
    </div>
  );
};
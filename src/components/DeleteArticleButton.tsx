'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteArticleButtonProps {
  articleId: number;
}

export const DeleteArticleButton = ({ articleId }: DeleteArticleButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("آیا از حذف این مقاله اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to show the updated list of articles
        router.refresh();
      } else {
        alert("خطا در حذف مقاله. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Failed to delete article:", error);
      alert("خطای شبکه در حذف مقاله.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
};

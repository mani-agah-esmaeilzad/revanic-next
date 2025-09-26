// src/components/CommentsSection.tsx
"use client";

import { useState, useMemo, FC } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Prisma } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageSquare, CornerDownRight } from "lucide-react";
import Link from "next/link";

// =======================================================================
//  1. تعریف تایپ‌ها و Schema
// =======================================================================

const commentFormSchema = z.object({
  text: z.string().min(1, "متن نظر نمی‌تواند خالی باشد.").max(1000, "نظر شما بیش از حد طولانی است."),
});

type CommentFormData = z.infer<typeof commentFormSchema>;

type CommentWithUser = Prisma.CommentGetPayload<{
  include: { user: { select: { id: true, name: true, avatarUrl: true } } };
}>;

// تایپ جدید برای نمایش تو در تو
interface CommentWithReplies extends CommentWithUser {
  replies: CommentWithReplies[];
}

interface CommentsSectionProps {
  articleId: number;
  initialComments: CommentWithUser[];
  currentUserId: number | null;
}

interface CommentProps {
  comment: CommentWithReplies;
  onReply: (commentId: number, text: string) => Promise<void>;
  currentUserId: number | null;
  articleId: number;
}

interface CommentFormProps {
  articleId: number;
  parentId?: number | null;
  onCommentPosted: (newComment: CommentWithUser) => void;
  placeholder?: string;
  buttonText?: string;
}


// =======================================================================
//  2. کامپوننت فرم ارسال نظر (برای نظرات اصلی و پاسخ‌ها)
// =======================================================================
const CommentForm: FC<CommentFormProps> = ({ articleId, parentId = null, onCommentPosted, placeholder, buttonText }) => {
  const { toast } = useToast();
  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { text: "" },
  });

  const mutation = useMutation<CommentWithUser, Error, CommentFormData>({
    mutationFn: async (data) => {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, parentId }),
      });
      if (!response.ok) {
        throw new Error("Failed to post comment");
      }
      return response.json();
    },
    onSuccess: (newComment) => {
      onCommentPosted(newComment);
      form.reset();
      toast({ title: "موفقیت", description: "نظر شما با موفقیت ثبت شد." });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ارسال نظر. لطفاً دوباره تلاش کنید.", variant: "destructive" });
    }
  });

  const onSubmit: SubmitHandler<CommentFormData> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder={placeholder || "نظر خود را بنویسید..."} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          {buttonText || 'ارسال نظر'}
        </Button>
      </form>
    </Form>
  );
};


// =======================================================================
//  3. کامپوننت نمایش یک نظر (Recursive Component)
// =======================================================================
const Comment: FC<CommentProps> = ({ comment, onReply, currentUserId, articleId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const commentDate = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.createdAt));

  const handleReplyPosted = (newReply: CommentWithUser) => {
    // This function doesn't need to do anything here, because the parent state handles it
    setShowReplyForm(false);
  }

  return (
    <div className="flex gap-4">
      <Link href={`/authors/${comment.user.id}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user.avatarUrl || ""} />
          <AvatarFallback>{comment.user.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/authors/${comment.user.id}`} className="font-bold">{comment.user.name}</Link>
          <span className="text-xs text-muted-foreground">{commentDate}</span>
        </div>
        <p className="text-sm my-2">{comment.text}</p>
        {currentUserId && (
          <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)}>
            <CornerDownRight className="ml-2 h-4 w-4" />
            پاسخ
          </Button>
        )}

        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              articleId={articleId}
              parentId={comment.id}
              onCommentPosted={handleReplyPosted}
              placeholder={`در پاسخ به ${comment.user.name}...`}
              buttonText="ارسال پاسخ"
            />
          </div>
        )}

        {/* بخش نمایش پاسخ‌ها */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pr-6 border-r-2">
            {comment.replies.map(reply => (
              <Comment key={reply.id} comment={reply} onReply={onReply} currentUserId={currentUserId} articleId={articleId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// =======================================================================
//  4. کامپوننت اصلی بخش نظرات
// =======================================================================
export const CommentsSection: FC<CommentsSectionProps> = ({ articleId, initialComments, currentUserId }) => {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);

  const handleCommentPosted = (newComment: CommentWithUser) => {
    setComments(prev => [...prev, newComment]);
  }

  // این تابع نظرات صاف را به ساختار درختی تبدیل می‌کند
  const nestedComments = useMemo(() => {
    const commentMap: { [key: number]: CommentWithReplies } = {};
    const rootComments: CommentWithReplies[] = [];

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Second pass: link replies to their parents
    comments.forEach(comment => {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    return rootComments;
  }, [comments]);


  return (
    <section>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare />
        نظرات ({comments.length})
      </h2>

      {/* فرم ارسال نظر اصلی */}
      {currentUserId ? (
        <div className="mb-8">
          <CommentForm articleId={articleId} onCommentPosted={handleCommentPosted} />
        </div>
      ) : (
        <p className="mb-8 text-center text-muted-foreground">
          برای ثبت نظر، لطفاً <Link href="/login" className="text-primary hover:underline">وارد شوید</Link>.
        </p>
      )}

      {/* لیست نظرات */}
      <div className="space-y-6">
        {nestedComments.length > 0 ? (
          nestedComments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              onReply={() => Promise.resolve()} // The main form handles adding replies
              currentUserId={currentUserId}
              articleId={articleId}
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
        )}
      </div>
    </section>
  );
};
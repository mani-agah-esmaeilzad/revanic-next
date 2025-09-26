// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the estimated reading time for a given text.
 * @param htmlContent The HTML content of the article.
 * @returns The estimated reading time in minutes.
 */
export function calculateReadTime(htmlContent: string): number {
  // 1. Remove HTML tags to get plain text
  const text = htmlContent.replace(/<[^>]*>?/gm, '');
  // 2. Split text into words
  const words = text.trim().split(/\s+/).length;
  // 3. Calculate minutes (230 words per minute is a standard average)
  const wordsPerMinute = 230;
  const readTime = Math.ceil(words / wordsPerMinute);
  // 4. Return at least 1 minute for very short texts
  return Math.max(1, readTime);
}
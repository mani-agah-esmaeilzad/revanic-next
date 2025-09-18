// src/components/editor/Toolbar.tsx
"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link,
  Image as ImageIcon, // تغییر نام برای جلوگیری از تداخل با تگ Image
  Loader2, // برای نمایش وضعیت لودینگ آپلود
} from "lucide-react";
import { useCallback, useRef, useState } from "react"; // ایمپورت‌های جدید
import { Toggle } from "@/components/ui/toggle";

type Props = {
  editor: Editor | null;
};

export const Toolbar = ({ editor }: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تابع برای مدیریت افزودن یا ویرایش لینک
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("آدرس لینک را وارد کنید", previousUrl);

    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // --- تابع برای مدیریت آپلود و درج تصویر ---
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !event.target.files?.length) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("آپلود تصویر با خطا مواجه شد.");
    } finally {
      setIsUploading(false);
      // ریست کردن اینپوت فایل تا بتوان فایل مشابه را دوباره انتخاب کرد
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-t-md p-2 flex flex-wrap gap-1 bg-transparent">
      {/* دکمه‌های فرمت‌دهی اصلی متن */}
      <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <div className="w-[1px] bg-muted-foreground/20 mx-1"></div>

      {/* دکمه‌های هِدینگ‌ها */}
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </Toggle>
      
      <div className="w-[1px] bg-muted-foreground/20 mx-1"></div>

      {/* دکمه‌های لیست‌ها */}
      <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      
      <div className="w-[1px] bg-muted-foreground/20 mx-1"></div>

      {/* دکمه‌های بلاک‌های خاص */}
      <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("codeBlock")} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code className="h-4 w-4" />
      </Toggle>

      <div className="w-[1px] bg-muted-foreground/20 mx-1"></div>

      {/* دکمه‌های مربوط به مدیا */}
      <Toggle size="sm" pressed={editor.isActive("link")} onPressedChange={setLink}>
        <Link className="h-4 w-4" />
      </Toggle>

      {/* --- دکمه نهایی برای آپلود و درج تصویر --- */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
      />
      <Toggle
        size="sm"
        onPressedChange={() => fileInputRef.current?.click()}
        disabled={isUploading}
        aria-label="Add image"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      </Toggle>
    </div>
  );
};
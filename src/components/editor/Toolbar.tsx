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
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  editor: Editor | null;
};

export function Toolbar({ editor }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert("خطا در آپلود تصویر.");
        console.error("Image upload failed:", await response.text());
      }
    } catch (error) {
      console.error("Image upload error:", error);
      alert("خطای شبکه هنگام آپلود.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    
    // اگر لینکی وجود ندارد یا خالی است، لینک را حذف کن
    if (linkUrl === null || linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkDialogOpen(false);
      return;
    }

    // در غیر این صورت لینک را تنظیم کن
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setIsLinkDialogOpen(false);
  }, [editor, linkUrl]);
  
  const openLinkDialog = () => {
    if (!editor) return;
    setLinkUrl(editor.getAttributes('link').href || '');
    setIsLinkDialogOpen(true);
  }

  if (!editor) {
    return null;
  }

  return (
    <>
      <div className="border border-input bg-transparent rounded-t-md p-2 flex items-center flex-wrap gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-8 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-8 mx-1" />
        
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-8 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={openLinkDialog}
        >
          <Link className="h-4 w-4" />
        </Toggle>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <Toggle
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Toggle>
      </div>

      {/* --- دیالوگ برای افزودن/ویرایش لینک --- */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن/ویرایش لینک</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>لغو</Button>
            <Button onClick={handleSetLink}>تایید</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
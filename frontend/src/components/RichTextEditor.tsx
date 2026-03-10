"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Link2Off,
  Heading2,
  Heading3,
  Code,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder = "Digite o conteúdo da aula...",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] p-3 focus:outline-none prose prose-sm max-w-none dark:prose-invert",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync editor content when value changes from outside (e.g. after API fetch)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalized = current === "<p></p>" ? "" : current;
    if (normalized !== value) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const url = window.prompt("URL do link:");
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded hover:bg-muted transition-colors",
        active && "bg-muted text-primary"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
        <ToolbarButton
          title="Negrito"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Itálico"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Código"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton
          title="Título H2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Título H3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton
          title="Lista com marcadores"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Citação"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton title="Link" onClick={setLink} active={editor.isActive("link")}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Remover link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Link2Off className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;

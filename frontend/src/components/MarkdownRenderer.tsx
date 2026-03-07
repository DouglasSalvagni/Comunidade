import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownRendererProps = {
  content: string;
  className?: string;
  proseClassName?: string;
  format?: "auto" | "markdown" | "html";
};

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

export default function MarkdownRenderer({
  content,
  className,
  proseClassName,
  format = "auto",
}: MarkdownRendererProps) {
  const resolvedFormat = format === "auto" && looksLikeHtml(content) ? "html" : format;

  if (resolvedFormat === "html") {
    return (
      <div
        className={cn("prose max-w-none", proseClassName, className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={cn("prose max-w-none", proseClassName, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}


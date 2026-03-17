"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api, CommunityPost, CommunitySpace } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostAttachments } from "@/components/community/PostAttachments";
import { Heart, MessageCircle, Paperclip, Pin, Send } from "lucide-react";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const ACCEPTED_TYPES = new Set(["application/pdf"]);

function isAllowedContentType(contentType: string) {
  return contentType.startsWith("image/") || ACCEPTED_TYPES.has(contentType);
}

export default function DashboardCommunitySpacePage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const selectedSpace = useMemo(() => spaces.find((s) => s.id === spaceId) || null, [spaces, spaceId]);

  const load = async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const [allSpaces, feed] = await Promise.all([
        api.getCommunitySpaces(),
        api.getCommunitySpaceFeed(spaceId, { limit: 50 }),
      ]);
      setSpaces(allSpaces);
      setPosts(feed);
    } catch {
      toast.error("Não foi possível carregar o canal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [spaceId]);

  const onPickFiles = (inputFiles: FileList | null) => {
    if (!inputFiles) return;
    const next = Array.from(inputFiles);
    const valid: File[] = [];
    for (const file of next) {
      if (!isAllowedContentType(file.type)) {
        toast.error(`Tipo de arquivo inválido: ${file.name}`);
        continue;
      }
      valid.push(file);
    }
    setFiles((current) => [...current, ...valid].slice(0, 4));
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const createPost = async () => {
    if (!spaceId || !contentHtml.trim()) {
      toast.error("Escreva o conteúdo do post.");
      return;
    }

    setCreating(true);
    try {
      const post = await api.createCommunityPost(spaceId, {
        title: title.trim() || undefined,
        contentHtml,
      });

      for (const file of files) {
        const { uploadUrl, key } = await api.getCommunityPostAttachmentUploadUrl(post.id, file.name, file.type);
        const upload = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!upload.ok) {
          throw new Error(`Falha no upload do arquivo ${file.name}`);
        }
        await api.addCommunityPostAttachment(post.id, {
          fileKey: key,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
      }

      setTitle("");
      setContentHtml("");
      setFiles([]);
      await load();
      toast.success("Post publicado.");
    } catch {
      toast.error("Não foi possível publicar o post.");
    } finally {
      setCreating(false);
    }
  };

  const toggleLike = async (postId: string) => {
    const previous = posts;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, likesCount: post.likesCount + 1 } : post,
      ),
    );
    try {
      const updated = await api.toggleCommunityPostLike(postId);
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, likesCount: updated.likesCount } : post,
        ),
      );
    } catch {
      setPosts(previous);
      toast.error("Não foi possível curtir o post.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">{selectedSpace?.name || "Canal da comunidade"}</h1>
        <p className="text-sm text-muted-foreground">{selectedSpace?.description || "Converse com a comunidade neste espaço."}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Título opcional"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={180}
          />
          <RichTextEditor
            value={contentHtml}
            onChange={setContentHtml}
            placeholder="Compartilhe algo com o canal..."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" asChild>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(event) => onPickFiles(event.target.files)}
                />
                <Paperclip className="h-4 w-4 mr-2" />
                Anexar
              </label>
            </Button>
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <Badge key={`${file.name}-${index}`} variant="secondary" className="cursor-pointer" onClick={() => removeFile(index)}>
                  {file.name}
                </Badge>
              ))}
            </div>
            <Button type="button" className="ml-auto" onClick={createPost} disabled={creating}>
              <Send className="h-4 w-4 mr-2" />
              {creating ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  {post.author?.name || "Membro"} • {new Date(post.createdAt).toLocaleString()}
                </div>
                {post.isPinned && (
                  <Badge variant="outline">
                    <Pin className="h-3 w-3 mr-1" />
                    Fixado
                  </Badge>
                )}
              </div>
              {post.title && <CardTitle className="text-xl">{post.title}</CardTitle>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              {(post.attachments || []).length > 0 && (
                <PostAttachments attachments={post.attachments || []} />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => toggleLike(post.id)}>
                  <Heart className="h-4 w-4 mr-1" />
                  {post.likesCount}
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/community/post/${post.id}`}>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.commentsCount} comentários
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

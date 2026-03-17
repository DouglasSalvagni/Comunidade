"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api, CommunityPost, CommunitySpace } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostAttachments } from "@/components/community/PostAttachments";
import { Heart, MessageCircle, Paperclip, Pin, Send, ChevronDown, ChevronUp, MoreHorizontal, Edit2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const ACCEPTED_TYPES = new Set(["application/pdf"]);

function isAllowedContentType(contentType: string) {
  return contentType.startsWith("image/") || ACCEPTED_TYPES.has(contentType);
}

export default function DashboardCommunitySpacePage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingPostEdit, setSavingPostEdit] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostTitle, setEditingPostTitle] = useState("");
  const [editingPostContentHtml, setEditingPostContentHtml] = useState("");
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const selectedSpace = useMemo(() => spaces.find((s) => s.id === spaceId) || null, [spaces, spaceId]);

  const load = async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const [allSpaces, feed, profile] = await Promise.all([
        api.getCommunitySpaces(),
        api.getCommunitySpaceFeed(spaceId, { limit: 50 }),
        api.getProfile(),
      ]);
      setSpaces(allSpaces);
      setPosts(feed);
      setCurrentUserId(profile.id);
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

  const startEditingPost = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setEditingPostTitle(post.title || "");
    setEditingPostContentHtml(post.contentHtml);
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditingPostTitle("");
    setEditingPostContentHtml("");
  };

  const savePostEdit = async () => {
    if (!editingPostId || !editingPostContentHtml.trim()) {
      toast.error("Escreva o conteúdo do post.");
      return;
    }
    setSavingPostEdit(true);
    try {
      await api.updateCommunityPost(editingPostId, {
        title: editingPostTitle,
        contentHtml: editingPostContentHtml,
      });
      await load();
      cancelEditingPost();
      toast.success("Post atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o post.");
    } finally {
      setSavingPostEdit(false);
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
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="pb-4 border-b">
        <h1 className="text-3xl font-extrabold tracking-tight">{selectedSpace?.name || "Canal da comunidade"}</h1>
        <p className="text-base text-muted-foreground mt-2">{selectedSpace?.description || "Converse com a comunidade neste espaço."}</p>
      </div>

      <Card className="border-muted/50 shadow-sm bg-muted/20">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <Input
            placeholder="Título do post (opcional)"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={180}
            className="border-transparent bg-background shadow-none focus-visible:ring-1 text-lg font-medium"
          />
          <div className="bg-background rounded-md border border-transparent focus-within:border-border focus-within:ring-1 focus-within:ring-ring transition-all">
            <RichTextEditor
              value={contentHtml}
              onChange={setContentHtml}
              placeholder="Compartilhe algo com o canal..."
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
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
                  <Badge key={`${file.name}-${index}`} variant="secondary" className="cursor-pointer font-normal" onClick={() => removeFile(index)}>
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button type="button" onClick={createPost} disabled={creating} className="rounded-full px-6">
              <Send className="h-4 w-4 mr-2" />
              {creating ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {posts.map((post) => {
          const isExpanded = expandedPosts.has(post.id);
          const authorName = post.author?.name || "Membro";
          const authorInitials = authorName.substring(0, 2).toUpperCase();

          return (
            <Card key={post.id} className="overflow-hidden border-muted/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-muted">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{authorInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {post.editedAt ? ` (Editado)` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.isPinned && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent">
                        <Pin className="h-3 w-3 mr-1" />
                        Fixado
                      </Badge>
                    )}
                    {currentUserId === post.authorId && editingPostId !== post.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditingPost(post)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                {post.title && <CardTitle className="text-xl mt-4 font-bold tracking-tight">{post.title}</CardTitle>}
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 pt-2">
                {editingPostId === post.id ? (
                  <div className="space-y-4 bg-muted/10 p-4 rounded-lg border border-muted/50">
                    <Input
                      placeholder="Título opcional"
                      value={editingPostTitle}
                      onChange={(event) => setEditingPostTitle(event.target.value)}
                      maxLength={180}
                      className="bg-background"
                    />
                    <div className="bg-background rounded-md">
                      <RichTextEditor value={editingPostContentHtml} onChange={setEditingPostContentHtml} />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={cancelEditingPost} disabled={savingPostEdit}>
                        Cancelar
                      </Button>
                      <Button type="button" onClick={savePostEdit} disabled={savingPostEdit}>
                        {savingPostEdit ? "Salvando..." : "Salvar edição"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className={`prose prose-sm max-w-none dark:prose-invert transition-all duration-200 ${!isExpanded ? 'line-clamp-4 mask-image-fade' : ''}`} 
                      dangerouslySetInnerHTML={{ __html: post.contentHtml }} 
                    />
                    
                    {!isExpanded && (post.attachments || []).length > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> {(post.attachments || []).length} anexo(s)
                      </div>
                    )}

                    {isExpanded && (post.attachments || []).length > 0 && (
                      <div className="mt-6">
                        <PostAttachments attachments={post.attachments || []} />
                      </div>
                    )}

                    <div className="mt-2">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="px-0 h-auto text-primary/80 hover:text-primary font-medium"
                        onClick={() => togglePostExpansion(post.id)}
                      >
                        {isExpanded ? (
                          <><ChevronUp className="h-4 w-4 mr-1" /> Mostrar menos</>
                        ) : (
                          <><ChevronDown className="h-4 w-4 mr-1" /> Mostrar mais</>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="p-4 sm:p-6 pt-0 flex items-center gap-4 text-muted-foreground border-t border-muted/20 bg-muted/5">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleLike(post.id)}
                  className="hover:text-primary hover:bg-primary/10 rounded-full"
                >
                  <Heart className={`h-4 w-4 mr-2 ${post.likesCount > 0 ? 'fill-current text-primary' : ''}`} />
                  {post.likesCount}
                </Button>
                <Button asChild variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/10 rounded-full">
                  <Link href={`/dashboard/community/post/${post.id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {post.commentsCount}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        
        {posts.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            <p>Nenhum post encontrado. Seja o primeiro a compartilhar!</p>
          </div>
        )}
      </div>
    </div>
  );
}

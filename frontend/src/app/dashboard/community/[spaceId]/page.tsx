"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api, CommunityPost, CommunitySpace, User } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostAttachments } from "@/components/community/PostAttachments";
import { Heart, MessageCircle, Paperclip, Pin, Send, ChevronDown, ChevronUp, MoreHorizontal, Edit2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PostSkeleton } from "@/components/community/PostSkeleton";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const ACCEPTED_TYPES = new Set(["application/pdf"]);
const FEED_DELAY_MS = Math.max(0, Number(process.env.NEXT_PUBLIC_COMMUNITY_FEED_DELAY_MS ?? 2000) || 0);

function isAllowedContentType(contentType: string) {
  return contentType.startsWith("image/") || ACCEPTED_TYPES.has(contentType);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DashboardCommunitySpacePage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

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

  const description = selectedSpace?.description || "Converse com a comunidade neste espaço.";
  const isLongDescription = description.length > 280;
  const displayedDescription = isLongDescription && !isDescriptionExpanded 
    ? description.substring(0, 280) + "..." 
    : description;

  const loadFeed = async (options?: { reset?: boolean; cursor?: string | null; searchTerm?: string }) => {
    if (!spaceId) return;
    const response = await api.getCommunitySpaceFeed(spaceId, {
      limit: Number(process.env.NEXT_PUBLIC_COMMUNITY_FEED_LIMIT_POSTS ?? 10),
      cursor: options?.cursor || undefined,
      search: options?.searchTerm?.trim() ? options.searchTerm.trim() : undefined,
    });
    const isScrollPagination = Boolean(options?.cursor);
    if (isScrollPagination && FEED_DELAY_MS > 0) {
      await wait(FEED_DELAY_MS);
    }

    setHasMore(response.meta.hasMore);
    setNextCursor(response.meta.nextCursor);
    if (options?.reset) {
      setPosts(response.data);
      return;
    }

    setPosts((current) => {
      const currentIds = new Set(current.map((post) => post.id));
      const appended = response.data.filter((post) => !currentIds.has(post.id));
      return [...current, ...appended];
    });
  };

  const triggerLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      await loadFeed({ cursor: nextCursor, searchTerm: search });
    } catch {
      toast.error("Não foi possível carregar mais posts.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, nextCursor, search]);

  const load = async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const [allSpaces, profile] = await Promise.all([
        api.getCommunitySpaces(),
        api.getProfile(),
      ]);
      setSpaces(allSpaces);
      setCurrentUserId(profile.id);
      setProfile(profile);
    } catch {
      toast.error("Não foi possível carregar o canal.");
    }
  };

  useEffect(() => {
    load();
  }, [spaceId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!spaceId) return;
    setIsFeedLoading(true);
    loadFeed({ reset: true, searchTerm: search })
      .catch(() => toast.error("Não foi possível carregar o feed."))
      .finally(() => {
        setLoading(false);
        setIsFeedLoading(false);
      });
  }, [spaceId, search]);

  useEffect(() => {
    if (!observerRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        void triggerLoadMore();
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, triggerLoadMore]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const checkAndLoad = () => {
      if (!observerRef.current || !nextCursor) return;
      const rect = observerRef.current.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 200) {
        void triggerLoadMore();
      }
    };

    checkAndLoad();
    window.addEventListener("scroll", checkAndLoad, true);
    window.addEventListener("resize", checkAndLoad);
    return () => {
      window.removeEventListener("scroll", checkAndLoad, true);
      window.removeEventListener("resize", checkAndLoad);
    };
  }, [hasMore, loading, loadingMore, nextCursor, triggerLoadMore, posts.length]);

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
      await loadFeed({ reset: true, searchTerm: search });
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
      await loadFeed({ reset: true, searchTerm: search });
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
      <div className="space-y-8 max-w-4xl mx-auto py-6">
        <div className="pb-4 border-b">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-6" />
          <div className="mt-4">
            <Skeleton className="h-10 max-w-md rounded-md" />
          </div>
        </div>

        <Card className="border-muted/50 shadow-sm bg-card">
          <CardContent className="p-4 sm:p-6 flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-md" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="pb-4 border-b mb-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {selectedSpace?.name || "Canal da comunidade"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed transition-all duration-300">
              {displayedDescription}
              {isLongDescription && (
                <Button 
                  variant="link"
                  size="sm"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="ml-2 h-auto p-0 text-primary hover:underline font-medium focus:outline-none"
                >
                  {isDescriptionExpanded ? "Mostrar menos" : "Mostrar mais"}
                </Button>
              )}
            </p>
          </div>
          <div className="w-full max-w-xl relative group">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar discussões, dúvidas e conteúdos..."
                className="pl-12 h-14 rounded-full border-2 border-muted hover:border-primary/50 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm hover:shadow-md transition-all duration-300 text-lg bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${searchInput.length > 0 ? "max-h-0 opacity-0 mb-0" : "max-h-[800px] opacity-100 mb-8"}`}>
        <Card className="border-muted/50 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-6 flex gap-4">
          <Avatar className="h-10 w-10 border border-muted hidden sm:block shrink-0">
            <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.name || "Meu Perfil"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {(profile?.name || "U").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4 min-w-0">
            <Input
              placeholder="Título do post (opcional)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={180}
              className="border-none bg-muted/30 shadow-none focus-visible:ring-0 text-lg font-medium px-4 h-12 rounded-lg"
            />
            <div className="bg-background rounded-md border border-input focus-within:ring-1 focus-within:ring-ring transition-all">
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
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="space-y-6">
        {isFeedLoading ? (
          <div className="space-y-6">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : (
          <>
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
                      <AvatarImage src={post.author?.avatarUrl || undefined} alt={authorName} />
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
            <p>{search ? "Nenhum post encontrado para a busca." : "Nenhum post encontrado. Seja o primeiro a compartilhar!"}</p>
          </div>
        )}

        {posts.length > 0 && (
          <div ref={observerRef} className="py-2">
            {loadingMore && (
              <div className="space-y-6">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            )}
          </div>
        )}
        </>
      )}
      </div>
    </div>
  );
}

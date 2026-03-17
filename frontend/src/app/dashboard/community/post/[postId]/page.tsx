"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api, CommunityComment, CommunityPost } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PostAttachments } from "@/components/community/PostAttachments";
import { ArrowLeft, CornerDownRight, Heart, MessageCircle, Send, MoreHorizontal, Edit2, CornerUpLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

type CommentWithReplies = CommunityComment & { replies: CommunityComment[] };

export default function DashboardCommunityPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [savingPostEdit, setSavingPostEdit] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editingPostTitle, setEditingPostTitle] = useState("");
  const [editingPostContentHtml, setEditingPostContentHtml] = useState("");
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentHtml, setEditingCommentHtml] = useState("");
  const [commentHtml, setCommentHtml] = useState("");
  const [replyTo, setReplyTo] = useState<CommentWithReplies | null>(null);
  const [replyHtml, setReplyHtml] = useState("");

  const backHref = useMemo(() => {
    if (!post?.spaceId) return "/dashboard/community";
    return `/dashboard/community/${post.spaceId}`;
  }, [post?.spaceId]);

  const load = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const [postData, commentsData, profile] = await Promise.all([
        api.getCommunityPost(postId),
        api.listCommunityPostComments(postId, { limit: 20 }),
        api.getProfile(),
      ]);
      setPost(postData);
      setComments(commentsData.data);
      setCursor(commentsData.meta.nextCursor);
      setHasMore(commentsData.meta.hasMore);
      setCurrentUserId(profile.id);
    } catch {
      toast.error("Não foi possível carregar o post.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const loadMoreComments = async () => {
    if (!postId || !cursor) return;
    try {
      const next = await api.listCommunityPostComments(postId, { limit: 20, cursor });
      setComments((current) => [...current, ...next.data]);
      setCursor(next.meta.nextCursor);
      setHasMore(next.meta.hasMore);
    } catch {
      toast.error("Falha ao carregar mais comentários.");
    }
  };

  const toggleLike = async () => {
    if (!postId || !post) return;
    try {
      const updated = await api.toggleCommunityPostLike(postId);
      setPost({ ...post, likesCount: updated.likesCount });
    } catch {
      toast.error("Não foi possível curtir o post.");
    }
  };

  const submitComment = async () => {
    if (!postId || !commentHtml.trim()) {
      toast.error("Escreva seu comentário.");
      return;
    }
    setPosting(true);
    try {
      await api.createCommunityComment(postId, { contentHtml: commentHtml });
      setCommentHtml("");
      await load();
    } catch {
      toast.error("Não foi possível comentar.");
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async () => {
    if (!postId || !replyTo || !replyHtml.trim()) {
      toast.error("Escreva sua resposta.");
      return;
    }
    setPosting(true);
    try {
      await api.createCommunityComment(postId, {
        contentHtml: replyHtml,
        parentCommentId: replyTo.id,
      });
      setReplyHtml("");
      setReplyTo(null);
      await load();
    } catch {
      toast.error("Não foi possível responder.");
    } finally {
      setPosting(false);
    }
  };

  const startEditingPost = () => {
    if (!post) return;
    setEditingPost(true);
    setEditingPostTitle(post.title || "");
    setEditingPostContentHtml(post.contentHtml);
  };

  const cancelEditingPost = () => {
    setEditingPost(false);
    setEditingPostTitle("");
    setEditingPostContentHtml("");
  };

  const savePostEdit = async () => {
    if (!postId || !editingPostContentHtml.trim()) {
      toast.error("Escreva o conteúdo do post.");
      return;
    }
    setSavingPostEdit(true);
    try {
      const updated = await api.updateCommunityPost(postId, {
        title: editingPostTitle,
        contentHtml: editingPostContentHtml,
      });
      setPost(updated);
      cancelEditingPost();
      toast.success("Post atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o post.");
    } finally {
      setSavingPostEdit(false);
    }
  };

  const startEditingComment = (comment: CommunityComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentHtml(comment.contentHtml);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentHtml("");
  };

  const saveCommentEdit = async () => {
    if (!postId || !editingCommentId || !editingCommentHtml.trim()) {
      toast.error("Escreva o conteúdo do comentário.");
      return;
    }
    setSavingCommentEdit(true);
    try {
      await api.updateCommunityComment(postId, editingCommentId, { contentHtml: editingCommentHtml });
      await load();
      cancelEditingComment();
      toast.success("Comentário atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o comentário.");
    } finally {
      setSavingCommentEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!post) {
    return <div className="text-center text-muted-foreground py-16">Post não encontrado.</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-6">
      <Button variant="ghost" asChild className="w-fit -ml-4 text-muted-foreground hover:text-foreground">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao canal
        </Link>
      </Button>

      {/* Post Principal */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-0">
          {/* We remove padding here to make it flush if we want, but let's just use standard padding */}
          <div className="p-6 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-muted">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {(post.author?.name || "M").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">{post.author?.name || "Membro"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    {post.editedAt ? ` (Editado)` : ""}
                  </span>
                </div>
              </div>
              
              {currentUserId === post.authorId && !editingPost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={startEditingPost}>
                      <Edit2 className="h-4 w-4 mr-2" /> Editar Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {post.title && <h1 className="text-2xl font-bold mt-5 tracking-tight">{post.title}</h1>}
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-3">
          {editingPost ? (
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
                <Button variant="ghost" onClick={cancelEditingPost} disabled={savingPostEdit}>
                  Cancelar
                </Button>
                <Button onClick={savePostEdit} disabled={savingPostEdit}>
                  {savingPostEdit ? "Salvando..." : "Salvar edição"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-base max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          )}

          {!editingPost && (post.attachments || []).length > 0 && (
            <div className="mt-6">
              <PostAttachments attachments={post.attachments || []} />
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 pt-0 flex items-center gap-4 text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLike}
            className="hover:text-primary hover:bg-primary/10 rounded-full px-4"
          >
            <Heart className={`h-5 w-5 mr-2 ${post.likesCount > 0 ? 'fill-current text-primary' : ''}`} />
            <span className="font-medium">{post.likesCount}</span>
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium">
            <MessageCircle className="h-5 w-5" />
            {post.commentsCount} {post.commentsCount === 1 ? 'comentário' : 'comentários'}
          </div>
        </CardFooter>
      </Card>

      {/* Área de Comentário */}
      <div className="flex gap-4 items-start">
        <Avatar className="h-10 w-10 border border-muted hidden sm:block">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">VO</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <div className="bg-background rounded-xl border border-muted/60 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all overflow-hidden">
            <RichTextEditor value={commentHtml} onChange={setCommentHtml} placeholder="Escreva um comentário..." />
          </div>
          <div className="flex justify-end">
            <Button onClick={submitComment} disabled={posting} className="rounded-full px-6">
              <Send className="h-4 w-4 mr-2" />
              Comentar
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-muted/30 my-8"></div>

      {/* Lista de Comentários */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">Comentários ({comments.length})</h3>
        
        {comments.map((comment) => (
          <div key={comment.id} className="group">
            <div className="flex gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 border border-muted shrink-0 mt-1">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {(comment.author?.name || "M").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="bg-muted/20 p-4 rounded-2xl rounded-tl-sm border border-muted/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{comment.author?.name || "Membro"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {currentUserId === comment.authorId && editingCommentId !== comment.id && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEditingComment(comment)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="space-y-3 mt-2">
                      <div className="bg-background rounded-md">
                        <RichTextEditor value={editingCommentHtml} onChange={setEditingCommentHtml} />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelEditingComment} disabled={savingCommentEdit}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={saveCommentEdit} disabled={savingCommentEdit}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: comment.contentHtml }} />
                  )}
                </div>
                
                <div className="pl-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setReplyTo(comment)}>
                    <CornerUpLeft className="h-3 w-3 mr-1.5" />
                    Responder
                  </Button>
                </div>

                {/* Respostas (Replies) */}
                {(comment.replies || []).length > 0 && (
                  <div className="space-y-4 mt-4 pl-4 sm:pl-6 border-l-2 border-muted/30">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3 group/reply">
                        <Avatar className="h-8 w-8 border border-muted shrink-0 mt-1">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                            {(reply.author?.name || "M").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted/10 p-3 rounded-2xl rounded-tl-sm border border-muted/20">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold">{reply.author?.name || "Membro"}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              {currentUserId === reply.authorId && editingCommentId !== reply.id && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/reply:opacity-100 transition-opacity" onClick={() => startEditingComment(reply)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            
                            {editingCommentId === reply.id ? (
                              <div className="space-y-3 mt-2">
                                <div className="bg-background rounded-md">
                                  <RichTextEditor value={editingCommentHtml} onChange={setEditingCommentHtml} />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={cancelEditingComment} disabled={savingCommentEdit}>
                                    Cancelar
                                  </Button>
                                  <Button size="sm" onClick={saveCommentEdit} disabled={savingCommentEdit}>
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: reply.contentHtml }} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground">
            Seja o primeiro a comentar neste post.
          </div>
        )}
      </div>

      {replyTo && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center text-muted-foreground">
                <CornerDownRight className="h-4 w-4 mr-2" />
                Respondendo a <span className="text-foreground ml-1 font-semibold">{replyTo.author?.name || "membro"}</span>
              </span>
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setReplyTo(null)}>
                Cancelar
              </Button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-background rounded-lg border focus-within:ring-1 focus-within:ring-primary/50 overflow-hidden">
                <RichTextEditor value={replyHtml} onChange={setReplyHtml} placeholder="Escreva sua resposta..." />
              </div>
              <Button onClick={submitReply} disabled={posting} className="h-auto px-6 rounded-lg">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" className="rounded-full px-8" onClick={loadMoreComments}>
            Carregar mais comentários
          </Button>
        </div>
      )}
    </div>
  );
}

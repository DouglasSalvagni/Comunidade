"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api, CommunityComment, CommunityPost } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostAttachments } from "@/components/community/PostAttachments";
import { ArrowLeft, CornerDownRight, Heart, MessageCircle, Send } from "lucide-react";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

type CommentWithReplies = CommunityComment & { replies: CommunityComment[] };

export default function DashboardCommunityPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
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
      const [postData, commentsData] = await Promise.all([
        api.getCommunityPost(postId),
        api.listCommunityPostComments(postId, { limit: 20 }),
      ]);
      setPost(postData);
      setComments(commentsData.data);
      setCursor(commentsData.meta.nextCursor);
      setHasMore(commentsData.meta.hasMore);
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
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" asChild className="w-fit">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao canal
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="text-sm text-muted-foreground">
            {post.author?.name || "Membro"} • {new Date(post.createdAt).toLocaleString()}
          </div>
          {post.title && <CardTitle>{post.title}</CardTitle>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          {(post.attachments || []).length > 0 && (
            <PostAttachments attachments={post.attachments || []} />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleLike}>
              <Heart className="h-4 w-4 mr-1" />
              {post.likesCount}
            </Button>
            <Badge variant="outline">
              <MessageCircle className="h-3 w-3 mr-1" />
              {post.commentsCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novo comentário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RichTextEditor value={commentHtml} onChange={setCommentHtml} placeholder="Escreva seu comentário..." />
          <div className="flex justify-end">
            <Button onClick={submitComment} disabled={posting}>
              <Send className="h-4 w-4 mr-2" />
              Comentar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardHeader className="pb-2">
              <div className="text-sm text-muted-foreground">
                {comment.author?.name || "Membro"} • {new Date(comment.createdAt).toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: comment.contentHtml }} />
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => setReplyTo(comment)}>
                <CornerDownRight className="h-4 w-4 mr-1" />
                Responder
              </Button>

              {(comment.replies || []).length > 0 && (
                <div className="space-y-3 pl-4 border-l">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {reply.author?.name || "Membro"} • {new Date(reply.createdAt).toLocaleString()}
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: reply.contentHtml }} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {replyTo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Respondendo {replyTo.author?.name || "membro"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RichTextEditor value={replyHtml} onChange={setReplyHtml} placeholder="Escreva sua resposta..." />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setReplyTo(null)}>
                Cancelar
              </Button>
              <Button onClick={submitReply} disabled={posting}>
                <Send className="h-4 w-4 mr-2" />
                Responder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMoreComments}>
            Carregar mais comentários
          </Button>
        </div>
      )}
    </div>
  );
}

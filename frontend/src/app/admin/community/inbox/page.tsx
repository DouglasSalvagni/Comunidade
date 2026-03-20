"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, CommunityPost, CommunityComment } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, MessageSquare, Clock, User as UserIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { ScrollArea } from "@/components/ui/scroll-area";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor").then((mod) => mod.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-40 bg-muted animate-pulse rounded-md" />,
});

export default function AdminCommunityInboxPage() {
  const [pendingPosts, setPendingPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [replyHtml, setReplyHtml] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPendingPosts = async () => {
    try {
      const posts = await api.adminListPendingPosts();
      setPendingPosts(posts);
      if (posts.length > 0 && !selectedPost) {
        handleSelectPost(posts[0]);
      } else if (posts.length === 0) {
        setSelectedPost(null);
      }
    } catch {
      toast.error("Não foi possível carregar os posts pendentes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPosts();
  }, []);

  const handleSelectPost = async (post: CommunityPost) => {
    setSelectedPost(post);
    setReplyHtml("");
    try {
      const response = await api.listCommunityPostComments(post.id, { limit: 50 });
      setComments(response.data);
    } catch {
      toast.error("Não foi possível carregar os comentários.");
    }
  };

  const handleResolve = async (postId: string) => {
    try {
      await api.adminResolveCommunityPost(postId);
      toast.success("Post marcado como resolvido!");
      
      // Remove da lista
      const newPosts = pendingPosts.filter((p) => p.id !== postId);
      setPendingPosts(newPosts);
      
      // Seleciona o próximo se existir
      if (selectedPost?.id === postId) {
        if (newPosts.length > 0) {
          handleSelectPost(newPosts[0]);
        } else {
          setSelectedPost(null);
        }
      }
    } catch {
      toast.error("Não foi possível resolver o post.");
    }
  };

  const handleReply = async () => {
    if (!selectedPost || !replyHtml.trim() || replyHtml === "<p></p>") {
      toast.error("Digite uma resposta.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createCommunityComment(selectedPost.id, { contentHtml: replyHtml });
      toast.success("Resposta enviada e post resolvido!");
      
      // O backend automaticamente muda needsAdminAttention para false ao comentar como admin.
      // Então apenas removemos da lista localmente.
      const newPosts = pendingPosts.filter((p) => p.id !== selectedPost.id);
      setPendingPosts(newPosts);
      
      if (newPosts.length > 0) {
        handleSelectPost(newPosts[0]);
      } else {
        setSelectedPost(null);
      }
    } catch {
      toast.error("Não foi possível enviar a resposta.");
    } finally {
      setSubmitting(false);
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
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden gap-4">
      <div>
        <h1 className="text-2xl font-bold">Moderação da Comunidade</h1>
        <p className="text-muted-foreground">
          Responda às dúvidas e interações dos alunos.
        </p>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Coluna da Esquerda: Lista de Pendências */}
        <Card className="w-1/3 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b bg-muted/30">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Pendentes
              <Badge variant="secondary">{pendingPosts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="flex flex-col p-2 gap-2">
              {pendingPosts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                  <p>Tudo limpo!</p>
                  <p className="text-xs">Nenhum post pendente de resposta.</p>
                </div>
              ) : (
                pendingPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all hover:bg-muted/50 ${
                      selectedPost?.id === post.id ? "bg-muted/80 border-border" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.author?.avatarUrl || ""} />
                          <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold truncate max-w-[120px]">
                          {post.author?.name || "Usuário"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground w-full line-clamp-2">
                      {post.title ? <strong>{post.title}</strong> : "Sem título"} - {post.contentHtml.replace(/<[^>]*>?/gm, '')}
                    </div>
                    {post.space && (
                      <Badge variant="outline" className="mt-2 text-[10px] py-0">
                        {post.space.name}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Coluna da Direita: Área de Resolução */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {selectedPost ? (
            <>
              <CardHeader className="py-3 px-4 border-b bg-muted/30 flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedPost.author?.avatarUrl || ""} />
                    <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{selectedPost.title || "Postagem da Comunidade"}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Por {selectedPost.author?.name || "Usuário"} • {formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleResolve(selectedPost.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Marcar como Resolvido
                </Button>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                {/* Post Original */}
                <div className="mb-6">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: selectedPost.contentHtml }}
                  />
                  {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedPost.attachments.map((att) => (
                        <a key={att.id} href={att.viewUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 border rounded px-2 py-1 bg-muted/50 hover:bg-muted transition-colors">
                          📎 {att.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comentários Históricos */}
                {comments.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      Histórico de Respostas
                    </h3>
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-muted/30 p-3 rounded-lg border text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={comment.author?.avatarUrl || ""} />
                            <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{comment.author?.name}</span>
                          {comment.author?.role === 'admin' && (
                            <Badge variant="default" className="text-[10px] h-4 px-1 py-0">Admin</Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: comment.contentHtml }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <CardFooter className="p-4 border-t flex flex-col gap-3 bg-muted/10">
                <div className="w-full">
                  <RichTextEditor
                    content={replyHtml}
                    onChange={setReplyHtml}
                    placeholder="Digite sua resposta para o aluno..."
                  />
                </div>
                <div className="flex justify-end w-full">
                  <Button onClick={handleReply} disabled={submitting}>
                    {submitting ? "Enviando..." : "Responder e Resolver"}
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Selecione um post na lista para moderar.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
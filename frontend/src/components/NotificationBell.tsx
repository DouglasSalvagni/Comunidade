"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, Notification } from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await api.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Erro ao buscar contador de notificações", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { items } = await api.getNotifications({ limit: 10 });
      setNotifications(items);
    } catch (error) {
      console.error("Erro ao buscar notificações", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Polling a cada 60 segundos
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas", error);
    }
  };

  // Usa useIsMobile para ajustar o alinhamento do dropdown
  const isMobile = useIsMobile();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[calc(100vw-2rem)] max-w-[360px] sm:w-80 p-0" 
        align={isMobile ? "center" : "end"}
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-semibold text-sm">
            Notificações
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[60vh] max-h-[400px]">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação no momento.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex flex-col gap-1.5 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-muted/20" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id);
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium text-sm leading-tight pr-4">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="h-2 w-2 mt-1 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {notification.content}
                  </p>
                  <div className="flex items-center justify-between mt-1 pt-1">
                    <span className="text-xs text-muted-foreground/80">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1 py-1 px-2 -mr-2 rounded-md hover:bg-primary/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Ver <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

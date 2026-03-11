"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, Member } from "@/services/api";
import { Loader2, PanelRightClose, PanelRightOpen, Search, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersCursor, setMembersCursor] = useState<string | null>(null);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const nextPath = `${pathname}${search ? `?${search}` : ""}`;
  const { data: session } = useSession();

  useEffect(() => {
    const verify = async () => {
      try {
        const me = await api.getProfile();
        if (me?.authProvider === 'local' && me?.emailVerified === false) {
          router.replace('/auth/pending');
          setAuthorized(false);
        } else if (me?.role !== 'admin' && !(me as any)?.acceptedLegal) {
          if ((me as any)?.hasAcceptedAnyRequired) {
            setAuthorized(true);
          } else {
            router.replace('/auth/legal');
            setAuthorized(false);
          }
        } else {
          setAuthorized(true);
        }
      } catch (e: any) {
        const next = nextPath.startsWith("/dashboard") ? nextPath : "/dashboard";
        router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      }
      setVerifying(false);
    };
    verify();
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchDraft.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const initials = useCallback((name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, []);

  const plainBio = useCallback((html?: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }, []);

  const loadMembers = useCallback(
    async (reset = false) => {
      if (!authorized) return;
      if (reset) {
        setLoadingMembers(true);
      } else {
        setLoadingMoreMembers(true);
      }
      try {
        const response = await api.getMembers({
          limit: 20,
          search: searchQuery || undefined,
          cursor: reset ? undefined : membersCursor || undefined,
        });
        setMembers((prev) => {
          if (reset) return response.data;
          const existing = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          for (const item of response.data) {
            if (!existing.has(item.id)) merged.push(item);
          }
          return merged;
        });
        setMembersCursor(response.meta.nextCursor);
        setHasMoreMembers(!!response.meta.hasMore);
      } finally {
        if (reset) {
          setLoadingMembers(false);
        } else {
          setLoadingMoreMembers(false);
        }
      }
    },
    [authorized, membersCursor, searchQuery],
  );

  useEffect(() => {
    if (!drawerOpen || !authorized) return;
    setMembersCursor(null);
    setHasMoreMembers(false);
    loadMembers(true);
  }, [drawerOpen, searchQuery, authorized, loadMembers]);

  useEffect(() => {
    if (!drawerOpen || !hasMoreMembers || !membersCursor || loadingMoreMembers) return;
    if (!sentinelRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          loadMembers(false);
        }
      },
      { rootMargin: "120px" },
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [drawerOpen, hasMoreMembers, membersCursor, loadingMoreMembers, loadMembers]);

  const rightPanelLabel = useMemo(() => {
    return drawerOpen ? "Fechar membros" : "Abrir membros";
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen">
      {verifying && (
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Verificando acesso...</p>
          </div>
        </div>
      )}
      {!verifying && authorized && (
        <>
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex min-w-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
              <main className="flex-1 p-4 md:p-8">
                {children}
              </main>
            </div>
            <aside
              className={`hidden border-l bg-background transition-all duration-300 lg:flex ${drawerOpen ? "w-80" : "w-12"}`}
              aria-label="Membros"
            >
              <div className="flex h-screen w-full flex-col">
                <button
                  type="button"
                  aria-label={rightPanelLabel}
                  title={rightPanelLabel}
                  onClick={() => setDrawerOpen((prev) => !prev)}
                  className="flex h-12 items-center justify-center border-b text-muted-foreground hover:text-foreground"
                >
                  {drawerOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </button>
                {drawerOpen ? (
                  <>
                    <div className="border-b p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        Membros
                      </div>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchDraft}
                          onChange={(e) => setSearchDraft(e.target.value)}
                          placeholder="Buscar membros"
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {loadingMembers ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : members.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum membro encontrado.</p>
                      ) : (
                        <div className="space-y-3">
                          {members.map((member) => (
                            <div key={member.id} className="rounded-lg border p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
                                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-semibold">{member.name}</p>
                              </div>
                              {plainBio(member.bio) ? (
                                <p className="mb-2 line-clamp-3 text-xs text-muted-foreground">
                                  {plainBio(member.bio)}
                                </p>
                              ) : null}
                              {member.profileLinks?.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {member.profileLinks.slice(0, 3).map((link, index) => (
                                    <a
                                      key={`${member.id}-${index}`}
                                      href={link.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="max-w-[150px] truncate text-xs text-primary hover:underline"
                                    >
                                      {link.label}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                          {hasMoreMembers ? <div ref={sentinelRef} className="h-1 w-full" /> : null}
                          {loadingMoreMembers ? (
                            <div className="flex items-center justify-center py-3">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, Member, User } from "@/services/api";
import { Loader2, PanelRightClose, PanelRightOpen, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const membersScrollRef = useRef<HTMLDivElement | null>(null);
  const loadingMembersRef = useRef(false);
  const loadingMoreMembersRef = useRef(false);
  const hasMoreMembersRef = useRef(false);
  const requestSeqRef = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const nextPath = `${pathname}${search ? `?${search}` : ""}`;
  const [userProfile, setUserProfile] = useState<User | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const me = await api.getProfile();
        setUserProfile(me);
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
      const next = searchDraft.trim();
      setSearchQuery((prev) => (prev === next ? prev : next));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    loadingMembersRef.current = loadingMembers;
  }, [loadingMembers]);

  useEffect(() => {
    loadingMoreMembersRef.current = loadingMoreMembers;
  }, [loadingMoreMembers]);

  useEffect(() => {
    hasMoreMembersRef.current = hasMoreMembers;
  }, [hasMoreMembers]);

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
    async ({ reset = false, cursor }: { reset?: boolean; cursor?: string | null } = {}) => {
      if (!authorized) return;
      if (reset) {
        if (loadingMembersRef.current) return;
      } else {
        if (loadingMoreMembersRef.current || !hasMoreMembersRef.current || !cursor) return;
      }
      const requestSeq = ++requestSeqRef.current;
      if (reset) {
        setLoadingMembers(true);
      } else {
        setLoadingMoreMembers(true);
      }
      try {
        const response = await api.getMembers({
          limit: 20,
          search: searchQuery || undefined,
          cursor: reset ? undefined : cursor ?? undefined,
        });
        if (requestSeq !== requestSeqRef.current) return;
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
    [authorized, searchQuery],
  );

  useEffect(() => {
    if (!authorized) return;
    requestSeqRef.current += 1;
    setMembers([]);
    setMembersCursor(null);
    setHasMoreMembers(false);
    loadMembers({ reset: true });
  }, [searchQuery, authorized, loadMembers]);

  useEffect(() => {
    if (!drawerOpen) return;
    if (!hasMoreMembers || !membersCursor || loadingMoreMembers) return;
    if (!sentinelRef.current || !membersScrollRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          loadMembers({ cursor: membersCursor });
        }
      },
      { root: membersScrollRef.current, rootMargin: "120px 0px", threshold: 0.1 },
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
              <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={userProfile} />
              <main className="flex-1 p-4 md:p-8">
                {children}
              </main>
            </div>
            <aside
              className={`hidden border-l bg-background transition-all duration-300 lg:flex ${drawerOpen ? "w-80" : "w-16"}`}
              aria-label="Membros"
            >
              <div className="flex h-screen w-full flex-col">
                <button
                  type="button"
                  aria-label={rightPanelLabel}
                  title={rightPanelLabel}
                  onClick={() => setDrawerOpen((prev) => !prev)}
                  className="flex h-12 items-center justify-center border-b text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
                    <div ref={membersScrollRef} className="flex-1 overflow-y-auto p-3">
                      {loadingMembers && members.length === 0 ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : members.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum membro encontrado.</p>
                      ) : (
                        <div className="space-y-1">
                          {members.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => setSelectedMember(member)}
                              className="w-full text-left flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors group"
                            >
                              <Avatar className="h-8 w-8 border border-transparent group-hover:border-muted-foreground/20">
                                <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
                                <AvatarFallback>{initials(member.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate">{member.name}</span>
                            </button>
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
                ) : (
                  <div ref={membersScrollRef} className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-2 scrollbar-hide">
                    {loadingMembers && members.length === 0 ? (
                       <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        {members.map((member) => (
                          <button
                             key={member.id}
                             onClick={() => setSelectedMember(member)}
                             className="rounded-full hover:ring-2 ring-primary ring-offset-2 transition-all"
                             title={member.name}
                          >
                            <Avatar className="h-8 w-8">
                               <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
                               <AvatarFallback>{initials(member.name)}</AvatarFallback>
                            </Avatar>
                          </button>
                        ))}
                        {hasMoreMembers ? <div ref={sentinelRef} className="h-1 w-full" /> : null}
                        {loadingMoreMembers ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                        ) : null}
                      </>
                    )}
                  </div>
                )}
              </div>
            </aside>
            
            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Perfil do Membro</DialogTitle>
                </DialogHeader>
                {selectedMember && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={selectedMember.avatarUrl || undefined} alt={selectedMember.name} className="object-cover" />
                      <AvatarFallback className="text-2xl">{initials(selectedMember.name)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center space-y-1 w-full px-4">
                      <h3 className="text-xl font-semibold truncate">{selectedMember.name}</h3>
                    </div>
                    
                    {plainBio(selectedMember.bio) && (
                      <div className="w-full bg-muted/30 p-4 rounded-md text-sm text-muted-foreground text-center max-h-40 overflow-y-auto">
                         {plainBio(selectedMember.bio)}
                      </div>
                    )}

                    {selectedMember.profileLinks?.length ? (
                      <div className="flex flex-wrap justify-center gap-2 w-full mt-2">
                        {selectedMember.profileLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors truncate max-w-[200px]"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </DialogContent>
            </Dialog>
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

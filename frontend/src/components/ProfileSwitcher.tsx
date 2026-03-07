"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Lock } from "lucide-react";
import { api, Profile, Subscription } from "@/services/api";
import { useCookieConsent } from "@/context/CookieConsentContext";

const FREE_PLAN_SLUG = "plano-gratuito";

export const ProfileSwitcher = () => {
  const [items, setItems] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isFree, setIsFree] = useState(false);
  const { hasConsentedTo } = useCookieConsent();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [list, sub] = await Promise.all([
          api.getProfiles(),
          api.getCurrentSubscription(),
        ]);
        if (!mounted) return;
        setItems(list);
        const free = !sub || sub.plan?.slug === FREE_PLAN_SLUG;
        setIsFree(free);
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') : null;
        const initial = (saved && list.find(p => p.id === saved)) || list[0] || null;
        setActiveProfile(initial || null);
        if (initial && typeof window !== 'undefined' && hasConsentedTo('functional')) {
          window.localStorage.setItem('activeProfileId', initial.id);
        }
        // If free and the saved profile is not the first one, force to first
        if (free && list.length > 1 && initial && initial.id !== list[0].id) {
          setActiveProfile(list[0]);
          if (typeof window !== 'undefined' && hasConsentedTo('functional')) {
            window.localStorage.setItem('activeProfileId', list[0].id);
            window.dispatchEvent(new CustomEvent('profile-change', { detail: { profileId: list[0].id } }));
          }
        }
      } catch { }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onRefresh = async () => {
      try {
        const [list, sub] = await Promise.all([
          api.getProfiles(),
          api.getCurrentSubscription(),
        ]);
        setItems(list);
        const free = !sub || sub.plan?.slug === FREE_PLAN_SLUG;
        setIsFree(free);
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') : null;
        const current = (saved && list.find(p => p.id === saved)) || null;
        if (current) setActiveProfile(current);
      } catch { }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('profiles-refresh', onRefresh as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profiles-refresh', onRefresh as EventListener);
      }
    };
  }, []);

  const allowedProfileId = items.length > 0 ? items[0].id : null;

  const onSelectProfile = (profile: Profile) => {
    // Block if free and not the allowed profile
    if (isFree && items.length > 1 && profile.id !== allowedProfileId) {
      return;
    }
    setActiveProfile(profile);
    if (typeof window !== 'undefined' && hasConsentedTo('functional')) {
      window.localStorage.setItem('activeProfileId', profile.id);
      window.dispatchEvent(new CustomEvent('profile-change', { detail: { profileId: profile.id } }));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 p-2 rounded-lg text-left hover:bg-muted transition-colors">
        {activeProfile ? (
          <Avatar className="w-8 h-8">
            <AvatarImage src={activeProfile.avatarUrl} alt={activeProfile.name} />
            <AvatarFallback>{activeProfile.name[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="w-8 h-8">
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        )}
        <div className="hidden md:block">
          <p className="font-semibold text-sm">{activeProfile ? activeProfile.name : 'Perfil'}</p>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Selecionar Perfil</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((profile) => {
          const isLocked = isFree && items.length > 1 && profile.id !== allowedProfileId;
          return (
            <DropdownMenuItem
              key={profile.id}
              onSelect={() => onSelectProfile(profile)}
              className={`flex items-center gap-3 ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isLocked}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
              <span>{profile.name}</span>
              {isLocked && <Lock className="w-3.5 h-3.5 ml-auto text-amber-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

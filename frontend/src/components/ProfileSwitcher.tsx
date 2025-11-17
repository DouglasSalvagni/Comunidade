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
import { ChevronsUpDown } from "lucide-react";
import { api, Profile } from "@/services/api";

export const ProfileSwitcher = () => {
  const [items, setItems] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await api.getProfiles();
        if (!mounted) return;
        setItems(list);
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') : null;
        const initial = (saved && list.find(p => p.id === saved)) || list[0] || null;
        setActiveProfile(initial || null);
        if (initial && typeof window !== 'undefined') {
          window.localStorage.setItem('activeProfileId', initial.id);
        }
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, []);

  const onSelectProfile = (profile: Profile) => {
    setActiveProfile(profile);
    if (typeof window !== 'undefined') {
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
        {items.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onSelect={() => onSelectProfile(profile)}
            className="flex items-center gap-3"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
            </Avatar>
            <span>{profile.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

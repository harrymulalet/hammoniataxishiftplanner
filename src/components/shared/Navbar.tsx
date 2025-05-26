
"use client";

import { LogOut, UserCircle, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import SiteLogo from './SiteLogo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebarContent } from '@/components/admin/admin-sidebar'; // Assuming this will contain nav links
import { cn } from '@/lib/utils';

export function Navbar() {
  const { userProfile, logout, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo className="h-8 w-auto" />
          </Link>
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm print:hidden">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 pt-8 w-72 bg-sidebar text-sidebar-foreground">
                 {/* AdminSidebarContent needs to be created and accept a callback to close sheet on nav */}
                <AdminSidebarContent onLinkClick={() => {
                  // Close sheet logic here if Sheet component doesn't auto-close
                  // For now, assume SheetTrigger manages its state or find a way to close it
                }} />
              </SheetContent>
            </Sheet>
          )}
          <Link href="/" className="flex items-center">
            <SiteLogo className="h-8 w-auto" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {userProfile && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {userProfile.firstName} {userProfile.lastName} ({userProfile.role})
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={userProfile?.uid /* Placeholder for actual avatar image URL if available */} 
                    alt={`${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`} 
                    data-ai-hint="user avatar"
                  />
                  <AvatarFallback>
                    {getInitials(userProfile?.firstName, userProfile?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Add profile/settings link if needed */}
              {/* <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

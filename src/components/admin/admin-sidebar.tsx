
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Car, CalendarDays, BarChart2, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from '@/components/ui/sidebar';
import SiteLogo from '../shared/SiteLogo';

export interface AdminSidebarProps {
  className?: string;
  onLinkClick?: () => void; // For mobile sheet closing
}

const navItems = [
  { href: '/admin/drivers', label: 'Drivers', icon: Users },
  { href: '/admin/taxis', label: 'Taxis', icon: Car },
  { href: '/admin/shifts', label: 'All Shifts', icon: CalendarDays },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  // { href: '/admin/settings', label: 'Settings', icon: Settings }, // Example for future use
];

export function AdminSidebarContent({ onLinkClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <>
      <SidebarHeader className={cn("p-4", state === "collapsed" && "p-2")}>
        {state === "expanded" ? <SiteLogo className="h-8 w-auto" /> : <SiteLogo className="h-8 w-8" />}
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={state === "collapsed" ? item.label : undefined}
                  onClick={onLinkClick}
                  className="justify-start"
                >
                  <a>
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className={cn("truncate", state === "collapsed" && "sr-only")}>
                      {item.label}
                    </span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className={cn("p-4 mt-auto border-t border-sidebar-border", state === "collapsed" && "p-2")}>
        <SidebarTrigger className={cn(state === "collapsed" ? "mx-auto" : "ml-auto")}>
          {state === "expanded" ? <PanelLeftClose /> : <PanelLeftOpen />}
        </SidebarTrigger>
      </SidebarFooter>
    </>
  );
}


export function AdminSidebar({ className }: AdminSidebarProps) {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className={cn("border-r print:hidden", className)}>
      <AdminSidebarContent />
    </Sidebar>
  );
}

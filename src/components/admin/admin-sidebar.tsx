
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Car, CalendarDays, BarChart2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
import { useTranslation } from '@/hooks/useTranslation'; // Added
import type { TranslationKey } from '@/lib/translations'; // Added

export interface AdminSidebarProps {
  className?: string;
  onLinkClick?: () => void; 
}

const navItemsConfig: { href: string; labelKey: TranslationKey; icon: React.ElementType }[] = [ // Changed label to labelKey
  { href: '/admin/drivers', labelKey: 'adminDrivers', icon: Users },
  { href: '/admin/taxis', labelKey: 'adminTaxis', icon: Car },
  { href: '/admin/shifts', labelKey: 'adminAllShifts', icon: CalendarDays },
  { href: '/admin/analytics', labelKey: 'adminAnalytics', icon: BarChart2 },
];

export function AdminSidebarContent({ onLinkClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { t } = useTranslation(); // Added

  return (
    <>
      <SidebarHeader className={cn("p-4", state === "collapsed" && "p-2")}>
        {state === "expanded" ? <SiteLogo className="h-8 w-auto" /> : <SiteLogo className="h-8 w-8" />}
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItemsConfig.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={state === "collapsed" ? t(item.labelKey) : undefined}
                  onClick={onLinkClick}
                  className="justify-start"
                >
                  <a>
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className={cn("truncate", state === "collapsed" && "sr-only")}>
                      {t(item.labelKey)} {/* Use t() here */}
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

    
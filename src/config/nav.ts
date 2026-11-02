import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  History,
  Home,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown but disabled in the demo, per the PRD sidebar spec. */
  disabled?: boolean;
}

export const LIVE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Messages", href: "/messages", icon: MessageCircle },
];

export const DISABLED_NAV_ITEMS: NavItem[] = [
  { label: "Tenants", href: "/tenants", icon: Users, disabled: true },
  { label: "Payment history", href: "/payment-history", icon: History, disabled: true },
  { label: "Reports", href: "/reports", icon: BarChart3, disabled: true },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export const NAV_ITEMS: NavItem[] = [...LIVE_NAV_ITEMS, ...DISABLED_NAV_ITEMS];

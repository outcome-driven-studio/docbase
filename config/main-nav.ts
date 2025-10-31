import { Home, FileText, User, Mail, LucideIcon } from "lucide-react";

export interface MainNavItem {
  icon: LucideIcon;
  label: string;
  shortcut: string;
  href: string;
  action?: string;
  darkIcon?: LucideIcon;
}

export const mainNavItems: MainNavItem[] = [
  { href: "/home", label: "Home", shortcut: "H", icon: Home },
  { href: "/docs", label: "Docs", shortcut: "D", icon: FileText },
  { href: "/contacts", label: "Contacts", shortcut: "C", icon: User },
  { href: "/messages", label: "Messages", shortcut: "M", icon: Mail },
];

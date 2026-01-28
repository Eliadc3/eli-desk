import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  HardDrive,
  BookOpen,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Headphones,
  LogOut,
  UserRoundCog,
  ClipboardPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainNavItems = [
  { icon: LayoutDashboard, label: "דשבורד", href: "/" },
  { icon: Ticket, label: "קריאות", href: "/tickets" },
  { icon: Users, label: "לקוחות", href: "/customers" },
  { icon: Building2, label: "ארגונים", href: "/organizations" },
  { icon: HardDrive, label: "נכסים", href: "/assets" },
  { icon: BookOpen, label: "בסיס ידע", href: "/knowledge-base" },
];

const secondaryNavItems = [
  { icon: Zap, label: "אוטומציות", href: "/automations" },
  { icon: BarChart3, label: "דוחות", href: "/reports" },
  { icon: Settings, label: "הגדרות", href: "/settings" },
  { icon: UserRoundCog, label: "ניהול", href: "/admin" },
  { icon: ClipboardPlus, label: "טופס חיצוני (דמו)", href: "/public/new"}
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { me, logout } = useAuth();
  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const content = (
      <Link
        to={item.href}
        className={cn(
          "nav-item",
          isActive && "active"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Headphones className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">
              HelpDesk Pro
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
          {secondaryNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* User & Collapse */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg",
          !collapsed && "bg-sidebar-accent"
        )}>
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-sidebar-primary-foreground">
                {(me?.name?.[0] ?? me?.email?.[0] ?? "U").toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                 {me?.name ?? me?.email ?? "משתמש"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                 {me?.role === "SUPER_ADMIN" ? "סופר אדמין" : me?.role === "ADMIN" ? "מנהל מערכת" : "משתמש"}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full mt-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "px-0"
          )}
        >
          {collapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <>
              <ChevronRight className="w-4 h-4 ml-2" />
              <span>צמצם תפריט</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

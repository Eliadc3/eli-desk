import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function MainLayout({ children, title, subtitle, actions }: MainLayoutProps) {
  const [sidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      
      <main
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "mr-16" : "mr-64"
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {title && (
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  className="pr-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>

              {/* Quick Actions */}
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                קריאה חדשה
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {actions && (
            <div className="mb-6 flex items-center justify-between">
              {actions}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

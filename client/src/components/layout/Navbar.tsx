import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, LogOut, GraduationCap, Bell, UserCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const { setTheme } = useTheme();
  const { data: unreadData } = useUnreadCount();

  if (location === "/" || location === "/login" || location === "/register" || location === "/forgot-password") return null;

  const unreadCount = unreadData?.count || 0;

  const initials = user?.fullName
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href={user?.role === "ADMIN" ? "/admin" : "/student"}>
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
              EduPlatform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4 text-sm font-medium text-muted-foreground">
            {user?.role === "ADMIN" && (
              <Link href="/admin">
                <span className={`cursor-pointer hover:text-foreground transition-colors ${location === "/admin" ? "text-foreground" : ""}`}>
                  Dashboard
                </span>
              </Link>
            )}
            {user?.role === "STUDENT" && (
              <>
                <Link href="/student">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location === "/student" ? "text-foreground" : ""}`}>
                    Available Exams
                  </span>
                </Link>
                <Link href="/student/notifications">
                  <span className={`cursor-pointer hover:text-foreground transition-colors relative ${location === "/student/notifications" ? "text-foreground" : ""}`} data-testid="link-notifications">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-4 bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1 font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              </>
            )}
          </div>

          {user?.role === "STUDENT" && (
            <Link href="/student/notifications">
              <Button variant="ghost" size="icon" className="relative md:hidden" data-testid="button-notifications-mobile">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-xs rounded-full h-4 min-w-[1rem] flex items-center justify-center px-0.5 font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-4 border-l cursor-pointer" data-testid="button-user-menu">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicUrl || ""} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user?.role === "STUDENT" && (
                <>
                  <Link href="/student/profile">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile">
                      <UserCircle className="h-4 w-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/student/notifications">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-notifications">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1 font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-destructive focus:text-destructive"
                data-testid="menu-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

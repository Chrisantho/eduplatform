import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, GraduationCap, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const { setTheme } = useTheme();

  if (location === "/" || location === "/login" || location === "/register") return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
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
                <Link href="/student/history">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location === "/student/history" ? "text-foreground" : ""}`}>
                    My History
                  </span>
                </Link>
              </>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
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

          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role.toLowerCase()}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => logout()}
              title="Logout"
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

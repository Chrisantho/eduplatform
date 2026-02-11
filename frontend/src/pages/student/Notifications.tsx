import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, CheckCheck, BookOpen, PartyPopper, Info, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Notification } from "@/lib/api";

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  WELCOME: { icon: PartyPopper, color: "text-green-600", label: "Welcome" },
  NEW_EXAM: { icon: BookOpen, color: "text-blue-600", label: "New Exam" },
  RESULT: { icon: CheckCheck, color: "text-orange-600", label: "Result" },
  SYSTEM: { icon: Info, color: "text-muted-foreground", label: "System" },
};

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n: Notification) => !n.isRead).length || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/student">
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back-dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={markingAll}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: Notification) => {
            const config = typeConfig[notif.type] || typeConfig.SYSTEM;
            const Icon = config.icon;
            return (
              <Card
                key={notif.id}
                className={`transition-colors cursor-pointer ${!notif.isRead ? "border-primary/30 bg-primary/5" : ""}`}
                onClick={() => !notif.isRead && markRead(notif.id)}
                data-testid={`notification-item-${notif.id}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm">{notif.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {config.label}
                      </Badge>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

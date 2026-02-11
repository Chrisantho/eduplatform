import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import StudentDashboard from "@/pages/student/Dashboard";
import ExamHistory from "@/pages/student/History";
import NotificationsPage from "@/pages/student/Notifications";
import StudentProfile from "@/pages/student/Profile";
import AdminDashboard from "@/pages/admin/Dashboard";
import TakeExam from "@/pages/exam/TakeExam";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles: string[] }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Redirect to={user.role === "ADMIN" ? "/admin" : "/student"} />;
  }

  return <Component />;
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          
          <Route path="/student">
            <ProtectedRoute component={StudentDashboard} allowedRoles={["STUDENT"]} />
          </Route>
          
          <Route path="/student/notifications">
            <ProtectedRoute component={NotificationsPage} allowedRoles={["STUDENT"]} />
          </Route>

          <Route path="/student/profile">
            <ProtectedRoute component={StudentProfile} allowedRoles={["STUDENT"]} />
          </Route>
          
          <Route path="/student/history/:id">
            <ProtectedRoute component={ExamHistory} allowedRoles={["STUDENT"]} />
          </Route>
          
          <Route path="/admin">
            <ProtectedRoute component={AdminDashboard} allowedRoles={["ADMIN"]} />
          </Route>
          
          <Route path="/exam/:id">
            <ProtectedRoute component={TakeExam} allowedRoles={["STUDENT"]} />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="edu-platform-theme">
        <Toaster />
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

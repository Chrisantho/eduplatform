import { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/use-auth";
import { useSubmissions } from "@/hooks/use-submissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Save, ArrowLeft, Mail, User, BookOpen, Award, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_PATHS } from "@/lib/api";
import { format } from "date-fns";

export default function StudentProfile() {
  const { data: user, isLoading } = useUser();
  const { data: submissions } = useSubmissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (data: { fullName?: string; email?: string; bio?: string }) => {
      return apiRequest("PUT", API_PATHS.auth.updateProfile, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.auth.me] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    },
  });

  const uploadPic = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePic", file);
      const res = await fetch(API_PATHS.auth.uploadProfilePic, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.auth.me] });
      toast({ title: "Photo updated", description: "Your profile picture has been changed." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to upload photo." });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const completedExams = submissions?.filter(s => s.status === "COMPLETED") || [];
  const avgScore = completedExams.length > 0
    ? Math.round(completedExams.reduce((sum, s) => sum + (s.score || 0), 0) / completedExams.length)
    : 0;

  const initials = user.fullName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPic.mutate(file);
  };

  const handleSave = () => {
    updateProfile.mutate({ fullName, email, bio });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/student">
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back-dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profilePicUrl || ""} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                data-testid="button-upload-avatar"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-avatar-file"
              />
            </div>

            {uploadPic.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}

            <div>
              <h3 className="font-bold text-lg">{user.fullName}</h3>
              <Badge variant="secondary">{user.role}</Badge>
            </div>

            <div className="text-sm text-muted-foreground space-y-1 w-full text-left pt-2 border-t">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(user.createdAt), "MMM yyyy")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                data-testid="input-profile-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                data-testid="input-profile-email"
              />
              <p className="text-xs text-muted-foreground">Used for password recovery</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a bit about yourself..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                data-testid="input-profile-bio"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              data-testid="button-save-profile"
            >
              {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">{completedExams.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Exams Taken</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">{avgScore}%</p>
              <p className="text-xs text-muted-foreground mt-1">Average Score</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {completedExams.filter(s => (s.score || 0) >= 60).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Passed</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-destructive">
                {completedExams.filter(s => (s.score || 0) < 60).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Failed</p>
            </div>
          </div>

          {completedExams.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Recent Results
              </h4>
              <div className="divide-y rounded-lg border overflow-hidden">
                {completedExams.slice(0, 5).map(sub => (
                  <Link key={sub.id} href={`/student/history/${sub.id}`}>
                    <div className="p-3 flex items-center justify-between hover-elevate cursor-pointer" data-testid={`profile-result-${sub.id}`}>
                      <div>
                        <p className="font-medium text-sm">{sub.exam?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.endTime ? format(new Date(sub.endTime), "PPP") : ""}
                        </p>
                      </div>
                      <Badge variant={(sub.score || 0) >= 60 ? "default" : "destructive"}>
                        {sub.score}%
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, ShieldCheck, Clock, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            EduPlatform
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight tracking-tight text-foreground">
              Master your exams with <span className="text-primary">confidence</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed max-w-xl">
              A professional platform for students to take exams and for educators to evaluate performance with precision and ease.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="px-8 h-12 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Start Learning Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                Admin Access
              </Button>
            </Link>
          </motion.div>

          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm">Secure Environment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Clock className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm">Timed Assessments</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <Award className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm">Instant Results</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 animate-pulse"></div>
          <div className="relative bg-card rounded-2xl border shadow-2xl overflow-hidden">
            {/* Unsplash image of students studying/online education */}
            {/* students taking exam on laptop */}
            <img 
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000" 
              alt="Education platform dashboard preview" 
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6">
              <div className="bg-background/90 backdrop-blur-sm p-4 rounded-xl border shadow-lg w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Mid-Term Assessment</span>
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">00:45:21 remaining</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

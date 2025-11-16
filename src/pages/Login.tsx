import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-[1.3fr_1fr] bg-gradient-to-br from-[#F7F2FF] to-[#E7E8FF]">

      {/* LEFT PANEL — NOW VISIBLE ON MOBILE */}
      <div className="relative flex flex-col justify-center px-8 py-10 md:px-16 md:py-14 overflow-hidden">

        {/* Background Glow Blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-[260px] md:w-[360px] h-[260px] md:h-[360px] bg-purple-300/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-0 w-[220px] md:w-[300px] h-[220px] md:h-[300px] bg-indigo-300/30 rounded-full blur-2xl"></div>
          <div className="absolute top-1/3 left-10 md:left-20 w-[200px] md:w-[260px] h-[200px] md:h-[260px] bg-pink-300/25 rounded-full blur-xl"></div>
        </div>

        {/* SUPER TITLE + ICON */}
        <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 relative z-10 mt-2 md:mt-10 mb-8">

          {/* ICON */}
          <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl">
            <Brain className="h-10 w-10 text-white" />
          </div>

          {/* TITLE */}
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-wider 
                        bg-gradient-to-r from-purple-700 via-purple-700 to-indigo-600 
                        text-transparent bg-clip-text drop-shadow-sm text-center md:text-left">
            Preptor AI
          </h2>

        </div>

        {/* HERO */}
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 relative z-10 drop-shadow-sm text-center md:text-left">
          Ace Your Tech Interviews
          <br className="hidden md:block" />
          With AI-Powered Guidance
        </h1>

        {/* SUBTITLE */}
        <p className="mt-5 md:mt-6 text-base md:text-lg text-gray-700 w-full md:w-11/12 relative z-10 text-center md:text-left">
          Personalized questions, structured preparation, performance analytics, and 
          behavioral coaching — all in one intelligent interview companion.
        </p>

        {/* FEATURES GRID */}
        <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 relative z-10">
          {[
            { icon: "⚡", title: "AI Question Engine", subtitle: "Instant, role-based questions." },
            { icon: "🎯", title: "Guided Practice", subtitle: "Smarter, structured sessions." },
            { icon: "📈", title: "Insights Dashboard", subtitle: "Track your performance." },
            { icon: "💬", title: "Behavioral Coaching", subtitle: "Master STAR responses." }
          ].map((f, i) => (
            <div
              key={i}
              className="
                flex items-start gap-3 p-5 
                bg-white/70 backdrop-blur-md 
                border border-purple-200 shadow-sm 
                rounded-xl cursor-pointer 
                hover:bg-purple-100/70 hover:border-purple-400 hover:shadow-md
                transition-all
              "
            >
              <span className="text-3xl">{f.icon}</span>

              <div>
                <p className="font-semibold text-lg text-gray-900">{f.title}</p>
                <p className="text-sm text-gray-700 leading-tight">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BADGES */}
        <div className="mt-10 flex flex-wrap gap-3 md:gap-2 relative z-10 justify-center md:justify-start">
          {[
            "⏳ Saves 40% Prep Time",
            "🛡️ Secure & Private Workspace",
            "📈 Tracks Your Progress Daily",
            "📚 10,000+ Interview Questions",
            "🎯 Level Up Goals — Beat Yesterday"
            
          ].map((badge, i) => (
            <div
              key={i}
              className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-lg border border-white/40 text-gray-800 text-sm shadow-sm"
            >
              {badge}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — LOGIN */}
      <div className="flex items-center justify-center p-10 md:p-14 relative">

        {/* Subtle Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/40 to-indigo-200/40 blur-xl"></div>

        <Card className="w-full max-w-md shadow-2xl border border-white/30 bg-white/60 backdrop-blur-2xl rounded-lg relative">
          <CardHeader className="text-center px-8 pt-8">
            <div className="flex justify-center mb-5">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-1">
              Log in to continue your interview journey
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10 space-y-7">

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-medium text-gray-800">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  className="h-12 text-lg bg-white/80 backdrop-blur-sm border-gray-300 focus:border-purple-500"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-gray-800">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  className="h-12 text-lg bg-white/80 backdrop-blur-sm border-gray-300 focus:border-purple-500"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform"
              >
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-1/4 bg-gray-300"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="h-px w-1/4 bg-gray-300"></div>
            </div>

            {/* Signup Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-purple-700 font-semibold hover:underline">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

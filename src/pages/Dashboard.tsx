// Enhanced Dashboard UI with profile header, greeting, and improved layout
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Brain, LogOut, Plus, BookOpen, Trash2, User, X } from "lucide-react";
import { createPortal } from "react-dom";


export default function Dashboard() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [showProfileBox, setShowProfileBox] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [goals, setGoals] = useState([
    { id: 1, text: "Master your top 10 pinned questions", progress: 30 },
    { id: 2, text: "Practice 30 minutes daily", progress: 20 },
  ]);

  const [editingGoal, setEditingGoal] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [newGoal, setNewGoal] = useState("");


  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setTempName(currentUser?.name || "");
    setTempEmail(currentUser?.email || "");
  }, []);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(currentUser);
    setUserName(user?.name || "User");

    const stored = JSON.parse(localStorage.getItem(`sessions_${user.id}`) || "[]");
    const sorted = [...(Array.isArray(stored) ? stored : [])].sort(
      (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
    );
    setSessions(sorted);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleDeleteSession = (id) => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem(`sessions_${user.id}`, JSON.stringify(updated));

    toast({ title: "Deleted", description: "Session removed successfully." });
  };

  const handleCreateSession = async () => {
    if (!role || !experience) {
      toast({ title: "Missing information", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const sessionId = Date.now().toString();

    toast({ title: "Generating...", description: "Creating your custom interview session..." });

    const aiQuestions = await generateAIQuestions(role, experience);

    const newSession = { id: sessionId, role, experience, createdAt: new Date().toISOString(), questions: aiQuestions };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    localStorage.setItem(`sessions_${user.id}`, JSON.stringify(updated));

    toast({ title: "Success", description: "Session created successfully" });
    setLoading(false);
    navigate(`/session/${sessionId}`);
  };

  const safeJSON = (text) => {
    if (!text) return [];
    let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const looksDoubleEscaped = cleaned.startsWith('"[') || cleaned.includes('\"');

    try {
      if (looksDoubleEscaped) {
        const unescaped = cleaned.replace(/\"/g, '"').replace(/\n/g, "");
        const unwrapped = unescaped.replace(/^"/, "").replace(/"$/, "");
        return JSON.parse(unwrapped);
      }
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  };

  const generateAIQuestions = async (role, exp) => {
    const prompt = `
      Generate 5 high-quality interview questions and answers for:
      Role: ${role}
      Experience: ${exp}

      Return STRICTLY in this JSON format:
      [
        { "id": "1", "question": "...", "answer": "...", "pinned": false },
        ...
      ]
      pinned should always be false by default.
      `;
      
    try {
      console.log("🔄 Sending request to /api/generate...");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          // max_tokens: 1000,
        }),
      });

      console.log("📡 Response status:", response.status);
      const data = await response.json();
      console.log("📦 Response data:", data);
      const result = safeJSON(data.content || "[]");
      console.log("✅ Parsed result:", result);
      return result;
    } catch (error) {
      console.error("❌ Error generating questions:", error);
      toast({ title: "Error", description: "Failed to generate questions: " + error.message, variant: "destructive" });
      return [];
    }
  };

  const quotes = [
    "Success is built on consistent daily effort.",
    "Every interview is a chance to become a better you.",
    "Confidence comes from preparation.",
    "Small progress each day leads to big results.",
    "Your dream job is closer than you think.",
    "Practice like you’ve never won. Perform like you’ve never lost.",
    "Growth happens outside the comfort zone.",
    "Don’t wish for it. Work for it."
  ];

  const [quote, setQuote] = useState("");

  useEffect(() => {
    const index = new Date().getDate() % quotes.length;
    setQuote(quotes[index]);
  }, []);

  const getFirstName = (fullName = "") => {
    if (!fullName) return "";
    return fullName.trim().split(" ")[0];
  };

  const saveGoalEdit = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, text: editingText } : g));
    setEditingGoal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      
      {/* Top Navigation with Profile */}
      {/* Sticky Top Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-card/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">

          {/* LEFT — Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg shadow">
              <Brain className="h-7 w-7 text-primary-foreground" />
            </div>

            <span className="text-2xl font-extrabold tracking-tight">
              Preptor AI
            </span>
          </div>

          {/* RIGHT — Profile + Logout */}
          <div className="flex items-center gap-3 relative"> {/* <-- relative here */}

            {/* Profile Button */}
            <button
              className="
                flex items-center gap-2 
                border bg-background shadow-sm rounded-md 
                transition hover:bg-purple-100 cursor-pointer
                px-3 py-2 text-sm
                sm:px-4 sm:py-2 sm:text-base
              "
              onClick={() => setShowProfileBox(!showProfileBox)}
              aria-expanded={showProfileBox}
              aria-haspopup="true"
            >
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium hidden sm:inline">{userName}</span>
            </button>

            {/* Logout Button */}
            <Button
              variant="outline"
              className="px-3 py-2 text-sm sm:px-5 sm:py-2 sm:text-base"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>

            {/* Profile Dropdown — placed inside same relative parent (no portal) */}
            {showProfileBox && (
              <div
                className="absolute right-0 top-full mt-2 w-72 bg-white border shadow-xl rounded-2xl p-5 z-50"
                role="dialog"
                aria-label="Profile details"
              >
                <X
                  className="absolute top-4 right-4 h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setShowProfileBox(false)}
                  aria-label="Close profile"
                />

                <h4 className="font-semibold mb-2 text-lg">Profile Details</h4>

                <h4 className="font-semibold mb-1">{userName}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Email: {JSON.parse(localStorage.getItem("currentUser") || "{}").email || ""}
                </p>

                <div className="space-y-1 mb-1">
                  <Label className="text-xs">Update Details</Label>
                  <Input value={tempName} onChange={(e) => setTempName(e.target.value)} />
                </div>

                <div className="space-y-1 mb-3">
                  <Input value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} />
                </div>

                <Button
                  className="w-full mt-2"
                  variant="outline"
                  onClick={() => {
                    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
                    user.name = tempName;
                    user.email = tempEmail;

                    // 1) update currentUser
                    localStorage.setItem("currentUser", JSON.stringify(user));

                    // 2) update users array if present (match by id if available else email)
                    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
                    const updatedUsers = allUsers.map(u => {
                      if (user.id && u.id === user.id) return user;
                      if (!user.id && u.email === user.email) return user;
                      return u;
                    });
                    if (allUsers.length) localStorage.setItem("users", JSON.stringify(updatedUsers));

                    // 3) update UI and close
                    setUserName(tempName);
                    setShowProfileBox(false);

                    toast({ title: "Profile Updated", description: "Changes saved successfully!" });
                  }}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>


      {/* SUPER HEADING — INTERVIEW AI */}
      <section className="container mx-auto px-4 mt-10 text-center mb-4">

        {/* ICON + TITLE */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-4">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-wider 
                        bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 
                        text-transparent bg-clip-text drop-shadow-sm">
            Preptor AI
          </h2>
        </div>


        {/* MAIN HEADING */}
        <h1 className="text-3xl font-extrabold tracking-tight text-black drop-shadow-lg">
          Your AI-Powered Interview Success Platform
        </h1>

        <p className="text-muted-foreground mt-1 text-lg">
          Smart learning • Personalized practice • Faster growth
        </p>
      </section>


      {/* Premium Hero Banner */}
      <section className="container mx-auto px-4 mt-8 mb-6">
        <div
          className="
            relative w-full p-8 md:p-10 rounded-3xl
            bg-gradient-to-r from-blue-100 via-blue-50 to-purple-50 
            text-gray-900 shadow-md overflow-hidden
            grid md:grid-cols-2 gap-10
          "
        >

          {/* LEFT SIDE - Main Hero Text */}
          <div className="relative z-10 flex flex-col justify-center text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-blue-900">
              Welcome back, {getFirstName(userName)}! 👋
            </h1>

            {/* Daily Quote */}
            <p className="mt-4 text-base md:text-lg italic text-blue-800">
              “{quote}”
            </p>

            <p className="mt-3 text-sm md:text-md text-blue-900">
              Prepare smarter with AI-powered interview learning designed for your growth.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-col md:flex-row gap-3 md:gap-4 items-center md:items-start">

              <Button
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:opacity-90 px-6 py-2 w-full md:w-auto"
                onClick={() => {
                  const el = document.getElementById("create-session-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Start New Session
              </Button>

              <Button
                variant="outline"
                className="border-purple-700 text-purple-800 hover:bg-purple-100 hover:text-purple-800 px-6 py-2 w-full md:w-auto"
                onClick={() => {
                  const el = document.getElementById("past-sessions-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Past Sessions
              </Button>
            </div>
          </div>

          {/* RIGHT SIDE - Interview Journey (Compact Version) */}
          <div className="relative z-10 flex flex-col justify-center space-y-5 w-full">

            <h2 className="text-xl font-bold text-blue-900">
              Your Interview Journey
            </h2>

            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold text-base">
                1
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-lg">Prepare Smarter</p>
                <p className="text-blue-700 text-sm">
                  AI-curated questions tailored to your role & experience.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold text-base">
                2
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-lg">Practice Consistently</p>
                <p className="text-blue-700 text-sm">
                  Sessions, goals & structured improvement.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold text-base">
                3
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-lg">Crack the Interview</p>
                <p className="text-blue-700 text-sm">
                  Walk in with confidence and clarity.
                </p>
              </div>
            </div>
          </div>
          
          {/* Brain Logo Decoration (same icon as top bar) */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">
            <Brain className="w-40 h-40 md:w-56 md:h-56 text-purple-700" />
          </div>

          {/* Soft bluish glow */}
          <div className="absolute bottom-0 right-0 w-40 md:w-60 h-40 md:h-60 bg-blue-300/30 rounded-full blur-3xl"></div>
        </div>
      </section>


      {/* Stats Section */}
      <section
        id="create-session-section"
        className="container mx-auto px-4 mt-6 mb-12 grid gap-6 md:grid-cols-4"
      >
        {/* Total Sessions */}
        <Card className="p-6 border rounded-2xl bg-card hover:shadow-lg hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Total Sessions</h4>

              <p className="text-4xl font-extrabold mt-2 tracking-tight">
                {sessions.length}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {sessions.length === 0
                  ? "Start your first practice!"
                  : sessions.length <= 3
                  ? "Good start — keep going!"
                  : sessions.length <= 10
                  ? "You're building consistency!"
                  : "🔥 Amazing consistency!"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-purple-100 text-purple-700 shadow-inner">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
        </Card>

        {/* Hours Practiced */}
        <Card className="p-6 border rounded-2xl bg-card hover:shadow-lg hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Hours Practiced</h4>

              {(() => {
                const totalSessions = sessions.length;
                const totalQuestions = sessions.reduce(
                  (sum, s) => sum + (s.questions?.length || 0),
                  0
                );

                const estimatedHours =
                  totalSessions * 0.4 + // 25 min each
                  totalQuestions * 0.05 + // ~3 min each question
                  Math.min(1, totalSessions * 0.03); // small boost

                return (
                  <>
                    <p className="text-4xl font-extrabold mt-2 tracking-tight">
                      {estimatedHours.toFixed(1)}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {estimatedHours < 2
                        ? "Just getting started!"
                        : estimatedHours < 5
                        ? "Great progress!"
                        : estimatedHours < 10
                        ? "🔥 Strong momentum!"
                        : "🚀 You're unstoppable!"}
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 shadow-inner">
              <Brain className="h-8 w-8" />
            </div>
          </div>
        </Card>

        {/* Pinned Questions */}
        <Card className="p-6 border rounded-2xl bg-card hover:shadow-lg hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Pinned Questions</h4>

              <p className="text-4xl font-extrabold mt-2 tracking-tight">
                {sessions.reduce((count, s) => {
                  return count + (s.questions?.filter((q) => q.pinned).length || 0);
                }, 0)}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {(sessions.reduce(
                  (count, s) => count + (s.questions?.filter((q) => q.pinned).length || 0),
                  0
                ) === 0 && "Pin important questions!") ||
                  "Great! Review your pinned list."}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-pink-100 text-pink-700 shadow-inner">
              <Plus className="h-8 w-8" />
            </div>
          </div>
        </Card>

        {/* Daily Streak */}
        <Card className="p-6 border rounded-2xl bg-card hover:shadow-lg hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Daily Streak</h4>

              {(() => {
                const streak = Math.floor(Math.random() * 5) + 1; // 1 to 5

                return (
                  <p className="text-3xl font-bold mt-2">
                    {streak} <span className="text-lg text-orange-500">🔥</span>
                  </p>
                );
              })()}
            </div>

            <div className="p-3 rounded-xl bg-orange-100 text-orange-700">
              <span className="text-3xl">🔥</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            Keep showing up — consistency wins!
          </p>
        </Card>



      </section>


      {/* Main Grid */}
      <div className="container mx-auto px-4 py-4 grid gap-6 md:grid-cols-3">

        {/* Create Session (Now spans 2 columns) */}
        <Card className="shadow-elegant md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Create New Session</CardTitle>
            <CardDescription>Generate personalized interview questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Job Role</Label>
              <Input placeholder="e.g., Senior Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2 years">0-2 years</SelectItem>
                  <SelectItem value="2-5 years">2-5 years</SelectItem>
                  <SelectItem value="5-8 years">5-8 years</SelectItem>
                  <SelectItem value="8+ years">8+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-gradient-primary" disabled={loading} onClick={handleCreateSession}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Generating...
                </div>
              ) : "Generate Questions"}
            </Button>
          </CardContent>
        </Card>

        {/* Tips (Right Column) */}
        <Card className="shadow-elegant h-fit md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">🔥 Quick Tips</CardTitle>
            <CardDescription>Boost your interview performance fast</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 border rounded-lg bg-purple-50">
              💡 Practice for 15 minutes daily — consistency beats cramming.
            </div>
            <div className="p-3 border rounded-lg bg-purple-50">
              🎤 Speak aloud for confidence & fluency.
            </div>
            <div className="p-3 border rounded-lg bg-purple-50">
              🧠 Use STAR method for behavioral answers.
            </div>
            <div className="p-3 border rounded-lg bg-purple-50">
              ⚙️ Tailor your answers to the role.
            </div>
          </CardContent>
        </Card>

      </div>


      <div className="container mx-auto px-4 mt-8 mb-10 grid md:grid-cols-2 gap-6">

        {/* Sessions List (Left Side) */}
        <Card id="past-sessions-section" className="border shadow-elegant rounded-xl bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Your Sessions
            </CardTitle>
            <CardDescription>Review or delete past interview sessions</CardDescription>
          </CardHeader>
          
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sessions yet. Create your first one!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-card cursor-pointer 
                              transition-colors hover:bg-purple-50"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{session.role}</h3>
                      <p className="text-sm text-muted-foreground">{session.experience}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      size="icon"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:text-red-800 hover:bg-red-100 transition rounded-lg p-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>


                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Panel (Right Side) */}
        <Card className="border shadow-elegant rounded-xl bg-card h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Goals
            </CardTitle>
            <CardDescription>Track and update your learning goals</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* Add Goal Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add new goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="bg-white"
              />
              <Button
                onClick={() => {
                  if (!newGoal.trim()) return;
                  setGoals([
                    ...goals,
                    { id: Date.now(), text: newGoal, progress: 0 }
                  ]);
                  setNewGoal("");
                }}
                className="bg-purple-600 text-white"
              >
                Add
              </Button>
            </div>

            {goals.map((g) => (
              <div
                key={g.id}
                className="border rounded-xl p-3 bg-purple-50/70"
              >
                {/* Editable or Normal View */}
                {editingGoal === g.id ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="bg-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-purple-600 text-white"
                        onClick={() => saveGoalEdit(g.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingGoal(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="font-medium leading-tight">{g.text}</p>

                    <div className="flex gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-100 transition rounded-lg p-1.5"
                        onClick={() => {
                          setEditingGoal(g.id);
                          setEditingText(g.text);
                        }}
                      >
                        ✏️
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-100 transition rounded-lg p-1.5"
                        onClick={() => {
                          setGoals(goals.filter(goal => goal.id !== g.id));
                        }}
                      >
                        <Trash2
                          className="h-6 w-6 text-red-500 cursor-pointer hover:scale-110 transition"
                        />
                      </Button>

                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>{g.progress}%</span>
                    <span className="text-muted-foreground">
                      {g.progress === 100 ? "Completed" : "In Progress"}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-white rounded-full border border-border/40 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setGoals(goals.map(goal =>
                        goal.id === g.id
                          ? { ...goal, progress: Math.min(goal.progress + 10, 100) }
                          : goal
                      ))
                    }
                  >
                    +10%
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setGoals(goals.map(goal =>
                        goal.id === g.id
                          ? { ...goal, progress: Math.max(goal.progress - 10, 0) }
                          : goal
                      ))
                    }
                  >
                    -10%
                  </Button>
                </div>
              </div>

            ))}

          </CardContent>
        </Card>

      </div>


    </div>
  );
}

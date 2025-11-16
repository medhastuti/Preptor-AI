import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowLeft, Pin, Lightbulb, PlayCircle, PauseCircle, StopCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Session() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<any | null>(null);
  const [explanation, setExplanation] = useState<{ [key: string]: string }>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [openPinnedIndex, setOpenPinnedIndex] = useState<number | null>(null);
  const [openUnpinnedIndex, setOpenUnpinnedIndex] = useState<number | null>(null);
  const [lastPinnedQuestionId, setLastPinnedQuestionId] = useState<string | null>(null);
  const [lastUnpinnedQuestionId, setLastUnpinnedQuestionId] = useState<string | null>(null);
  
  // --------------------
  // Helper utilities
  // --------------------
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    try {
      const regex = new RegExp(escapeRegExp(query), "gi");
      const parts = text.split(regex);
      const matches = text.match(regex);
      if (!matches) return text;
      const result: any[] = [];
      parts.forEach((part, i) => {
        result.push(part);
        if (i < (matches?.length || 0)) {
          result.push(
            <span key={i} className="bg-accent/20 text-accent px-1 rounded">
              {matches![i]}
            </span>
          );
        }
      });
      return result;
    } catch {
      return text;
    }
  };

  const Spinner = ({ size = "small" }: { size?: "small" | "large" }) => {
    const cls = size === "small" ? "h-3 w-3" : "h-5 w-5";
    return <span className={`${cls} border-2 border-primary border-t-transparent rounded-full animate-spin`} />;
  };

  // --------------------
  // Timer functionality + persistence
  // --------------------
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // save timer state per session to localStorage when timer/isRunning changes
  useEffect(() => {
    if (!sessionId) return;
    try {
      const stored = JSON.parse(localStorage.getItem("sessionTimers") || "{}");
      stored[sessionId] = { time: timer, isRunning };
      localStorage.setItem("sessionTimers", JSON.stringify(stored));
    } catch {
      // ignore storage errors
    }
  }, [timer, isRunning, sessionId]);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const stopTimer = () => {
    setIsRunning(false);
    setTimer(0);
    // clear saved
    try {
      const stored = JSON.parse(localStorage.getItem("sessionTimers") || "{}");
      stored[sessionId!] = { time: 0, isRunning: false };
      localStorage.setItem("sessionTimers", JSON.stringify(stored));
    } catch {}
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --------------------
  // Load session & restore timer
  // --------------------
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      navigate("/login");
      return;
    }
    try {
      const user = JSON.parse(currentUser);
      const sessions = JSON.parse(localStorage.getItem(`sessions_${user.id}`) || "[]");
      const currentSession = sessions.find((s: any) => s.id === sessionId);
      if (currentSession) {
        // Deduplicate questions on load
        const seenIds = new Set<string>();
        const dedupedQuestions = (currentSession.questions || []).filter((q: any) => {
          if (seenIds.has(q.id)) return false;
          seenIds.add(q.id);
          return true;
        });
        const cleanedSession = { ...currentSession, questions: dedupedQuestions };
        setSession(cleanedSession);

        // restore timer if present
        try {
          const timers = JSON.parse(localStorage.getItem("sessionTimers") || "{}");
          if (timers && timers[sessionId]) {
            setTimer(Number(timers[sessionId].time || 0));
            setIsRunning(Boolean(timers[sessionId].isRunning));
          } else {
            setTimer(0);
            setIsRunning(false);
          }
        } catch {
          setTimer(0);
          setIsRunning(false);
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("session load error", err);
      navigate("/dashboard");
    }
    // stable deps only
  }, [sessionId, navigate]);

  // --------------------
  // Toggle pin reliably
  // --------------------
  const togglePin = (questionId: string) => {
    if (!session) return;

    // Deduplicate first - remove any duplicates by ID (keep first occurrence)
    const seenIds = new Set<string>();
    const dedupedQuestions = (session.questions || []).filter((q: any) => {
      if (seenIds.has(q.id)) return false;
      seenIds.add(q.id);
      return true;
    });

    // update local session copy - toggle the pin status
    const updatedQuestions = dedupedQuestions.map((q: any) =>
      q.id === questionId ? { ...q, pinned: !q.pinned } : q
    );
    const updatedSession = { ...session, questions: updatedQuestions };
    setSession(updatedSession);

    // persist to localStorage (per-user sessions array)
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const sessions = JSON.parse(localStorage.getItem(`sessions_${currentUser.id}`) || "[]");
      const updatedSessions = sessions.map((s: any) => (s.id === sessionId ? updatedSession : s));
      localStorage.setItem(`sessions_${currentUser.id}`, JSON.stringify(updatedSessions));
    } catch (err) {
      console.error("togglePin storage error", err);
    }

    const pinnedNow = updatedQuestions.find((q: any) => q.id === questionId)?.pinned;
    toast({ title: pinnedNow ? "Question pinned" : "Question unpinned" });

    // When unpinning: clear pinned accordion, update tracking
    // When pinning: clear unpinned accordion, update tracking
    if (pinnedNow) {
      // Just pinned - clear unpinned section
      setOpenUnpinnedIndex(null);
      setLastUnpinnedQuestionId(null);
    } else {
      // Just unpinned - clear pinned section
      setOpenPinnedIndex(null);
      setLastPinnedQuestionId(null);
    }
  };

  // --------------------
  // Explanation generation
  // --------------------
  const generateExplanation = async (questionId: string, questionText: string) => {
    // prevent multiple explain calls
    if (loadingExplain) return;
    setLoadingExplain(questionId);

    const prompt = `
Explain the answer for this interview question in a detailed and easy-to-understand way.

Format requirements:
- Write the explanation in clear numbered points "1. ", "2. " ...
- Do NOT exceed 10 points.
- Use simple language as if explaining to a beginner.
- Do NOT return JSON.

Question: ${questionText}
    `;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 800,
        }),
      });
      const data = await res.json();

      // data.content is expected (your backend shape). fallback if different.
      const explanationText = data?.content ?? data?.choices?.[0]?.message?.content ?? "Explanation not available.";
      setExplanation((prev) => ({ ...prev, [questionId]: explanationText }));

      toast({ title: "Explanation generated", description: "AI provided a detailed breakdown." });
    } catch (err) {
      console.error("generateExplanation error", err);
      toast({ title: "Error", description: "Failed to generate explanation.", variant: "destructive" });
    } finally {
      setLoadingExplain(null);
    }
  };

  // --------------------
  // Generate more questions
  // --------------------
  const generateMoreQuestions = async () => {
    if (loadingMore || !session) return;
    setLoadingMore(true);

    const prompt = `
Generate 3 more interview question and answer for:
Role: ${session.role}
Experience: ${session.experience}

Return ONLY valid JSON (no markdown, no explanation):
[
  { "id": "q_${Date.now()}_1", "question": "...", "answer": "...", "pinned": false },
  { "id": "q_${Date.now()}_2", "question": "...", "answer": "...", "pinned": false },
  { "id": "q_${Date.now()}_3", "question": "...", "answer": "...", "pinned": false }
]
    `;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      const raw = data?.content ?? data?.choices?.[0]?.message?.content ?? "[]";

      // clean common markdown fences
      const cleaned = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
      
      console.log("🤖 Generated questions raw:", raw);
      console.log("🤖 Cleaned questions:", cleaned);
      
      let newQuestions: any[] = [];
      try {
        newQuestions = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("❌ Failed to parse questions JSON:", parseErr, "cleaned:", cleaned);
        throw new Error("Invalid JSON from AI");
      }

      // ensure array
      if (!Array.isArray(newQuestions)) {
        console.error("❌ newQuestions is not an array:", newQuestions);
        throw new Error("Invalid questions format");
      }

      // Ensure all new questions have pinned: false
      const normalizedNewQuestions = newQuestions.map((q: any) => ({
        ...q,
        pinned: false  // Force unpinned for new questions
      }));

      console.log("✅ Normalized new questions:", normalizedNewQuestions);

      // Combine and deduplicate questions
      const allQuestions = [...(session.questions || []), ...normalizedNewQuestions];
      const seenIds = new Set<string>();
      const dedupedQuestions = allQuestions.filter((q: any) => {
        if (seenIds.has(q.id)) {
          console.log("⏭️  Skipping duplicate:", q.id);
          return false;
        }
        seenIds.add(q.id);
        return true;
      });

      console.log("✅ Final deduped questions count:", dedupedQuestions.length);
      console.log("📊 Pinned:", dedupedQuestions.filter((q: any) => q.pinned).length, "Unpinned:", dedupedQuestions.filter((q: any) => !q.pinned).length);

      const updatedSession = { ...session, questions: dedupedQuestions };
      setSession(updatedSession);

      // persist to localStorage
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const sessions = JSON.parse(localStorage.getItem(`sessions_${currentUser.id}`) || "[]");
        const updatedSessions = sessions.map((s: any) => (s.id === sessionId ? updatedSession : s));
        localStorage.setItem(`sessions_${currentUser.id}`, JSON.stringify(updatedSessions));
        console.log("✅ Saved to localStorage");
      } catch (err) {
        console.error("persist new questions error", err);
      }

      toast({ title: "New question added!", description: "AI generated additional interview questions." });
    } catch (err) {
      console.error("generateMoreQuestions error", err);
      toast({ title: "Error", description: "Could not generate more questions.", variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  };

  // --------------------
  // Derived lists
  // --------------------
  const pinnedQuestions = session?.questions?.filter((q: any) => q.pinned) ?? [];
  const unpinnedQuestions = session?.questions?.filter((q: any) => !q.pinned) ?? [];

  // --------------------
  // Render
  // --------------------
  if (!session) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Nav */}
      <nav className="border-b bg-card/70 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="default" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">{session.role}</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">{session.experience}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Session Timer</p>
              <p className="text-lg font-bold">{formatTime(timer)}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-purple-100" onClick={startTimer}>
                <PlayCircle className="h-6 w-6 text-primary" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-purple-100" onClick={pauseTimer}>
                <PauseCircle className="h-6 w-6 text-primary" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-purple-100" onClick={stopTimer}>
                <StopCircle className="h-6 w-6 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: main content */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Pinned (top) */}
            {pinnedQuestions.length > 0 && (
              <Card className="shadow-elegant">
                <CardHeader className="border-b border-muted pb-0">
                  <CardTitle className="pb-4 flex items-center gap-2">
                    <Pin className="h-5 w-5 text-accent" />
                    Pinned Questions
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {/* UNCONTROLLED accordion with single-open behavior (type="single") */}
                  
                  <Accordion
                    type="single"
                    collapsible
                    value={openPinnedIndex !== null ? `pinned-${openPinnedIndex}` : ""}
                    onValueChange={(val) => {
                      if (val === "") {
                        setOpenPinnedIndex(null);
                        setLastPinnedQuestionId(null);
                      } else {
                        const idx = Number(val.replace("pinned-", ""));
                        if (idx !== openPinnedIndex) {
                          setOpenPinnedIndex(idx);
                          setLastPinnedQuestionId(pinnedQuestions[idx]?.id || null);
                        } else {
                          setOpenPinnedIndex(null);
                          setLastPinnedQuestionId(null);
                        }
                      }
                    }}
                  >
                    {pinnedQuestions.map((q, index) => {
                      return (
                        <AccordionItem key={q.id} value={`pinned-${index}`}>
                          <AccordionTrigger className="text-left pr-6 border-b border-muted/50 pb-2">
                            <div className="flex w-full items-start gap-4">
                              <div className="flex flex-col items-center w-8">
                                <span className="text-muted-foreground font-semibold">{index + 1}.</span>
                                <Badge variant="secondary" className="mt-1 text-[10px] px-2 py-0.5">Pinned</Badge>
                              </div>
                              <div className="flex-1 font-medium leading-snug">{highlightText(q.question, searchQuery)}</div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent>
                            <div className="space-y-4">
                              <p className="text-foreground">{q.answer}</p>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => togglePin(q.id)}>
                                  <Pin className="h-4 w-4 mr-1" /> Unpin
                                </Button>

                                <Button variant="outline" size="sm" onClick={() => generateExplanation(q.id, q.question)} disabled={loadingExplain === q.id}>
                                  {loadingExplain === q.id ? (
                                    <div className="flex items-center gap-2"><Spinner size="small" /><span>Generating...</span></div>
                                  ) : (
                                    <>
                                      <Lightbulb className="h-4 w-4 mr-1" /> Explain Further
                                    </>
                                  )}
                                </Button>
                              </div>

                              {explanation[q.id] && (
                                <div className="mt-4 p-4 bg-secondary rounded-lg">
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-accent" /> AI Explanation
                                  </h4>
                                  <p className="text-sm whitespace-pre-line">{explanation[q.id]}</p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Unpinned / Interview Questions */}
            <Card className="shadow-elegant">
              <CardHeader className="border-b border-muted pb-4">
                <CardTitle>Interview Questions</CardTitle>
              </CardHeader>

              <CardContent>
                <Accordion
                  type="single"
                  collapsible
                  value={openUnpinnedIndex !== null ? `unpinned-${openUnpinnedIndex}` : ""}
                  onValueChange={(val) => {
                    if (val === "") {
                      setOpenUnpinnedIndex(null);
                      setLastUnpinnedQuestionId(null);
                    } else {
                      const idx = Number(val.replace("unpinned-", ""));
                      if (idx !== openUnpinnedIndex) {
                        setOpenUnpinnedIndex(idx);
                        setLastUnpinnedQuestionId(unpinnedQuestions[idx]?.id || null);
                      } else {
                        setOpenUnpinnedIndex(null);
                        setLastUnpinnedQuestionId(null);
                      }
                    }
                  }}
                >
                  {unpinnedQuestions.map((q, index) => (
                    <AccordionItem key={q.id} value={`unpinned-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-start gap-3 w-full">
                          <span className="text-muted-foreground font-semibold w-6 text-right">{index + 1}.</span>
                          <span className="flex-1">{highlightText(q.question, searchQuery)}</span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="space-y-4">
                          <p className="text-foreground">{q.answer}</p>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => togglePin(q.id)}>
                              <Pin className="h-4 w-4 mr-1" /> Pin Question
                            </Button>

                            <Button variant="outline" size="sm" onClick={() => generateExplanation(q.id, q.question)} disabled={loadingExplain === q.id}>
                              {loadingExplain === q.id ? (
                                <div className="flex items-center gap-2"><Spinner size="small" /><span>Generating...</span></div>
                              ) : (
                                <>
                                  <Lightbulb className="h-4 w-4 mr-1" /> Explain Further
                                </>
                              )}
                            </Button>
                          </div>

                          {explanation[q.id] && (
                            <div className="mt-4 p-4 bg-secondary rounded-lg">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-accent" /> AI Explanation
                              </h4>
                              <p className="text-sm whitespace-pre-line leading-relaxed">{explanation[q.id]}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Generate More */}
            <div className="mt-6 flex justify-center">
              <Button className="bg-gradient-primary px-6" onClick={generateMoreQuestions} disabled={loadingMore}>
                {loadingMore ? (
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-white font-medium">Generating...</span>
                  </div>
                ) : (
                  "Generate More Questions"
                )}

              </Button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 sticky top-6">

            {/* Search */}
            <Card className="border border-gray-300 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide text-black flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Questions
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-white 
                              focus:ring-2 focus:ring-gray-300 focus:border-gray-400 
                              outline-none transition-all placeholder:text-gray-400"
                  />
                  <svg className="absolute left-4 top-4 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Session Summary */}
            <Card className="border border-gray-300 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide text-black flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Session Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                {[
                  ["Role", session.role],
                  ["Experience", session.experience],
                  ["Total Questions", session.questions.length],
                  ["Pinned", pinnedQuestions.length],
                  ["Time", formatTime(timer)]
                ].map(([label, value], i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-gray-600 flex items-center gap-2">{label}</span>
                    <span className="font-medium text-black">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border border-gray-300 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide text-black flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Stats
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-300 rounded-lg bg-gray-100 text-center hover:bg-gray-200 transition">
                  <div className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                    Questions
                  </div>
                  <div className="text-2xl font-semibold text-black">
                    {session.questions.length}
                  </div>
                </div>

                <div className="p-4 border border-gray-300 rounded-lg bg-gray-100 text-center hover:bg-gray-200 transition">
                  <div className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                    Pinned
                  </div>
                  <div className="text-2xl font-semibold text-black">
                    {pinnedQuestions.length}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>


        </div>
      </div>
    </div>
  );
}

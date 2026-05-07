"use client"; // <--- Importante para Next.js

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Paperclip, Send, Sparkles, Loader2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HumanSilhouette from "@/components/HumanSilhouette";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  fileName?: string;
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Index = () => {
  // 1. ESTADOS
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hola 👋 Soy tu asistente médico. Sube una foto o PDF de tu examen y te lo explico de forma clara y humana.",
    },
  ]);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 2. REFERENCIAS
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 3. FUNCIONES Y MANEJADORES
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setMousePosition(prev => ({ ...prev, active: false }));
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      toast.error("Solo se permiten imágenes o PDFs");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Máximo 10MB");
      return;
    }
    setFile(f);
  };

  const send = async () => {
    if (loading) return;
    if (!file && !text.trim()) return;

    const sentFile = file;
    const sentText = text.trim();
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: sentText || `📎 ${sentFile!.name}`,
      fileName: sentFile?.name,
    };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);
    setFile(null);
    setText("");
    if (inputRef.current) inputRef.current.value = "";

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      const body: Record<string, unknown> = { text: sentText, history };
      if (sentFile) {
        body.fileBase64 = await fileToBase64(sentFile);
        body.mimeType = sentFile.type;
        body.fileName = sentFile.name;
      }
      const { data, error } = await supabase!.functions.invoke("analyze-exam", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), role: "assistant", content: data.result || "Sin resultado" },
      ]);
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Error analizando");
      setMessages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "❌ No pude responder. Intenta de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main 
      className="relative h-screen overflow-hidden bg-slate-950 text-white"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Blobs decorativos */}
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 z-0">
        <HumanSilhouette mousePosition={mousePosition} />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col px-4 py-6">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Asistente Médico IA</h1>
              <p className="text-xs text-slate-400">Entiende tus exámenes en lenguaje humano</p>
            </div>
          </div>
        </header>

        {/* Chat */}
        <div
          ref={scrollRef}
          className="relative flex-1 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:p-6"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-white border border-white/10"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando examen...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
          {file && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="flex-1 truncate">{file.name}</span>
              <button onClick={() => setFile(null)}><X className="h-4 w-4" /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => inputRef.current?.click()}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
            />
            <Button onClick={send} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;

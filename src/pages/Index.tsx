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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hola 👋 Soy tu asistente médico. Sube una foto o PDF de tu examen y te lo explico de forma clara y humana.",
    },
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const body: any = { text: sentText };
      if (sentFile) {
        body.fileBase64 = await fileToBase64(sentFile);
        body.mimeType = sentFile.type;
        body.fileName = sentFile.name;
      }
      const { data, error } = await supabase.functions.invoke("analyze-exam", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), role: "assistant", content: data.result || "Sin resultado" },
      ]);
    } catch (e: any) {
      toast.error(e.message || "Error analizando");
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
    <main className="relative h-screen overflow-hidden bg-gradient-soft">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col px-4 py-6">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card/70 px-5 py-3 backdrop-blur-xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Asistente Médico IA</h1>
              <p className="text-xs text-muted-foreground">Entiende tus exámenes en lenguaje humano</p>
            </div>
          </div>
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:inline">
            En línea
          </span>
        </header>

        {/* Chat messages */}
        <div
          ref={scrollRef}
          className="relative flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md md:p-6"
        >
          {/* Silueta humana de fondo, dentro del chat */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="pointer-events-auto absolute inset-0">
              <HumanSilhouette />
            </div>
          </div>
          <div className="relative z-10 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
            >
              {m.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-soft backdrop-blur-md ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card/90 text-card-foreground border border-border rounded-tl-sm"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm font-medium">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card/90 px-4 py-3 shadow-soft backdrop-blur-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Leyendo tu examen...
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Input bar */}
        <div className="mt-4 rounded-2xl border border-border bg-card/80 p-3 shadow-elegant backdrop-blur-xl">
          {file && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="flex-1 truncate font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
              <button
                onClick={() => setFile(null)}
                className="rounded-full p-1 transition-smooth hover:bg-destructive/10 hover:text-destructive"
                aria-label="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
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
              type="button"
              variant="outline"
              size="icon"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="shrink-0 rounded-xl"
              aria-label="Adjuntar examen"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 truncate rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-muted-foreground">
              {file ? "Listo para analizar tu examen" : "Adjunta una imagen o PDF de tu examen..."}
            </div>
            <Button
              type="button"
              onClick={send}
              disabled={!file || loading}
              className="shrink-0 rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
              aria-label="Enviar"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            ⚕️ La IA orienta, pero no reemplaza al médico.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Index;

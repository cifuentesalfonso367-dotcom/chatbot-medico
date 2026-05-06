import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Upload, FileText, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HumanSilhouette from "@/components/HumanSilhouette";

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    const ok = ["image/", "application/pdf"].some((p) => f.type.startsWith(p) || f.type === p);
    if (!ok) {
      toast.error("Solo se permiten imágenes o PDFs");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe superar 10MB");
      return;
    }
    setFile(f);
    setResult("");
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult("");
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("analyze-exam", {
        body: { fileBase64: base64, mimeType: file.type, fileName: file.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result || "Sin resultado");
    } catch (e: any) {
      toast.error(e.message || "Ocurrió un error analizando el examen");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-soft">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="text-center animate-float">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Análisis médico con IA
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
            Entiende tus <span className="text-gradient">exámenes</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            Sube tu examen médico y recibe una explicación clara, humana y comprensible — sin tecnicismos.
          </p>
        </header>

        {/* Uploader */}
        {!result && (
          <section
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`group relative cursor-pointer rounded-3xl border-2 border-dashed bg-card/60 p-12 text-center backdrop-blur-xl transition-smooth shadow-soft ${
              dragOver ? "border-primary scale-[1.02] shadow-elegant" : "border-border hover:border-primary/60"
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth group-hover:scale-110">
              {file ? <FileText className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
            </div>
            {file ? (
              <>
                <p className="font-semibold">{file.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · listo para analizar</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Arrastra tu examen o haz clic para subirlo</p>
                <p className="mt-1 text-sm text-muted-foreground">Imágenes o PDF · máx 10MB</p>
              </>
            )}

            {file && (
              <Button
                size="lg"
                className="mt-6 bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
                onClick={(e) => { e.stopPropagation(); analyze(); }}
                disabled={loading}
              >
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando...</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Analizar examen</>)}
              </Button>
            )}
          </section>
        )}

        {/* Result with rotating human silhouette background */}
        {(loading || result) && (
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card/70 p-8 shadow-elegant backdrop-blur-xl md:p-12">
            <HumanSilhouette />
            <div className="relative">
              {loading && !result && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                  <p className="font-medium">Leyendo tu examen...</p>
                  <p className="mt-1 text-sm text-muted-foreground">La IA está interpretando los resultados</p>
                </div>
              )}
              {result && (
                <>
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-p:leading-relaxed">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
                    <Button onClick={reset} variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" /> Analizar otro examen
                    </Button>
                    <p className="ml-auto self-center text-xs text-muted-foreground">
                      ⚕️ Esta es una orientación, no reemplaza al médico.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Index;

import { useState } from "react";
import { useGenerateOpenaiImage } from "@workspace/api-client-react";
import { OpenaiImageInputSize } from "@workspace/api-client-react/src/generated/api.schemas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Download, Loader2, Sparkles } from "lucide-react";

export function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<OpenaiImageInputSize>("1024x1024");
  const [imageData, setImageData] = useState<{ url: string; mime: string } | null>(null);
  const generateMutation = useGenerateOpenaiImage();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      const res = await generateMutation.mutateAsync({ data: { prompt, size } });
      const mime = (res as any).mimeType || "image/jpeg";
      setImageData({ url: `data:${mime};base64,${res.b64_json}`, mime });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-xs font-mono text-secondary uppercase tracking-widest">مولّد الصور</span>
          </div>
          <h1 className="text-2xl font-bold text-white">توليد صور بالذكاء الاصطناعي</h1>
          <p className="text-muted-foreground text-sm mt-1">صف ما تريد رؤيته وسيقوم النظام بإنشائه.</p>
        </header>

        <div className="rounded-2xl bg-card/30 border border-border/50 p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">وصف الصورة</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="مثال: غروب الشمس على البحر بألوان برتقالية وبنفسجية..."
              className="min-h-[100px] bg-background/40 border-border/50 focus-visible:ring-secondary/50 resize-none text-white text-sm leading-relaxed placeholder:text-muted-foreground/40"
              style={{ direction: "rtl" }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 w-full sm:w-56">
              <label className="text-xs text-muted-foreground">النسبة والأبعاد</label>
              <Select value={size} onValueChange={(v: OpenaiImageInputSize) => setSize(v)}>
                <SelectTrigger className="bg-background/40 border-border/50 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">مربع ١٠٢٤×١٠٢٤</SelectItem>
                  <SelectItem value="1536x1024">أفقي ١٥٣٦×١٠٢٤</SelectItem>
                  <SelectItem value="1024x1536">عمودي ١٠٢٤×١٥٣٦</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !prompt.trim()}
              className="h-10 px-6 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold shadow-[0_0_15px_rgba(7,181,209,0.3)] transition-all disabled:opacity-50 disabled:shadow-none w-full sm:w-auto"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري التوليد...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> توليد الصورة</>
              )}
            </Button>
          </div>

          {generateMutation.isError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              فشل توليد الصورة. حاول مرة أخرى.
            </div>
          )}
        </div>

        {imageData && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/80">الصورة المُولَّدة</h3>
              <a href={imageData.url} download="darck-arana-image.jpg">
                <Button variant="outline" size="sm" className="border-secondary/30 hover:bg-secondary/10 hover:text-secondary gap-1.5 h-8 text-xs">
                  <Download className="w-3.5 h-3.5" /> تحميل
                </Button>
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-black/30">
              <img src={imageData.url} alt="Generated" className="w-full h-auto object-contain max-h-[600px] mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

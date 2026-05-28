import { useState } from "react";
import { useGenerateOpenaiImage } from "@workspace/api-client-react";
import { OpenaiImageInputSize } from "@workspace/api-client-react/src/generated/api.schemas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Download, Loader2 } from "lucide-react";

export function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<OpenaiImageInputSize>("1024x1024");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const generateMutation = useGenerateOpenaiImage();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      const res = await generateMutation.mutateAsync({
        data: { prompt, size }
      });
      setImageUrl(`data:image/png;base64,${res.b64_json}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <ImageIcon className="w-8 h-8 text-secondary" /> Visual Synthesis
          </h1>
          <p className="text-muted-foreground">Generate high-fidelity assets using neural rendering.</p>
        </header>

        <Card className="p-6 bg-card/40 border-secondary/20 backdrop-blur-sm space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-white block uppercase tracking-wider">Input Parameter</label>
            <Textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the desired visual output..."
              className="min-h-[120px] bg-background/50 border-border focus-visible:ring-secondary resize-none text-white text-lg"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-64 space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolution</label>
              <Select value={size} onValueChange={(v: OpenaiImageInputSize) => setSize(v)}>
                <SelectTrigger className="bg-background/50 border-border h-12">
                  <SelectValue placeholder="Select dimension" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                  <SelectItem value="1536x1024">1536x1024 (Landscape)</SelectItem>
                  <SelectItem value="1024x1536">1024x1536 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={generateMutation.isPending || !prompt.trim()}
              className="w-full sm:w-auto h-12 px-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all font-bold tracking-wide"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Synthesizing...</>
              ) : "Execute Render"}
            </Button>
          </div>
        </Card>

        {imageUrl && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white uppercase tracking-wider">Output Signal</h3>
              <a href={imageUrl} download="synthesis.png">
                <Button variant="outline" size="sm" className="border-secondary/30 hover:bg-secondary/20 hover:text-secondary gap-2">
                  <Download className="w-4 h-4" /> Download Asset
                </Button>
              </a>
            </div>
            <Card className="overflow-hidden border-secondary/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-black/50 p-2">
              <img src={imageUrl} alt="Generated visual" className="w-full h-auto rounded object-contain max-h-[600px] mx-auto" />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
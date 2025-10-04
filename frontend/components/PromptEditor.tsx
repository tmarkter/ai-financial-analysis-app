import { useState, useEffect } from "react";
import { Settings, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/utils/backendClient";

interface PromptEditorProps {
  promptId: string;
  promptName: string;
}

export function PromptEditor({ promptId, promptName }: PromptEditorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPrompt();
    }
  }, [open]);

  const loadPrompt = async () => {
    try {
      const data = await backend.config.getPrompt({ id: promptId });
      setPrompt(data.systemPrompt || "");
    } catch (error) {
      console.error("Error loading prompt:", error);
      setPrompt("");
    }
  };

  const savePrompt = async () => {
    setLoading(true);
    try {
      await backend.config.updatePromptEndpoint({
        id: promptId,
        systemPrompt: prompt,
      });
      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Error",
        description: "Failed to save prompt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-white">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {promptName} Prompt</DialogTitle>
          <DialogDescription>
            Customize the system prompt for this widget to change how it analyzes data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt">System Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm mt-2"
              placeholder="Enter system prompt..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={savePrompt} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Prompt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";

export function NewChatPage() {
  const [, setLocation] = useLocation();
  const createMutation = useCreateOpenaiConversation();

  useEffect(() => {
    async function init() {
      try {
        const conv = await createMutation.mutateAsync({ data: { title: "New Session" } });
        setLocation(`/chat/${conv.id}`);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-primary font-mono tracking-widest text-sm uppercase">Initializing Data Stream...</p>
    </div>
  );
}
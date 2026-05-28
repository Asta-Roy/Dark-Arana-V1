import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetOpenaiConversationQueryKey } from "@workspace/api-client-react";

export function useChatStream(conversationId: number) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true);
    setStreamedContent("");
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to send message");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setStreamedContent((prev) => prev + parsed.content);
              }
              if (parsed.done) {
                queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
                setIsStreaming(false);
                return;
              }
            } catch (e) {
              console.error("Failed to parse SSE", e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Stream error", error);
      }
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
    }
  }, [conversationId, queryClient]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { sendMessage, isStreaming, streamedContent, stopStream };
}
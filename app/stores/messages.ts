// stores/messages.ts
import { defineStore } from "pinia";

interface Message {
  id: string;
  name: string;
  message: string;
  photo: string;
  event_id: string;
  created_at: string;
  updated_at: string;
}

export const useMessageStore = defineStore("message", () => {
  const messages = ref<Message[]>([]);
  const currentMessageIndex = ref(0);
  const isConnected = ref(false);
  const isLoading = ref(true);
  let slideInterval: NodeJS.Timeout | null = null;
  let eventSource: EventSource | null = null;

  // ─── Slideshow ─────────────────────────────────────────────────────────────

  const startSlideshow = () => {
    if (slideInterval) clearInterval(slideInterval);

    slideInterval = setInterval(() => {
      if (messages.value.length > 0) {
        currentMessageIndex.value =
          (currentMessageIndex.value + 1) % messages.value.length;
      }
    }, 8000); // advance every 8 seconds
  };

  const stopSlideshow = () => {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  };

  // ─── Mutations ─────────────────────────────────────────────────────────────

  /** Push a single message into state (also called by the SSE listener). */
  const addMessage = (data: Message) => {
    messages.value.push(data);
    if (messages.value.length === 1) startSlideshow();
  };

  /** Replace the full list (used for initial HTTP load). */
  const setMessages = (newMessages: Message[]) => {
    messages.value = newMessages;
    currentMessageIndex.value = 0;
    if (messages.value.length > 0) startSlideshow();
  };

  const clearMessages = () => {
    messages.value = [];
    currentMessageIndex.value = 0;
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const nextMessage = () => {
    if (messages.value.length > 0) {
      currentMessageIndex.value =
        (currentMessageIndex.value + 1) % messages.value.length;
    }
  };

  const previousMessage = () => {
    if (messages.value.length > 0) {
      currentMessageIndex.value =
        currentMessageIndex.value === 0
          ? messages.value.length - 1
          : currentMessageIndex.value - 1;
    }
  };

  // ─── SSE connection ────────────────────────────────────────────────────────

  /**
   * Open a Server-Sent Events connection to /api/messages/stream.
   * Every AMQP message consumed by the server plugin is forwarded here
   * and pushed into the `messages` reactive array automatically.
   *
   * Call this once from your page/component (e.g. onMounted).
   * EventSource handles reconnection automatically on network drops.
   */
  const connectSSE = () => {
    if (eventSource) return; // already open

    eventSource = new EventSource("/api/messages/stream");

    eventSource.addEventListener("connected", () => {
      console.log("📡 SSE connected to message stream");
      isConnected.value = true;
      isLoading.value = false;
    });

    eventSource.addEventListener("new-message", (e) => {
      try {
        const data: Message = JSON.parse((e as MessageEvent).data);
        console.log("📩 New message via SSE:", data);
        addMessage(data);
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    });

    eventSource.onerror = () => {
      console.warn("⚠️ SSE connection error – browser will auto-reconnect");
      isConnected.value = false;
    };
  };

  /** Close the SSE stream and stop the slideshow. */
  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    isConnected.value = false;
    stopSlideshow();
  };

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    messages,
    currentMessageIndex,
    isConnected,
    isLoading,
    connectSSE,
    disconnect,
    addMessage,
    setMessages,
    clearMessages,
    nextMessage,
    previousMessage,
  };
});

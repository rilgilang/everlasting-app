// stores/message.ts
import { defineStore } from "pinia";
import { Centrifuge } from "centrifuge";

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
  const runtimeConfig = useRuntimeConfig();
  const messages = ref<Message[]>([]);
  const currentMessageIndex = ref(0);
  const isConnected = ref(false);
  const isLoading = ref(true);
  let centrifuge: any = null;
  let subscription: any = null;
  let slideInterval: NodeJS.Timeout | null = null;

  // Connect to Centrifugo WebSocket
  const connectWebSocket = async (eventId: string) => {
    // Close existing connection
    if (centrifuge) {
      centrifuge.disconnect();
    }

    // Clear existing interval
    if (slideInterval) {
      clearInterval(slideInterval);
    }

    try {
      const response = await fetch(
        `${runtimeConfig.public.apiUrl}/v1/auth/generate`,
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();

      // Extract token from the response.data property
      const token = result.data;

      if (!token) {
        throw new Error("No token received from API");
      }

      // Create Centrifugo instance
      centrifuge = new Centrifuge(`${runtimeConfig.public.centrifugoUrl}`, {
        token: token,
      });

      // Set up event handlers
      centrifuge.on("connect", () => {
        console.log("Centrifugo connected");
        isConnected.value = true;
        isLoading.value = false;
      });

      centrifuge.on("disconnect", () => {
        console.log("Centrifugo disconnected");
        isConnected.value = false;
      });

      centrifuge.on("error", (error: any) => {
        console.error("Centrifugo error:", error);
        isConnected.value = false;
        isLoading.value = false;
      });

      // Create subscription to the event channel
      subscription = centrifuge.newSubscription(`wishing-wall`);

      // Handle publications (real-time messages)
      subscription.on("publication", (ctx: any) => {
        const data = ctx.data;
        console.log("Message received via Centrifugo:", data);

        // Check if message belongs to current event
        if (data.event_id === eventId || data.event_id === undefined) {
          const newMessage: Message = {
            id: data.id || Date.now().toString(),
            name: data.name,
            message: data.message,
            photo: data.photo,
            event_id: data.event_id || eventId,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          };

          messages.value.push(newMessage);

          // If this is the first message, start slideshow
          if (messages.value.length === 1) {
            startSlideshow();
          }
        }
      });

      // Handle subscription success
      subscription.on("subscribe", () => {
        console.log(`Subscribed to channel: event:${eventId}`);
      });

      subscription.on("error", (error: any) => {
        console.error("Subscription error:", error);
      });

      // Subscribe to the channel
      subscription.subscribe();

      // Connect to Centrifugo
      centrifuge.connect();
    } catch (error) {
      console.error("Failed to connect to Centrifugo:", error);
      isConnected.value = false;
      isLoading.value = false;
    }
  };

  // Start slideshow
  const startSlideshow = () => {
    if (slideInterval) {
      clearInterval(slideInterval);
    }

    slideInterval = setInterval(() => {
      if (messages.value.length > 0) {
        currentMessageIndex.value =
          (currentMessageIndex.value + 1) % messages.value.length;
      }
    }, 8000); // Change message every 8 seconds
  };

  // Stop slideshow
  const stopSlideshow = () => {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  };

  // Go to next message
  const nextMessage = () => {
    if (messages.value.length > 0) {
      currentMessageIndex.value =
        (currentMessageIndex.value + 1) % messages.value.length;
    }
  };

  // Go to previous message
  const previousMessage = () => {
    if (messages.value.length > 0) {
      currentMessageIndex.value =
        currentMessageIndex.value === 0
          ? messages.value.length - 1
          : currentMessageIndex.value - 1;
    }
  };

  // Clear messages
  const clearMessages = () => {
    messages.value = [];
    currentMessageIndex.value = 0;
  };

  // Disconnect WebSocket
  const disconnect = () => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    if (centrifuge) {
      centrifuge.disconnect();
      centrifuge = null;
    }
    stopSlideshow();
  };

  // Set messages (used for initial load)
  const setMessages = (newMessages: Message[]) => {
    messages.value = newMessages;
    currentMessageIndex.value = 0;

    // Start slideshow if there are messages
    if (messages.value.length > 0) {
      startSlideshow();
    }
  };

  return {
    messages,
    currentMessageIndex,
    isConnected,
    isLoading,
    connectWebSocket,
    disconnect,
    nextMessage,
    previousMessage,
    clearMessages,
    setMessages,
  };
});

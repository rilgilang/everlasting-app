// stores/message.ts
import { defineStore } from 'pinia'

interface Message {
    id: string
    name: string
    message: string
    photo: string
    event_id: string
    created_at: string
    updated_at: string
}


export const useMessageStore = defineStore('message', () => {
    const messages = ref<Message[]>([])
    const currentMessageIndex = ref(0)
    const isConnected = ref(false)
    const isLoading = ref(true)
    let ws: WebSocket | null = null
    let slideInterval: NodeJS.Timeout | null = null

    // Connect to WebSocket
    const connectWebSocket = (eventId: string) => {
        // Close existing connection
        if (ws) {
            ws.close()
        }

        // Clear existing interval
        if (slideInterval) {
            clearInterval(slideInterval)
        }

        // Connect to WebSocket
        ws = new WebSocket('wss://s13783.blr1.piesocket.com/v3/1?api_key=7SEqHklfXLf4YSvF8OmgAd147ewDT0RT2tZrCE3f&notify_self=1')

        ws.onopen = () => {
            console.log('WebSocket connected')
            isConnected.value = true
            isLoading.value = false
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                console.log('Message received:', data)

                // Check if message belongs to current event
                if (data.event_id === eventId) {
                    const newMessage: Message = {
                        id: data.id || Date.now().toString(),
                        name: data.name,
                        message: data.message,
                        photo: data.photo,
                        event_id: data.event_id,
                        created_at: data.created_at || new Date().toISOString(),
                        updated_at: data.updated_at || new Date().toISOString()
                    }

                    messages.value.push(newMessage)

                    // If this is the first message, start slideshow
                    if (messages.value.length === 1) {
                        startSlideshow()
                    }
                }
            } catch (error) {
                console.error('Error parsing message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            isConnected.value = false
            isLoading.value = false
        }

        ws.onclose = () => {
            console.log('WebSocket disconnected')
            isConnected.value = false
        }
    }

    // Start slideshow
    const startSlideshow = () => {
        if (slideInterval) {
            clearInterval(slideInterval)
        }

        slideInterval = setInterval(() => {
            if (messages.value.length > 0) {
                currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.value.length
            }
        }, 8000) // Change message every 8 seconds
    }

    // Stop slideshow
    const stopSlideshow = () => {
        if (slideInterval) {
            clearInterval(slideInterval)
            slideInterval = null
        }
    }

    // Go to next message
    const nextMessage = () => {
        if (messages.value.length > 0) {
            currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.value.length
        }
    }

    // Go to previous message
    const previousMessage = () => {
        if (messages.value.length > 0) {
            currentMessageIndex.value = currentMessageIndex.value === 0
                ? messages.value.length - 1
                : currentMessageIndex.value - 1
        }
    }

    // Clear messages
    const clearMessages = () => {
        messages.value = []
        currentMessageIndex.value = 0
    }

    // Disconnect WebSocket
    const disconnect = () => {
        if (ws) {
            ws.close()
            ws = null
        }
        stopSlideshow()
    }

    // Set messages (used for initial load)
    const setMessages = (newMessages: Message[]) => {
        messages.value = newMessages
        currentMessageIndex.value = 0
        
        // Start slideshow if there are messages
        if (messages.value.length > 0) {
            startSlideshow()
        }
    }


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
        setMessages
    }
})
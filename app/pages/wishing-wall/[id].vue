<!-- pages/wishing-wall/[id].vue -->
<script setup lang="ts">
definePageMeta({
    layout: false // Fullscreen layout
})

const route = useRoute()
const eventId = route.params.id as string

const messageStore = useMessageStore()
const isFullscreen = ref(false)
const showControls = ref(true)
let controlsTimeout: NodeJS.Timeout | null = null

// Fetch messages for this event
const fetchMessages = async () => {
    messageStore.isLoading = true
    try {
        const response = await fetch(`https://everlasting-api.ourmoment.my.id/api/v1/event/${eventId}/wishing-wall`)

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`)
        }

        const result = await response.json()
        if (result.data != null) {
            const messagesData = result.data || result.messages || result || []

            // Set messages in store
            messageStore.setMessages(messagesData)
        }
    } catch (error: any) {
        console.error('Error fetching messages:', error)
    } finally {
        messageStore.isLoading = false
    }
}

// Connect to WebSocket and fetch saved messages on mount
onMounted(() => {
    // First fetch saved messages
    fetchMessages()

    // Then connect to WebSocket for real-time updates
    messageStore.connectWebSocket(eventId)

    // Auto-hide controls after 3 seconds
    startControlsTimeout()
})

// Cleanup on unmount
onUnmounted(() => {
    messageStore.disconnect()
    if (controlsTimeout) {
        clearTimeout(controlsTimeout)
    }
})

// Current message
const currentMessage = computed(() => {
    if (messageStore.messages.length === 0) return null
    return messageStore.messages[messageStore.currentMessageIndex]
})

// Format date
const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return 'Just now'
    return new Date(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Get photo URL
const getPhotoUrl = (photoPath: string) => {
    if (!photoPath) return 'https://placehold.co/400x400?text=No+Photo'
    return `https://s3.ourmoment.my.id/wishing-wall/${photoPath}`
}

// Toggle fullscreen
const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        isFullscreen.value = true
    } else {
        document.exitFullscreen()
        isFullscreen.value = false
    }
}

// Start controls timeout
const startControlsTimeout = () => {
    if (controlsTimeout) {
        clearTimeout(controlsTimeout)
    }
    showControls.value = true
    controlsTimeout = setTimeout(() => {
        showControls.value = false
    }, 3000)
}

// Handle mouse move
const handleMouseMove = () => {
    startControlsTimeout()
}

// Handle keyboard navigation
const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
        case 'ArrowLeft':
            messageStore.previousMessage()
            startControlsTimeout()
            break
        case 'ArrowRight':
            messageStore.nextMessage()
            startControlsTimeout()
            break
        case 'f':
            toggleFullscreen()
            break
        case 'Escape':
            if (isFullscreen.value) {
                document.exitFullscreen()
                isFullscreen.value = false
            }
            break
    }
}

// Listen for keyboard events
onMounted(() => {
    window.addEventListener('keydown', handleKeyPress)
    document.addEventListener('fullscreenchange', () => {
        isFullscreen.value = !!document.fullscreenElement
    })
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
})

// Loading state
const isLoading = computed(() => messageStore.isLoading)
const messageCount = computed(() => messageStore.messages.length)
</script>

<template>
    <div class="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900"
        @mousemove="handleMouseMove">
        <!-- Loading State -->
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
                <div class="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4">
                </div>
                <p class="text-white/80 text-lg">Loading messages...</p>
            </div>
        </div>

        <!-- No Messages State -->
        <div v-else-if="messageCount === 0" class="absolute inset-0 flex items-center justify-center">
            <div class="text-center animate-fadeIn">
                <Icon name="i-lucide-message-circle" class="w-24 h-24 text-white/30 mx-auto mb-4" />
                <h2 class="text-3xl font-bold text-white mb-2">No Messages Yet</h2>
                <p class="text-white/60 text-lg">Waiting for wishes to arrive...</p>
                <div class="mt-6 flex gap-2 justify-center">
                    <div class="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                    <div class="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-150"></div>
                    <div class="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-300"></div>
                </div>
            </div>
        </div>

        <!-- Slideshow Content -->
        <div v-else class="relative h-full flex items-center justify-center p-8">
            <!-- Current Message Card -->
            <transition name="slide" mode="out-in">
                <div :key="currentMessage?.id"
                    class="max-w-4xl w-full bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-slideIn">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                        <!-- Photo Section -->
                        <div class="flex items-center justify-center">
                            <div class="relative">
                                <div
                                    class="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl">
                                </div>
                                <img :src="getPhotoUrl(currentMessage?.photo || '')" :alt="currentMessage?.name"
                                    class="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover shadow-2xl border-4 border-white/20 animate-zoomIn"
                                    @error="(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Photo'" />
                            </div>
                        </div>

                        <!-- Message Section -->
                        <div class="flex flex-col justify-center text-center md:text-left">
                            <div class="mb-4">
                                <h2 class="text-3xl md:text-4xl font-bold text-white mb-2 animate-slideInRight">
                                    {{ currentMessage?.name }}
                                </h2>
                                <p class="text-purple-200 text-sm animate-slideInRight delay-100">
                                    {{ formatDate(currentMessage?.created_at || '') }}
                                </p>
                            </div>
                            <div class="relative">
                                <Icon name="i-lucide-quote" class="absolute -top-4 -left-4 w-8 h-8 text-white/20" />
                                <p
                                    class="text-xl md:text-2xl text-white leading-relaxed animate-slideInRight delay-200">
                                    "{{ currentMessage?.message }}"
                                </p>
                                <Icon name="i-lucide-quote"
                                    class="absolute -bottom-4 -right-4 w-8 h-8 text-white/20 rotate-180" />
                            </div>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Navigation Arrows -->
            <button v-show="showControls" @click="messageStore.previousMessage"
                class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-300 hover:scale-110">
                <Icon name="i-lucide-chevron-left" class="w-8 h-8 text-white" />
            </button>

            <button v-show="showControls" @click="messageStore.nextMessage"
                class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-300 hover:scale-110">
                <Icon name="i-lucide-chevron-right" class="w-8 h-8 text-white" />
            </button>

            <!-- Progress Bar -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div class="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-7000 ease-linear"
                    :style="{ width: `${((messageStore.currentMessageIndex + 1) / messageCount) * 100}%` }"></div>
            </div>

            <!-- Message Counter -->
            <div v-show="showControls"
                class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-4 py-2 text-white text-sm backdrop-blur-sm">
                {{ messageStore.currentMessageIndex + 1 }} / {{ messageCount }}
            </div>

            <!-- Controls Overlay -->
            <div v-show="showControls" class="absolute top-4 right-4 flex gap-2">
                <button @click="toggleFullscreen"
                    class="bg-black/50 hover:bg-black/70 rounded-lg p-2 transition-all duration-300"
                    :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'">
                    <Icon :name="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
                        class="w-5 h-5 text-white" />
                </button>
            </div>

            <!-- Event ID Badge -->
            <div v-show="showControls"
                class="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1.5 text-white text-xs backdrop-blur-sm">
                <Icon name="i-lucide-hash" class="w-3 h-3 inline mr-1" />
                {{ eventId }}
            </div>

            <!-- Connection Status -->
            <div v-show="showControls"
                class="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 rounded-lg px-3 py-1.5 text-white text-xs backdrop-blur-sm">
                <div :class="[
                    'w-2 h-2 rounded-full',
                    messageStore.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                ]"></div>
                <span>{{ messageStore.isConnected ? 'Live' : 'Connecting...' }}</span>
            </div>
        </div>

        <!-- Keyboard Shortcuts Hint -->
        <div v-show="showControls"
            class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 rounded-lg px-4 py-2 text-white text-xs backdrop-blur-sm mt-16">
            ← → | F for fullscreen | ESC to exit
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(50px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes zoomIn {
    from {
        opacity: 0;
        transform: scale(0.8);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
}

.animate-slideIn {
    animation: slideIn 0.5s ease-out;
}

.animate-slideInRight {
    animation: slideInRight 0.5s ease-out;
    animation-fill-mode: both;
}

.animate-zoomIn {
    animation: zoomIn 0.5s ease-out;
}

.delay-100 {
    animation-delay: 0.1s;
}

.delay-150 {
    animation-delay: 0.15s;
}

.delay-200 {
    animation-delay: 0.2s;
}

.delay-300 {
    animation-delay: 0.3s;
}

/* Slide transition */
.slide-enter-active {
    transition: all 0.5s ease-out;
}

.slide-leave-active {
    transition: all 0.3s ease-in;
}

.slide-enter-from {
    opacity: 0;
    transform: translateX(100px);
}

.slide-leave-to {
    opacity: 0;
    transform: translateX(-100px);
}

/* Duration utilities */
.duration-7000 {
    transition-duration: 7000ms;
}
</style>
<!-- pages/wishes-wall/slideshow.vue -->
<script setup lang="ts">
declare module 'nuxt/app' {
    interface NuxtLayouts {
        'dashboard': unknown
    }
}

definePageMeta({
    layout: false, // No layout for fullscreen slideshow
})

// Dummy messages for slideshow - would come from WebSocket
const messages = ref([
    {
        id: 1,
        author: 'John Doe',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        message: 'This conference is amazing! Learned so much about AI and machine learning.',
        timestamp: '2026-05-15T10:30:00'
    },
    {
        id: 2,
        author: 'Jane Smith',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        message: 'Great networking opportunities here!',
        timestamp: '2026-05-15T11:15:00'
    },
    {
        id: 3,
        author: 'Mike Johnson',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        message: 'The keynote speech was inspiring!',
        timestamp: '2026-05-15T12:00:00'
    }
])

const currentIndex = ref(0)
const isFullscreen = ref(false)
let intervalId: NodeJS.Timeout | null = null

// Simulate WebSocket connection for real-time messages
const connectWebSocket = () => {
    // In real app, connect to WebSocket
    const interval = setInterval(() => {
        const newMessage = {
            id: Date.now(),
            author: `Guest ${Math.floor(Math.random() * 1000)}`,
            photo: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(Math.random() * 100)}.jpg`,
            message: `This is a real-time message from the slideshow! ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
        }
        messages.value.push(newMessage)

        // Auto-scroll to new message if we're at the end
        if (currentIndex.value === messages.value.length - 2) {
            setTimeout(() => {
                currentIndex.value = messages.value.length - 1
            }, 100)
        }
    }, 10000) // New message every 10 seconds

    return () => clearInterval(interval)
}

// Auto-slide messages
const startSlideshow = () => {
    if (intervalId) clearInterval(intervalId)
    intervalId = setInterval(() => {
        nextMessage()
    }, 8000) // Change message every 8 seconds
}

const nextMessage = () => {
    if (currentIndex.value < messages.value.length - 1) {
        currentIndex.value++
    } else {
        currentIndex.value = 0 // Loop back to start
    }
}

const previousMessage = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--
    } else {
        currentIndex.value = messages.value.length - 1
    }
}

const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        isFullscreen.value = true
    } else {
        document.exitFullscreen()
        isFullscreen.value = false
    }
}

// Keyboard navigation
const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
        case 'ArrowLeft':
            previousMessage()
            break
        case 'ArrowRight':
            nextMessage()
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

onMounted(() => {
    startSlideshow()
    const cleanup = connectWebSocket()
    window.addEventListener('keydown', handleKeyPress)

    // Listen for fullscreen change
    document.addEventListener('fullscreenchange', () => {
        isFullscreen.value = !!document.fullscreenElement
    })

    return () => {
        if (intervalId) clearInterval(intervalId)
        cleanup()
        window.removeEventListener('keydown', handleKeyPress)
    }
})

const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const exitSlideshow = () => {
    navigateTo('/wishes-wall')
}
</script>

<template>
    <div class="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900">
        <!-- Current Message Display -->
        <div class="relative h-full flex items-center justify-center p-8">
            <div class="max-w-6xl w-full">
                <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                    <div class="flex flex-col md:flex-row gap-8 items-center">
                        <!-- Photo -->
                        <div class="flex-shrink-0">
                            <img :src="messages[currentIndex]?.photo" :alt="messages[currentIndex]?.author"
                                class="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover shadow-xl border-4 border-white" />
                        </div>

                        <!-- Message Content -->
                        <div class="flex-1 text-center md:text-left">
                            <div class="mb-4">
                                <h2 class="text-3xl md:text-4xl font-bold text-white mb-2">
                                    {{ messages[currentIndex]?.author }}
                                </h2>
                                <p class="text-emerald-200 text-sm">
                                    {{ formatTime(messages[currentIndex]?.timestamp) }}
                                </p>
                            </div>
                            <p class="text-xl md:text-2xl text-white leading-relaxed">
                                "{{ messages[currentIndex]?.message }}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Navigation Buttons -->
            <button @click="previousMessage"
                class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all">
                <Icon name="i-lucide-chevron-left" class="w-8 h-8 text-white" />
            </button>

            <button @click="nextMessage"
                class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all">
                <Icon name="i-lucide-chevron-right" class="w-8 h-8 text-white" />
            </button>

            <!-- Progress Bar -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div class="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-7000"
                    :style="{ width: `${((currentIndex + 1) / messages.length) * 100}%` }"></div>
            </div>
        </div>

        <!-- Controls Overlay -->
        <div class="absolute top-4 right-4 flex gap-2">
            <button @click="toggleFullscreen" class="bg-black/50 hover:bg-black/70 rounded-lg p-2 transition-colors"
                :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'">
                <Icon :name="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" class="w-5 h-5 text-white" />
            </button>

            <button @click="exitSlideshow" class="bg-black/50 hover:bg-black/70 rounded-lg p-2 transition-colors"
                title="Exit Slideshow">
                <Icon name="i-lucide-x" class="w-5 h-5 text-white" />
            </button>
        </div>

        <!-- Message Counter -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-4 py-2 text-white text-sm">
            {{ currentIndex + 1 }} / {{ messages.length }}
        </div>

        <!-- Keyboard Shortcuts Hint -->
        <div class="absolute bottom-4 left-4 bg-black/50 rounded-lg p-2 text-white text-xs">
            ← → | F for fullscreen | ESC to exit
        </div>
    </div>
</template>

<style scoped>
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-7000 {
    transition-duration: 7000ms;
}
</style>
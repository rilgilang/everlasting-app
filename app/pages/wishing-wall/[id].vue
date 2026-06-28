<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const eventId = route.params.id as string

const messageStore = useMessageStore()
const isFullscreen = ref(false)
const showControls = ref(true)
const runtimeConfig = useRuntimeConfig()
let controlsTimeout: NodeJS.Timeout | null = null

const fetchMessages = async () => {
  messageStore.isLoading = true
  try {
    const response = await fetch(
      `${runtimeConfig.public.apiUrl}/v1/event/${eventId}/wishing-wall`
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const result = await response.json()
    if (result.data != null) {
      const messagesData = result.data || result.messages || result || []
      messageStore.setMessages(messagesData)
    }
  } catch (error: unknown) {
    console.error('Error fetching messages:', error)
  } finally {
    messageStore.isLoading = false
  }
}

onMounted(() => {
  fetchMessages()
  messageStore.connectSSE()
  startControlsTimeout()
})

onUnmounted(() => {
  messageStore.disconnect()
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }
})

const currentMessage = computed(() => {
  if (messageStore.messages.length === 0) return null
  return messageStore.messages[messageStore.currentMessageIndex]
})

const formatDate = (dateString: string) => {
  if (!dateString || dateString === '0001-01-01T00:00:00Z') return 'Just now'
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPhotoUrl = (photoPath: string) => {
  if (!photoPath) return 'https://placehold.co/400x400?text=No+Photo'
  return `https://s3.ourmoment.my.id/wishing-wall/${photoPath}`
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

const startControlsTimeout = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }
  showControls.value = true
  controlsTimeout = setTimeout(() => {
    showControls.value = false
  }, 3000)
}

const handleMouseMove = () => {
  startControlsTimeout()
}

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

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

const isLoading = computed(() => messageStore.isLoading)
const messageCount = computed(() => messageStore.messages.length)
const progressPercent = computed(() =>
  messageCount.value > 0
    ? ((messageStore.currentMessageIndex + 1) / messageCount.value) * 100
    : 0
)
</script>

<template>
  <div
    class="fixed inset-0 overflow-hidden"
    @mousemove="handleMouseMove"
  >
    <!-- Animated gradient background -->
    <div class="absolute inset-0 bg-[linear-gradient(135deg,#1a0a1e,#2d1b36,#3d1f3d,#2a1525,#1a0a1e)] animate-gradient bg-[length:400%_400%]" />

    <!-- Decorative particles/sparkles -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-[10%] left-[15%] w-2 h-2 bg-amber-400/40 rounded-full animate-sparkle" />
      <div
        class="absolute top-[20%] right-[25%] w-1.5 h-1.5 bg-rose-400/50 rounded-full animate-sparkle"
        style="animation-delay: 0.5s"
      />
      <div
        class="absolute top-[60%] left-[10%] w-2 h-2 bg-rose-300/40 rounded-full animate-sparkle"
        style="animation-delay: 1s"
      />
      <div
        class="absolute top-[40%] right-[15%] w-1.5 h-1.5 bg-amber-300/50 rounded-full animate-sparkle"
        style="animation-delay: 1.5s"
      />
      <div
        class="absolute bottom-[20%] left-[30%] w-2 h-2 bg-rose-400/40 rounded-full animate-sparkle"
        style="animation-delay: 2s"
      />
      <div
        class="absolute bottom-[30%] right-[20%] w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-sparkle"
        style="animation-delay: 2.5s"
      />
      <div
        class="absolute top-[75%] left-[50%] w-2 h-2 bg-rose-300/40 rounded-full animate-sparkle"
        style="animation-delay: 0.8s"
      />
      <div
        class="absolute top-[15%] left-[60%] w-1.5 h-1.5 bg-amber-300/50 rounded-full animate-sparkle"
        style="animation-delay: 1.8s"
      />

      <!-- Glow orbs -->
      <div class="absolute top-[20%] left-[10%] w-96 h-96 bg-rose-600/10 rounded-full blur-[120px]" />
      <div class="absolute bottom-[10%] right-[10%] w-80 h-80 bg-amber-600/10 rounded-full blur-[100px]" />
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center z-10"
    >
      <div class="text-center">
        <div class="relative">
          <div class="w-24 h-24 border-4 border-rose-200/20 border-t-rose-400 rounded-full animate-spin mx-auto" />
          <div
            class="absolute inset-2 border-4 border-amber-200/20 border-b-amber-400 rounded-full animate-spin mx-auto"
            style="animation-direction: reverse; animation-duration: 1.5s"
          />
        </div>
        <p class="text-white/80 text-lg mt-6 font-medium">
          Loading wishes...
        </p>
        <p class="text-white/50 text-sm mt-2">
          Preparing something beautiful
        </p>
      </div>
    </div>

    <!-- No Messages State -->
    <div
      v-else-if="messageCount === 0"
      class="absolute inset-0 flex items-center justify-center z-10"
    >
      <div class="text-center animate-fadeIn">
        <div class="relative inline-block mb-6">
          <div class="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full" />
          <Icon
            name="i-lucide-message-circle"
            class="w-28 h-28 text-white/30 relative z-10"
          />
        </div>
        <h2 class="text-4xl font-serif font-bold text-white mb-3">
          No Wishes Yet
        </h2>
        <p class="text-white/50 text-lg mb-8">
          Waiting for beautiful messages to arrive...
        </p>
        <div class="flex gap-3 justify-center">
          <div class="w-2.5 h-2.5 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full animate-bounce" />
          <div
            class="w-2.5 h-2.5 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full animate-bounce"
            style="animation-delay: 0.15s"
          />
          <div
            class="w-2.5 h-2.5 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full animate-bounce"
            style="animation-delay: 0.3s"
          />
        </div>
      </div>
    </div>

    <!-- Slideshow Content -->
    <div
      v-else
      class="relative h-full flex items-center justify-center p-8 z-10"
    >
      <!-- Current Message Card -->
      <transition
        name="slide"
        mode="out-in"
      >
        <div
          :key="currentMessage?.id"
          class="max-w-5xl w-full animate-slideIn"
        >
          <!-- Glassmorphic card -->
          <div class="relative bg-white/10 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/20">
            <!-- Top accent bar -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

            <div class="grid grid-cols-1 md:grid-cols-2">
              <!-- Photo Section -->
              <div class="flex items-center justify-center p-10 md:p-12">
                <div class="relative">
                  <!-- Outer glow -->
                  <div class="absolute inset-0 bg-gradient-to-br from-rose-500/30 to-amber-500/30 rounded-full blur-[60px] scale-110" />

                  <!-- Gradient ring like Instagram story -->
                  <div class="rounded-full p-[3px] bg-gradient-to-br from-amber-400 via-rose-500 to-amber-400 shadow-2xl">
                    <img
                      :src="getPhotoUrl(currentMessage?.photo || '')"
                      :alt="currentMessage?.name"
                      class="w-64 h-64 md:w-72 md:h-72 rounded-full object-cover border-2 border-white/10"
                      @error="(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Photo')"
                    >
                  </div>
                </div>
              </div>

              <!-- Message Section -->
              <div class="flex flex-col justify-center p-10 md:p-12 text-center md:text-left">
                <!-- Quote marks -->
                <div class="absolute top-6 right-8 text-6xl font-serif text-white/10 leading-none select-none">
                  "
                </div>

                <div class="mb-6">
                  <h2 class="text-4xl md:text-5xl font-serif font-bold text-white mb-2 animate-slideInRight">
                    {{ currentMessage?.name }}
                  </h2>
                  <div
                    class="flex items-center justify-center md:justify-start gap-2 animate-slideInRight"
                    style="animation-delay: 0.1s"
                  >
                    <div class="w-2 h-2 bg-amber-400 rounded-full" />
                    <p class="text-rose-200/80 text-sm font-medium">
                      {{ formatDate(currentMessage?.created_at || "") }}
                    </p>
                  </div>
                </div>

                <div class="relative">
                  <div class="absolute -left-4 top-0 w-8 h-8 border-l-2 border-t-2 border-amber-400/40 rounded-tl-lg" />
                  <p
                    class="text-2xl md:text-3xl text-white/90 leading-relaxed font-light animate-slideInRight"
                    style="animation-delay: 0.2s"
                  >
                    {{ currentMessage?.message }}
                  </p>
                  <div class="absolute -right-4 bottom-0 w-8 h-8 border-r-2 border-b-2 border-amber-400/40 rounded-br-lg" />
                </div>

                <!-- Decorative divider -->
                <div
                  class="flex items-center gap-3 mt-8 animate-slideInRight"
                  style="animation-delay: 0.3s"
                >
                  <div class="h-px flex-1 bg-gradient-to-r from-transparent to-white/30" />
                  <div class="w-3 h-3 rotate-45 border border-amber-400/50" />
                  <div class="h-px flex-1 bg-gradient-to-l from-transparent to-white/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Navigation Arrows -->
      <button
        v-show="showControls"
        class="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full p-4 transition-all duration-300 hover:scale-110 border border-white/20"
        @click="messageStore.previousMessage"
      >
        <Icon
          name="i-lucide-chevron-left"
          class="w-6 h-6 text-white"
        />
      </button>

      <button
        v-show="showControls"
        class="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full p-4 transition-all duration-300 hover:scale-110 border border-white/20"
        @click="messageStore.nextMessage"
      >
        <Icon
          name="i-lucide-chevron-right"
          class="w-6 h-6 text-white"
        />
      </button>

      <!-- Progress Bar -->
      <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
        <div
          class="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 transition-all duration-7000 ease-linear"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <!-- Message Counter -->
      <div
        v-show="showControls"
        class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl rounded-full px-5 py-2.5 text-white text-sm border border-white/20"
      >
        <span class="font-semibold text-amber-400">{{ messageStore.currentMessageIndex + 1 }}</span>
        <span class="text-white/50 mx-1">/</span>
        <span class="text-white/70">{{ messageCount }}</span>
      </div>

      <!-- Controls Overlay -->
      <div
        v-show="showControls"
        class="absolute top-6 right-6 flex gap-3"
      >
        <button
          class="bg-black/40 hover:bg-black/60 backdrop-blur-xl rounded-xl p-3 transition-all duration-300 border border-white/20"
          :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'"
          @click="toggleFullscreen"
        >
          <Icon
            :name="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
            class="w-5 h-5 text-white"
          />
        </button>
      </div>

      <!-- Event ID Badge -->
      <div
        v-show="showControls"
        class="absolute top-6 left-6 bg-black/40 backdrop-blur-xl rounded-xl px-4 py-2.5 text-white text-xs border border-white/20"
      >
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          <span class="font-medium">{{ eventId }}</span>
        </div>
      </div>

      <!-- Connection Status -->
      <div
        v-show="showControls"
        class="absolute bottom-6 right-6 flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-xl px-4 py-2.5 text-white text-xs border border-white/20"
      >
        <div
          :class="[
            'w-2.5 h-2.5 rounded-full',
            messageStore.isConnected
              ? 'bg-green-400 animate-pulse'
              : 'bg-red-400'
          ]"
        />
        <span class="font-medium">{{ messageStore.isConnected ? "Live" : "Connecting..." }}</span>
      </div>

      <!-- Keyboard Shortcuts Hint -->
      <div
        v-show="showControls"
        class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl rounded-xl px-5 py-2.5 text-white text-xs border border-white/20 mt-16"
      >
        <span class="text-white/50">← → Navigate</span>
        <span class="text-white/30 mx-2">|</span>
        <span class="text-white/50">F Fullscreen</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-fadeIn { animation: fadeIn 0.6s ease-out; }
.animate-slideIn { animation: slideIn 0.5s ease-out; }
.animate-slideInRight { animation: slideInRight 0.5s ease-out; animation-fill-mode: both; }
.animate-sparkle { animation: sparkle 3s ease-in-out infinite; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-gradient { animation: gradient-shift 15s ease infinite; }

.delay-100 { animation-delay: 0.1s; }
.delay-150 { animation-delay: 0.15s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

.slide-enter-active { transition: all 0.5s ease-out; }
.slide-leave-active { transition: all 0.3s ease-in; }
.slide-enter-from { opacity: 0; transform: translateX(100px); }
.slide-leave-to { opacity: 0; transform: translateX(-100px); }

.duration-7000 { transition-duration: 7000ms; }
</style>

<script setup lang="ts">
import QRCode from 'qrcode'

const request = useRequestURL()
const route = useRoute()
const eventId = route.params.id
const runtimeConfig = useRuntimeConfig()

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  messages: number
  max_messages: number
  image: string
  status: string
  organizer: string
  created_at: string
  updated_at: string
}

const event = ref<Event | null>(null)
const isLoading = ref(true)
const error = ref(false)
const qrCodeUrl = ref('')
const toast = useToast()

const API_URL
  = runtimeConfig.public.apiUrl || 'https://everlasting-api.ourmoment.my.id/api'

const fetchEvent = async () => {
  isLoading.value = true
  error.value = false

  try {
    const response = await fetch(`${API_URL}/v1/event/${eventId}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const result = await response.json()
    event.value = result.data
  } catch (err) {
    console.error('Error fetching event:', err)
    error.value = true
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Date TBD'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (timeString: string) => {
  if (!timeString) return 'Time TBD'
  return timeString
}

const generateQRCode = async () => {
  try {
    const qrValue = `${request.host}/guest/${eventId}`

    const qrDataUrl = await QRCode.toDataURL(qrValue, {
      width: 1000,
      margin: 2,
      color: {
        dark: '#881337',
        light: '#ffffff'
      }
    })
    qrCodeUrl.value = qrDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
  }
}

const copyQrValue = async () => {
  try {
    const hostUrl = window.location.origin
    const qrValue = `${hostUrl}/guest/${eventId}`
    await navigator.clipboard.writeText(qrValue)

    toast.add({
      title: 'Copied!',
      description: 'QR link copied to clipboard',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error) {
    console.error('Failed to copy:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to copy link',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

onMounted(() => {
  fetchEvent()
})

watch(event, (newEvent) => {
  if (newEvent) {
    generateQRCode()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-amber-50 relative">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-32 right-20 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl" />
      <div class="absolute bottom-40 left-20 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl" />
    </div>

    <!-- Header -->
    <div class="relative z-10 bg-white/70 backdrop-blur-xl border-b border-rose-100/50 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
              <svg
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-serif font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Ucapin
              </h1>
              <p class="text-xs text-stone-500">
                Ucapkan pesanmu, hadirkan momen.
              </p>
            </div>
          </div>
          <div class="text-sm text-stone-500 font-medium">
            {{ new Date().toLocaleDateString("id-ID", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-6 py-12">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex justify-center items-center h-96"
      >
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p class="text-stone-600 font-medium">
            Loading event details...
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center py-20"
      >
        <div class="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon
            name="i-lucide-calendar-x"
            class="w-10 h-10 text-rose-500"
          />
        </div>
        <h3 class="text-2xl font-serif font-bold text-stone-800 mb-3">
          Event Not Found
        </h3>
        <p class="text-stone-500 mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <UButton
          color="primary"
          variant="outline"
          class="rounded-xl"
          @click="navigateTo('/')"
        >
          Back to Home
        </UButton>
      </div>

      <!-- Event Details -->
      <div
        v-else-if="event"
        class="space-y-8"
      >
        <!-- Event Hero -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-rose-100/80 backdrop-blur-sm rounded-full mb-6">
            <div class="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span class="text-sm font-medium text-rose-700 capitalize">{{ event.status }}</span>
          </div>

          <h1 class="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 bg-clip-text text-transparent mb-4">
            {{ event.title }}
          </h1>

          <p class="text-stone-600 text-lg max-w-2xl mx-auto leading-relaxed">
            {{ event.description }}
          </p>

          <div class="flex justify-center mt-6">
            <div class="flex items-center gap-2">
              <div class="w-8 h-px bg-gradient-to-r from-transparent to-rose-400" />
              <div class="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              <div class="w-8 h-px bg-gradient-to-l from-transparent to-rose-400" />
            </div>
          </div>
        </div>

        <!-- Event Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div class="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/20 border border-rose-100/50 hover:shadow-xl hover:shadow-rose-200/40 hover:scale-[1.02] transition-all duration-300">
            <div class="text-center">
              <div class="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200/50 group-hover:scale-110 transition-transform">
                <Icon
                  name="i-lucide-calendar"
                  class="w-7 h-7 text-white"
                />
              </div>
              <p class="text-sm text-stone-500 mb-1 font-medium">
                Date
              </p>
              <p class="font-semibold text-stone-800">
                {{ formatDate(event.date) }}
              </p>
            </div>
          </div>

          <div class="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-amber-100/20 border border-amber-100/50 hover:shadow-xl hover:shadow-amber-200/40 hover:scale-[1.02] transition-all duration-300">
            <div class="text-center">
              <div class="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform">
                <Icon
                  name="i-lucide-clock"
                  class="w-7 h-7 text-white"
                />
              </div>
              <p class="text-sm text-stone-500 mb-1 font-medium">
                Time
              </p>
              <p class="font-semibold text-stone-800">
                {{ formatTime(event.time) }}
              </p>
            </div>
          </div>

          <div class="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/20 border border-rose-100/50 hover:shadow-xl hover:shadow-rose-200/40 hover:scale-[1.02] transition-all duration-300">
            <div class="text-center">
              <div class="w-14 h-14 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200/50 group-hover:scale-110 transition-transform">
                <Icon
                  name="i-lucide-map-pin"
                  class="w-7 h-7 text-white"
                />
              </div>
              <p class="text-sm text-stone-500 mb-1 font-medium">
                Location
              </p>
              <p class="font-semibold text-stone-800">
                {{ event.location }}
              </p>
            </div>
          </div>

          <div class="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-amber-100/20 border border-amber-100/50 hover:shadow-xl hover:shadow-amber-200/40 hover:scale-[1.02] transition-all duration-300">
            <div class="text-center">
              <div class="w-14 h-14 bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform">
                <Icon
                  name="i-lucide-tag"
                  class="w-7 h-7 text-white"
                />
              </div>
              <p class="text-sm text-stone-500 mb-1 font-medium">
                Category
              </p>
              <p class="font-semibold text-stone-800">
                {{ event.category }}
              </p>
            </div>
          </div>
        </div>

        <!-- Organizer & Capacity Card -->
        <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/20 border border-rose-100/50">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50">
                <Icon
                  name="i-lucide-users"
                  class="w-6 h-6 text-white"
                />
              </div>
              <div>
                <p class="text-sm text-stone-500 font-medium">
                  Organized by
                </p>
                <p class="font-semibold text-stone-800 text-lg">
                  {{ event.organizer }}
                </p>
              </div>
            </div>
            <div class="text-center md:text-right">
              <p class="text-sm text-stone-500 font-medium">
                Capacity
              </p>
              <div class="flex items-center gap-2 mt-1">
                <div class="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                    :style="{ width: `${(event.messages / event.max_messages) * 100}%` }"
                  />
                </div>
                <span class="font-semibold text-stone-800">{{ event.messages }}/{{ event.max_messages }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            :to="`/dashboard/${event.id}`"
            color="primary"
            variant="solid"
            size="lg"
            class="px-8 rounded-xl shadow-lg shadow-rose-300/50 hover:shadow-xl hover:shadow-rose-400/60 transition-all"
          >
            <Icon
              name="i-lucide-layout-dashboard"
              class="w-5 h-5 mr-2"
            />
            Go to Dashboard
          </UButton>

          <UButton
            :to="`/wishing-wall/${event.id}`"
            color="neutral"
            variant="outline"
            size="lg"
            class="px-8 rounded-xl border-rose-200 hover:border-rose-300 transition-all"
          >
            <Icon
              name="i-lucide-message-circle"
              class="w-5 h-5 mr-2"
            />
            View Wishes Wall
          </UButton>
        </div>

        <!-- QR Code Section -->
        <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-rose-100/20 border border-rose-100/50">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl mb-4 shadow-lg shadow-amber-200/50">
              <Icon
                name="i-lucide-qr-code"
                class="w-8 h-8 text-white"
              />
            </div>
            <h3 class="text-xl font-serif font-semibold text-stone-800 mb-2">
              Share QR Code
            </h3>
            <p class="text-sm text-stone-500 mb-6">
              Let guests scan to send their wishes
            </p>

            <div class="inline-block p-4 bg-white rounded-2xl shadow-inner border-2 border-amber-200">
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                :alt="`QR Code for ${event.title}`"
                class="w-40 h-40 cursor-pointer hover:scale-105 transition-transform rounded-xl"
                @click="copyQrValue"
              >
              <div
                v-else
                class="w-40 h-40 flex items-center justify-center"
              >
                <div class="w-10 h-10 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
              </div>
            </div>

            <p class="text-xs text-stone-500 mt-4">
              <Icon
                name="i-lucide-mouse-pointer-click"
                class="w-3 h-3 inline mr-1"
              />
              Click QR to copy link
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="relative z-10 mt-16 py-8 border-t border-rose-100/50">
      <div class="max-w-7xl mx-auto px-6 text-center">
        <p class="text-sm text-stone-500">
          &copy; {{ new Date().getFullYear() }} Ucapin. All rights reserved.
        </p>
        <p class="text-xs text-stone-400 mt-1">
          Crafted with <span class="text-rose-500">&hearts;</span> by Ourmoment
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }
</style>

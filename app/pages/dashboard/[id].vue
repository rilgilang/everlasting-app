<script setup lang="ts">
import { useMessageStore } from '~/stores/messages'
import html2canvas from 'html2canvas'

definePageMeta({
  layout: 'dashboard'
})

interface Message {
  id: string
  name: string
  message: string
  photo: string
  event_id: string
  created_at: string
  updated_at: string
}

const route = useRoute()
const eventId = route.params.id as string

const _messageStore = useMessageStore()
const toast = useToast()

const messages = ref<Message[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const eventInfo = ref({
  title: '',
  description: '',
  location: '',
  category: '',
  organizer: '',
  status: ''
})
const stats = ref({
  total: 0,
  today: 0,
  activeUsers: 0
})

const isWebSocketConnected = ref(false)
const _ws: WebSocket | null = null

const filteredMessages = computed(() => {
  if (!searchQuery.value) return messages.value
  return messages.value.filter(
    msg =>
      msg.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      || msg.message.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
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

const fetchEventInfo = async () => {
  try {
    const response = await fetch(
      `https://everlasting-api.ourmoment.my.id/api/v1/event/${eventId}`
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    const event = data.data || data

    eventInfo.value = {
      title: event.title || 'Event',
      description: event.description || '',
      location: event.location || '',
      category: event.category || '',
      organizer: event.organizer || '',
      status: event.status || 'active'
    }
  } catch (error: unknown) {
    console.error('Error fetching event info:', error)
    eventInfo.value = {
      title: 'Event Dashboard',
      description: 'View and manage messages for this event',
      location: 'Unknown',
      category: 'General',
      organizer: 'Event Organizer',
      status: 'active'
    }
  }
}

const fetchMessages = async () => {
  isLoading.value = true
  try {
    const response = await fetch(
      `https://everlasting-api.ourmoment.my.id/api/v1/event/${eventId}/wishing-wall`
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    messages.value = data.data || data.messages || data || []

    updateStats()

    toast.add({
      title: 'Success',
      description: `${messages.value.length} messages loaded`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: unknown) {
    console.error('Error fetching messages:', error)

    toast.add({
      title: 'Warning',
      description: 'Using demo data. API endpoint not available.',
      color: 'warning',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

const updateStats = () => {
  stats.value.total = messages.value.length

  const today = new Date().toDateString()
  stats.value.today = messages.value.filter(
    msg => new Date(msg.created_at).toDateString() === today
  ).length

  const uniqueUsers = new Set(messages.value.map(msg => msg.name))
  stats.value.activeUsers = uniqueUsers.size
}

const refreshMessages = async () => {
  await fetchMessages()
}

const downloadMessages = async () => {
  try {
    const eventResponse = await $fetch<{ data: { title: string, location: string, description: string, date: string } }>(`https://everlasting-api.ourmoment.my.id/api/v1/event/${eventId}`)
    const wishesResponse = await $fetch<{ data: Array<{ photo: string, name: string, message: string, created_at: string }> }>(`https://everlasting-api.ourmoment.my.id/api/v1/event/${eventId}/wishing-wall`)
    const template = await $fetch<string>('/messages.html', { parseResponse: txt => txt })

    const eventData = eventResponse.data
    const rawMessages = wishesResponse.data || []

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const getPhotoUrl = (photoPath: string) => {
      if (!photoPath) return 'https://placehold.co/400x400?text=No+Photo'
      return `https://s3.ourmoment.my.id/wishing-wall/${photoPath}`
    }

    const messageHtmlArray = rawMessages
      .map(
        (msg: { photo: string, name: string, message: string, created_at: string }) => `
      <div class="message-card">
        <div class="photo-container">
          <img src="${getPhotoUrl(msg.photo)}" class="message-photo" crossorigin="anonymous">
          <div class="photo-overlay"></div>
        </div>
        <div class="message-body">
          <div class="author-info">
            <p class="date">${new Date(msg.created_at).toLocaleDateString()}</p>
            <h2 class="author-name">${msg.name}</h2>
          </div>
          <div class="quote-box">"${msg.message}"</div>
        </div>
      </div>
    `
      )
      .join('')

    const finalHtml = template
      .replace(/{{eventTitle}}/g, eventData.title)
      .replace(/{{eventLocation}}/g, eventData.location)
      .replace(/{{eventDescription}}/g, eventData.description)
      .replace(/{{eventDate}}/g, formatDate(eventData.date))
      .replace(/{{reportDate}}/g, formatDate(new Date().toISOString()))
      .replace(/{{totalMessages}}/g, rawMessages.length.toString())
      .replace(/{{#each messages}}[\s\S]*?{{\/each}}/, messageHtmlArray)

    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '100%',
      bottom: '100%',
      width: '480px',
      border: 'none',
      visibility: 'hidden'
    })
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) return

    iframeDoc.open()
    iframeDoc.write(finalHtml)
    iframeDoc.close()

    const images = iframeDoc.querySelectorAll('img')
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
      })
    )

    const canvas = await html2canvas(iframeDoc.body, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#0f172a',
      width: 480,
      windowWidth: 480
    })

    const link = document.createElement('a')
    link.download = `${eventData.title.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    document.body.removeChild(iframe)

    toast.add({
      title: 'Image Generated',
      description: 'Your story is ready!',
      color: 'success'
    })
  } catch (error) {
    console.error('Export failed:', error)
    toast.add({
      title: 'Error',
      description: 'Could not fetch event data',
      color: 'error'
    })
  }
}

onMounted(() => {
  fetchEventInfo()
  fetchMessages()
})

onUnmounted(() => {
  // cleanup
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-amber-50 relative">
    <!-- Decorative background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-20 right-20 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl" />
      <div class="absolute bottom-40 left-20 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 p-6 space-y-6">
      <!-- Header with Event Info -->
      <div class="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-md">
              <Icon
                name="i-lucide-calendar"
                class="w-4 h-4 text-white"
              />
            </div>
            <span class="text-sm text-rose-600 font-semibold">Event Dashboard</span>
          </div>
          <h1 class="text-3xl font-serif font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            {{ eventInfo.title }}
          </h1>
          <p class="text-sm text-stone-500 mt-1">
            {{ eventInfo.description || "Monitor and manage messages for this event" }}
          </p>
          <div class="flex gap-4 mt-3 text-sm text-stone-500 flex-wrap">
            <span
              v-if="eventInfo.location"
              class="flex items-center gap-1.5"
            >
              <Icon
                name="i-lucide-map-pin"
                class="w-3.5 h-3.5 text-rose-500"
              />
              {{ eventInfo.location }}
            </span>
            <span
              v-if="eventInfo.category"
              class="flex items-center gap-1.5"
            >
              <Icon
                name="i-lucide-tag"
                class="w-3.5 h-3.5 text-amber-500"
              />
              {{ eventInfo.category }}
            </span>
            <span
              v-if="eventInfo.organizer"
              class="flex items-center gap-1.5"
            >
              <Icon
                name="i-lucide-user"
                class="w-3.5 h-3.5 text-rose-500"
              />
              {{ eventInfo.organizer }}
            </span>
          </div>
        </div>
        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="outline"
            :loading="isLoading"
            class="rounded-xl border-stone-300"
            @click="refreshMessages"
          >
            <Icon
              name="i-lucide-refresh-cw"
              class="w-4 h-4 mr-2"
            />
            Refresh
          </UButton>
          <UButton
            color="primary"
            variant="solid"
            class="rounded-xl shadow-lg shadow-rose-300/50"
            @click="downloadMessages"
          >
            <Icon
              name="i-lucide-download"
              class="w-4 h-4 mr-2"
            />
            Download
          </UButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/20 border border-rose-100/50 hover:shadow-xl hover:shadow-rose-200/40 transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-stone-500 font-medium mb-1">
                Total Messages
              </p>
              <p class="text-4xl font-serif font-bold text-stone-800">
                {{ stats.total }}
              </p>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-200/50 group-hover:scale-110 transition-transform">
              <Icon
                name="i-lucide-message-circle"
                class="w-7 h-7 text-white"
              />
            </div>
          </div>
        </div>

        <div class="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-amber-100/20 border border-amber-100/50 hover:shadow-xl hover:shadow-amber-200/40 transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-stone-500 font-medium mb-1">
                Today's Messages
              </p>
              <p class="text-4xl font-serif font-bold text-stone-800">
                {{ stats.today }}
              </p>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform">
              <Icon
                name="i-lucide-calendar"
                class="w-7 h-7 text-white"
              />
            </div>
          </div>
        </div>

        <div class="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/20 border border-rose-100/50 hover:shadow-xl hover:shadow-rose-200/40 transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-stone-500 font-medium mb-1">
                Active Users
              </p>
              <p class="text-4xl font-serif font-bold text-stone-800">
                {{ stats.activeUsers }}
              </p>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-200/50 group-hover:scale-110 transition-transform">
              <Icon
                name="i-lucide-users"
                class="w-7 h-7 text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Connection Status & Event ID -->
      <div class="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-xl px-5 py-3 border border-rose-100/50">
        <div class="flex items-center gap-2">
          <div
            :class="[
              'w-2.5 h-2.5 rounded-full',
              isWebSocketConnected
                ? 'bg-green-500 animate-pulse'
                : 'bg-red-400'
            ]"
          />
          <span class="text-sm text-stone-600 font-medium">
            WebSocket: {{ isWebSocketConnected ? "Connected" : "Disconnected" }}
          </span>
        </div>
        <div class="text-sm text-stone-500">
          Event ID: <span class="font-mono font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">{{ eventId }}</span>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-rose-100/20 border border-rose-100/50">
        <UInput
          v-model="searchQuery"
          placeholder="Search messages by name or content..."
          icon="i-lucide-search"
          size="lg"
          class="w-full"
        />
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex justify-center py-16"
      >
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p class="text-stone-600 font-medium">
            Loading messages...
          </p>
        </div>
      </div>

      <!-- Messages List -->
      <div
        v-else-if="filteredMessages.length > 0"
        class="space-y-4"
      >
        <div class="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-xl px-5 py-3 border border-rose-100/50">
          <span class="text-sm text-stone-600 font-medium">
            Showing <span class="text-rose-600 font-semibold">{{ filteredMessages.length }}</span> of <span class="text-stone-800 font-semibold">{{ messages.length }}</span> messages
          </span>
        </div>

        <div
          v-for="message in filteredMessages"
          :key="message.id"
          class="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-rose-100/20 border border-rose-100/50 p-5 hover:shadow-xl hover:shadow-rose-200/40 hover:border-rose-200 transition-all duration-300"
        >
          <div class="flex gap-4">
            <!-- Avatar / Photo -->
            <div class="flex-shrink-0">
              <div class="w-14 h-14 rounded-full overflow-hidden bg-stone-200 ring-2 ring-rose-200 group-hover:ring-rose-300 transition-all shadow-md">
                <img
                  :src="getPhotoUrl(message.photo)"
                  :alt="message.name"
                  class="w-full h-full object-cover"
                  @error="(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=User')"
                >
              </div>
            </div>

            <!-- Message Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 class="font-semibold text-stone-800 text-lg">
                  {{ message.name }}
                </h3>
                <span class="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  {{ formatDate(message.created_at) }}
                </span>
              </div>
              <p class="text-stone-700 leading-relaxed">
                {{ message.message }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="text-center py-20"
      >
        <div class="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon
            name="i-lucide-message-circle"
            class="w-12 h-12 text-rose-400"
          />
        </div>
        <h3 class="text-2xl font-serif font-bold text-stone-800 mb-2">
          No Messages Yet
        </h3>
        <p class="text-stone-500 mb-6">
          Messages from guests will appear here
        </p>
        <UButton
          color="primary"
          variant="outline"
          class="rounded-xl border-rose-200 hover:border-rose-300"
          @click="refreshMessages"
        >
          <Icon
            name="i-lucide-refresh-cw"
            class="w-4 h-4 mr-2"
          />
          Refresh
        </UButton>
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

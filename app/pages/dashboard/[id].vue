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
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <div class="p-6 space-y-5">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900">
            {{ eventInfo.title }}
          </h1>
          <p class="text-stone-500 text-sm mt-0.5">
            {{ eventInfo.description || 'Monitor and manage messages for this event' }}
          </p>
          <div class="flex gap-3 mt-2 text-xs text-stone-400">
            <span
              v-if="eventInfo.location"
              class="flex items-center gap-1"
            >
              <Icon
                name="i-lucide-map-pin"
                class="w-3 h-3"
              />{{ eventInfo.location }}
            </span>
            <span
              v-if="eventInfo.category"
              class="flex items-center gap-1"
            >
              <Icon
                name="i-lucide-tag"
                class="w-3 h-3"
              />{{ eventInfo.category }}
            </span>
            <span
              v-if="eventInfo.organizer"
              class="flex items-center gap-1"
            >
              <Icon
                name="i-lucide-user"
                class="w-3 h-3"
              />{{ eventInfo.organizer }}
            </span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm"
            :disabled="isLoading"
            @click="refreshMessages"
          >
            <Icon
              name="i-lucide-refresh-cw"
              class="w-4 h-4 mr-1.5 inline"
              :class="{ 'animate-spin': isLoading }"
            />
            Refresh
          </button>
          <button
            class="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            @click="downloadMessages"
          >
            <Icon
              name="i-lucide-download"
              class="w-4 h-4 mr-1.5 inline"
            />
            Download
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-stone-500 text-xs font-medium uppercase tracking-wider">
                Total Messages
              </p>
              <p class="text-3xl font-bold text-stone-900 mt-1">
                {{ stats.total }}
              </p>
            </div>
            <div class="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Icon
                name="i-lucide-message-circle"
                class="w-5 h-5 text-rose-600"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-stone-500 text-xs font-medium uppercase tracking-wider">
                Today
              </p>
              <p class="text-3xl font-bold text-stone-900 mt-1">
                {{ stats.today }}
              </p>
            </div>
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Icon
                name="i-lucide-calendar"
                class="w-5 h-5 text-amber-600"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-stone-500 text-xs font-medium uppercase tracking-wider">
                Active Users
              </p>
              <p class="text-3xl font-bold text-stone-900 mt-1">
                {{ stats.activeUsers }}
              </p>
            </div>
            <div class="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Icon
                name="i-lucide-users"
                class="w-5 h-5 text-rose-600"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Status & Search -->
      <div class="flex items-center justify-between bg-white rounded-xl border border-stone-200 px-4 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <div :class="['w-2 h-2 rounded-full', isWebSocketConnected ? 'bg-green-500' : 'bg-red-400']" />
          <span class="text-xs text-stone-500">WebSocket: {{ isWebSocketConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <span class="text-xs text-stone-500">ID: <span class="font-mono font-semibold text-stone-700">{{ eventId }}</span></span>
      </div>

      <div class="bg-white rounded-xl border border-stone-200 p-3 shadow-sm">
        <div class="relative">
          <Icon
            name="i-lucide-search"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search messages..."
            class="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30 transition-all"
          >
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="text-center py-20"
      >
        <div class="w-10 h-10 border-3 border-stone-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
        <p class="text-stone-500 text-sm">
          Loading messages...
        </p>
      </div>

      <!-- Messages -->
      <div
        v-else-if="filteredMessages.length > 0"
        class="space-y-3"
      >
        <p class="text-xs text-stone-500">
          Showing {{ filteredMessages.length }} of {{ messages.length }} messages
        </p>

        <div
          v-for="message in filteredMessages"
          :key="message.id"
          class="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 hover:shadow-md transition-all"
        >
          <div class="flex gap-3">
            <img
              :src="getPhotoUrl(message.photo)"
              :alt="message.name"
              class="w-10 h-10 rounded-full object-cover mt-0.5"
              @error="(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=User')"
            >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-semibold text-stone-900 text-sm">{{ message.name }}</span>
                <span class="text-xs text-stone-400">{{ formatDate(message.created_at) }}</span>
              </div>
              <p class="text-stone-600 text-sm leading-relaxed">
                {{ message.message }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else
        class="text-center py-20"
      >
        <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon
            name="i-lucide-message-circle"
            class="w-8 h-8 text-stone-400"
          />
        </div>
        <h3 class="text-lg font-semibold text-stone-700 mb-1">
          No Messages Yet
        </h3>
        <p class="text-stone-500 text-sm mb-4">
          Messages from guests will appear here
        </p>
        <button
          class="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-all shadow-sm"
          @click="refreshMessages"
        >
          <Icon
            name="i-lucide-refresh-cw"
            class="w-4 h-4 mr-1.5 inline"
          />
          Refresh
        </button>
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

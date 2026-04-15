<!-- pages/wishes-wall/index.vue -->
<script setup lang="ts">
declare module 'nuxt/app' {
    interface NuxtLayouts {
        'dashboard': unknown
    }
}

definePageMeta({
    layout: 'dashboard',
})

import QRCode from 'qrcode'

// Dummy events data
const events = ref([
    {
        id: 1,
        title: 'Annual Tech Conference 2026',
        date: '2026-05-15',
        location: 'Jakarta Convention Center',
        qrValue: 'https://ucapin.com/event/1/register',
        messages: 0,
        maxMessages: 500,
        status: 'upcoming'
    },
    {
        id: 2,
        title: 'Creative Design Workshop',
        date: '2026-05-20',
        location: 'Creative Hub, Bandung',
        qrValue: 'https://ucapin.com/event/2/register',
        messages: 0,
        maxMessages: 100,
        status: 'upcoming'
    },
    {
        id: 3,
        title: 'Startup Networking Night',
        date: '2026-05-25',
        location: 'Coworking Space, Surabaya',
        qrValue: 'https://ucapin.com/event/3/register',
        messages: 0,
        maxMessages: 150,
        status: 'upcoming'
    }
])

// Real messages from WebSocket only
const messages = ref<any[]>([])

// State
const selectedEvent = ref<any>(null)
const eventMessages = ref<any[]>([])
const qrCode = ref('')
const isLoading = ref(true)
const isQRModalOpen = ref(false)
const searchQuery = ref('')
const selectedEventForQR = ref<any>(null)
const toast = useToast()

// WebSocket connection
let ws: WebSocket | null = null
const isWebSocketConnected = ref(false)

// Filter messages based on search
const filteredMessages = computed(() => {
    if (!searchQuery.value) return eventMessages.value
    return eventMessages.value.filter(msg =>
        msg.message.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        msg.author.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

// Generate QR code for event
const generateQRCode = async (qrValue: string) => {
    try {
        const qrDataUrl = await QRCode.toDataURL(qrValue, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })
        qrCode.value = qrDataUrl
    } catch (error) {
        console.error('Error generating QR code:', error)
    }
}

// Select event and load messages
const selectEvent = async (event: any) => {
    selectedEvent.value = event
    eventMessages.value = messages.value.filter(m => m.eventId === event.id)
    await generateQRCode(event.qrValue)
    isLoading.value = false

    toast.add({
        title: 'Event Selected',
        description: `Showing messages for ${event.title}`,
        color: 'info',
        icon: 'i-lucide-check-circle'
    })
}

// Open QR modal for event identification
const openQRModal = (event: any) => {
    selectedEventForQR.value = event
    // Regenerate QR code for the modal
    generateQRCode(event.qrValue)
    isQRModalOpen.value = true
}

// Copy to clipboard
const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
        toast.add({
            title: 'Copied!',
            description: 'QR value copied to clipboard',
            color: 'success',
            icon: 'i-lucide-check-circle'
        })
    } catch (error) {
        console.error('Failed to copy:', error)
    }
}

// Export messages as JSON or CSV
const exportMessages = (format: 'json' | 'csv') => {
    if (!eventMessages.value.length) {
        toast.add({
            title: 'No Data',
            description: 'No messages to export',
            color: 'warning',
            icon: 'i-lucide-alert-circle'
        })
        return
    }

    const exportData = eventMessages.value.map(msg => ({
        author: msg.author,
        message: msg.message,
        timestamp: new Date(msg.timestamp).toLocaleString(),
        likes: msg.likes || 0
    }))

    if (format === 'json') {
        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${selectedEvent.value.title.replace(/\s/g, '_')}_messages.json`
        link.click()
        URL.revokeObjectURL(url)
    } else {
        // CSV format
        const headers = ['Author', 'Message', 'Timestamp', 'Likes']
        const csvRows = [headers]

        exportData.forEach(msg => {
            csvRows.push([
                `"${msg.author}"`,
                `"${msg.message.replace(/"/g, '""')}"`,
                `"${msg.timestamp}"`,
                msg.likes
            ])
        })

        const csvContent = csvRows.map(row => row.join(',')).join('\n')
        const dataBlob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${selectedEvent.value.title.replace(/\s/g, '_')}_messages.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    toast.add({
        title: 'Exported!',
        description: `Messages exported as ${format.toUpperCase()}`,
        color: 'success',
        icon: 'i-lucide-download'
    })
}

// Handle incoming WebSocket messages
const handleWebSocketMessage = (event: MessageEvent) => {
    console.log('WebSocket message received:', event)
    try {
        const data = JSON.parse(event.data)

        // Assuming the message has structure similar to:
        // { eventId: 1, author: 'John', message: 'Hello', photo: 'url', timestamp: '...' }
        const newMessage = {
            id: Date.now(),
            eventId: data.eventId || selectedEvent.value?.id,
            author: data.author || 'Anonymous',
            avatar: data.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            photo: data.photo || data.avatar,
            message: data.message || data.text,
            timestamp: data.timestamp || new Date().toISOString(),
            likes: 0
        }

        // Add to global messages array
        messages.value.push(newMessage)

        // If this message is for the currently selected event, add to displayed messages
        if (selectedEvent.value && newMessage.eventId === selectedEvent.value.id) {
            eventMessages.value.push(newMessage)

            // Update message count for the event
            const event = events.value.find(e => e.id === newMessage.eventId)
            if (event) {
                event.messages++
            }

            // Show notification for new message
            toast.add({
                title: 'New Message!',
                description: `New message from ${newMessage.author}`,
                color: 'info',
                icon: 'i-lucide-message-circle',
                duration: 3000
            })
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error)
    }
}

// Connect to WebSocket for real-time messages
const connectWebSocket = () => {
    try {
        ws = new WebSocket('wss://s13783.blr1.piesocket.com/v3/1?api_key=7SEqHklfXLf4YSvF8OmgAd147ewDT0RT2tZrCE3f&notify_self=1')

        ws.onopen = () => {
            console.log('WebSocket connected')
            isWebSocketConnected.value = true
        }

        ws.onmessage = handleWebSocketMessage

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            isWebSocketConnected.value = false
        }

        ws.onclose = () => {
            console.log('WebSocket disconnected')
            isWebSocketConnected.value = false
        }

        // Return cleanup function
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close()
            }
        }
    } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        isWebSocketConnected.value = false
        return () => { }
    }
}

// Start WebSocket connection
let cleanupWebSocket: (() => void) | null = null

onMounted(() => {
    cleanupWebSocket = connectWebSocket()
})

onUnmounted(() => {
    if (cleanupWebSocket) {
        cleanupWebSocket()
    }
})

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>

<template>
    <div class="min-h-screen p-6">
        <div class="space-y-6">
            <!-- Page Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-semibold tracking-tight">Wishes Wall Panel</h1>
                    <p class="text-sm text-dimmed mt-1">Manage and display messages from your events</p>
                </div>
                <div class="flex gap-3">
                    <UButton color="primary" variant="solid" class="flex items-center gap-2"
                        @click="navigateTo('/wishes-wall/slideshow')" :disabled="!selectedEvent">
                        <Icon name="i-lucide-monitor-play" class="w-4 h-4" />
                        Start Slideshow
                    </UButton>
                    <UDropdownMenu v-if="selectedEvent && eventMessages.length" :items="[[
                        { label: 'Export as JSON', onSelect: () => exportMessages('json') },
                        { label: 'Export as CSV', onSelect: () => exportMessages('csv') }
                    ]]">
                        <UButton color="neutral" variant="outline" class="flex items-center gap-2">
                            <Icon name="i-lucide-download" class="w-4 h-4" />
                            Export Messages
                        </UButton>
                    </UDropdownMenu>
                </div>
            </div>

            <!-- Three Column Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Part 1: Event Selection Panel -->
                <div class="lg:col-span-3 space-y-4">
                    <UCard>
                        <template #header>
                            <div class="flex items-center gap-2">
                                <Icon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
                                <h2 class="text-lg font-semibold">Select Event</h2>
                            </div>
                        </template>

                        <div class="space-y-3">
                            <div v-for="event in events" :key="event.id" @click="selectEvent(event)" :class="[
                                'p-4 rounded-lg border-2 cursor-pointer transition-all',
                                selectedEvent?.id === event.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-default hover:border-primary/50'
                            ]">
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="font-semibold">{{ event.title }}</h3>
                                    <UBadge :color="event.status === 'upcoming' ? 'success' : 'neutral'"
                                        variant="subtle">
                                        {{ event.status }}
                                    </UBadge>
                                </div>
                                <div class="space-y-1 text-sm text-dimmed">
                                    <div class="flex items-center gap-2">
                                        <Icon name="i-lucide-calendar" class="w-3.5 h-3.5" />
                                        <span>{{ new Date(event.date).toLocaleDateString('id-ID') }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Icon name="i-lucide-map-pin" class="w-3.5 h-3.5" />
                                        <span>{{ event.location }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Icon name="i-lucide-message-circle" class="w-3.5 h-3.5" />
                                        <span>{{ event.messages }} / {{ event.maxMessages }} messages</span>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <UButton size="xs" color="neutral" variant="outline" class="w-full"
                                        @click.stop="openQRModal(event)">
                                        <Icon name="i-lucide-qr-code" class="w-3.5 h-3.5 mr-1" />
                                        Show QR Code
                                    </UButton>
                                </div>
                            </div>
                        </div>
                    </UCard>
                </div>

                <!-- Part 2: Messages List -->
                <div class="lg:col-span-9">
                    <UCard class="h-full">
                        <template #header>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <Icon name="i-lucide-message-circle" class="w-5 h-5 text-primary" />
                                    <h2 class="text-lg font-semibold">
                                        Messages
                                        <span v-if="selectedEvent" class="text-sm text-dimmed ml-2">
                                            - {{ selectedEvent.title }}
                                        </span>
                                    </h2>
                                </div>
                                <UInput v-if="selectedEvent && eventMessages.length" v-model="searchQuery"
                                    placeholder="Search messages..." icon="i-lucide-search" size="sm" class="w-64" />
                            </div>
                        </template>

                        <div v-if="!selectedEvent" class="text-center py-12">
                            <Icon name="i-lucide-calendar" class="w-16 h-16 mx-auto text-dimmed mb-4" />
                            <h3 class="text-lg font-semibold mb-2">No Event Selected</h3>
                            <p class="text-sm text-dimmed">Please select an event from the left panel to view messages
                            </p>
                        </div>

                        <div v-else-if="isLoading" class="flex justify-center py-12">
                            <UButton color="primary" variant="outline" loading>
                                Loading messages...
                            </UButton>
                        </div>

                        <div v-else-if="filteredMessages.length === 0" class="text-center py-12">
                            <Icon name="i-lucide-message-circle" class="w-16 h-16 mx-auto text-dimmed mb-4" />
                            <h3 class="text-lg font-semibold mb-2">No Messages Yet</h3>
                            <p class="text-sm text-dimmed">Messages will appear here once guests start posting</p>
                        </div>

                        <div v-else class="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            <div v-for="message in filteredMessages" :key="message.id"
                                class="flex gap-3 p-4 rounded-lg border border-default hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <img :src="message.photo || message.avatar" :alt="message.author"
                                    class="w-12 h-12 rounded-full object-cover"
                                    @error="(e) => (e.target as HTMLImageElement).src = message.avatar" />
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                                        <span class="text-sm font-semibold">{{ message.author }}</span>
                                        <span class="text-xs text-dimmed">{{ formatDateTime(message.timestamp) }}</span>
                                    </div>
                                    <p class="text-sm text-foreground">{{ message.message }}</p>
                                    <div class="flex items-center gap-2 mt-2">
                                        <div class="flex items-center gap-1 text-xs text-dimmed">
                                            <Icon name="i-lucide-heart" class="w-3.5 h-3.5" />
                                            <span>{{ message.likes }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <template #footer>
                            <div class="flex justify-between items-center text-sm text-dimmed">
                                <span>Total Messages: {{ eventMessages.length }}</span>
                                <div class="flex items-center gap-2">
                                    <div :class="[
                                        'w-2 h-2 rounded-full',
                                        isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'
                                    ]"></div>
                                    <span>WebSocket: {{ isWebSocketConnected ? 'Connected' : 'Disconnected' }}</span>
                                </div>
                            </div>
                        </template>
                    </UCard>
                </div>
            </div>
        </div>

        <!-- QR Code Modal for Event Identification -->
        <UModal v-model:open="isQRModalOpen">
            <UCard v-if="selectedEventForQR" class="text-center">
                <template #header>
                    <div class="flex justify-between items-center w-full">
                        <h3 class="text-lg font-semibold">Event QR Code</h3>
                        <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="isQRModalOpen = false" />
                    </div>
                </template>

                <div class="space-y-6 py-4">
                    <div>
                        <h4 class="font-semibold mb-1">{{ selectedEventForQR.title }}</h4>
                        <p class="text-sm text-dimmed">{{ new Date(selectedEventForQR.date).toLocaleDateString('id-ID')
                            }}</p>
                    </div>

                    <div class="flex justify-center">
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <img :src="qrCode" :alt="`QR Code for ${selectedEventForQR.title}`" class="w-48 h-48"
                                v-if="qrCode" />
                            <div v-else class="w-48 h-48 flex items-center justify-center">
                                <Icon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <p class="text-sm text-dimmed">Scan this QR code to identify the event</p>
                        <div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <code class="flex-1 text-xs break-all">{{ selectedEventForQR.qrValue }}</code>
                            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-copy"
                                @click="copyToClipboard(selectedEventForQR.qrValue)" />
                        </div>
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-center">
                        <UButton color="primary" variant="solid" @click="isQRModalOpen = false">
                            Close
                        </UButton>
                    </div>
                </template>
            </UCard>
        </UModal>
    </div>
</template>
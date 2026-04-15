<!-- pages/wishes-wall/[id].vue -->
<script setup lang="ts">
declare module 'nuxt/app' {
    interface NuxtLayouts {
        'dashboard': unknown
    }
}

definePageMeta({
    layout: 'dashboard',
})

const route = useRoute()
const wallId = route.params.id // Unique QR code ID for the wishes wall

import QRCode from 'qrcode'

// State
const selectedEvent = ref<any>(null)
const eventMessages = ref<any[]>([])
const isLoading = ref(true)
const isNotFound = ref(false)
const searchQuery = ref('')
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

// Fetch event data by wall ID
const fetchEventByWallId = async (wallId: string | string[]) => {
    try {
        // Simulate API call - replace with actual API
        await new Promise(resolve => setTimeout(resolve, 500))

        // Dummy data mapping wall ID to event
        // In real app, this would be an API call: /api/wishes-wall/{wallId}
        const wallMapping: Record<string, any> = {
            'evt_tech_2026': {
                id: 1,
                title: 'Annual Tech Conference 2026',
                date: '2026-05-15',
                location: 'Jakarta Convention Center',
                qrValue: 'blok',
                messages: 0,
                maxMessages: 500,
                status: 'upcoming',
                organizer: 'Tech Events Indonesia',
                description: 'Join us for the biggest tech conference of the year'
            },
            'evt_design_2026': {
                id: 2,
                title: 'Creative Design Workshop',
                date: '2026-05-20',
                location: 'Creative Hub, Bandung',
                qrValue: 'https://ucapin.com/guest/2',
                messages: 0,
                maxMessages: 100,
                status: 'upcoming',
                organizer: 'Design Community',
                description: 'Hands-on workshop for UI/UX designers'
            },
            'evt_startup_2026': {
                id: 3,
                title: 'Startup Networking Night',
                date: '2026-05-25',
                location: 'Coworking Space, Surabaya',
                qrValue: 'https://ucapin.com/guest/3',
                messages: 0,
                maxMessages: 150,
                status: 'upcoming',
                organizer: 'Startup Association',
                description: 'Connect with founders and investors'
            }
        }

        const event = wallMapping[wallId as string]

        if (!event) {
            isNotFound.value = true
            return null
        }

        return event
    } catch (error) {
        console.error('Error fetching event:', error)
        isNotFound.value = true
        return null
    }
}

// Load messages for the event
const loadMessages = async (eventId: number) => {
    try {
        // Simulate API call to get messages
        await new Promise(resolve => setTimeout(resolve, 300))

        // In real app, this would be: /api/events/{eventId}/messages
        // For now, return empty array (messages will come from WebSocket)
        return []
    } catch (error) {
        console.error('Error loading messages:', error)
        return []
    }
}

// Handle incoming WebSocket messages
const handleWebSocketMessage = (event: MessageEvent) => {
    try {
        const data = JSON.parse(event.data)

        // Check if message is for this event
        if (selectedEvent.value && data.eventId === selectedEvent.value.id) {
            const newMessage = {
                id: Date.now(),
                eventId: data.eventId,
                author: data.author || 'Anonymous',
                avatar: data.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
                photo: data.photo || data.avatar,
                message: data.message || data.text,
                timestamp: data.timestamp || new Date().toISOString(),
                likes: 0
            }

            eventMessages.value.unshift(newMessage)

            // Update message count
            if (selectedEvent.value) {
                selectedEvent.value.messages++
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
        // Connect to WebSocket with event ID for filtering
        ws = new WebSocket('wss://s13783.blr1.piesocket.com/v3/1?api_key=7SEqHklfXLf4YSvF8OmgAd147ewDT0RT2tZrCE3f&notify_self=1')

        ws.onopen = () => {
            console.log('WebSocket connected')
            isWebSocketConnected.value = true

            // Subscribe to event channel
            if (selectedEvent.value) {
                ws?.send(JSON.stringify({
                    type: 'subscribe',
                    eventId: selectedEvent.value.id
                }))
            }
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

// Copy registration link to clipboard
const copyRegistrationLink = async () => {
    if (!selectedEvent.value) return

    try {
        await navigator.clipboard.writeText(selectedEvent.value.qrValue)
        toast.add({
            title: 'Copied!',
            description: 'Registration link copied to clipboard',
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

// Format date and time
const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'upcoming': return 'success'
        case 'ongoing': return 'info'
        case 'past': return 'neutral'
        default: return 'neutral'
    }
}

// Initialize page
const init = async () => {
    isLoading.value = true

    // Fetch event by wall ID
    const event = await fetchEventByWallId(wallId)

    if (!event) {
        isLoading.value = false
        return
    }

    selectedEvent.value = event

    // Load existing messages
    const messages = await loadMessages(event.id)
    eventMessages.value = messages

    isLoading.value = false
}

// WebSocket cleanup
let cleanupWebSocket: (() => void) | null = null

onMounted(() => {
    init()
})

watch(selectedEvent, (newEvent) => {
    if (newEvent) {
        cleanupWebSocket = connectWebSocket()
    }
})

onUnmounted(() => {
    if (cleanupWebSocket) {
        cleanupWebSocket()
    }
})
</script>

<template>
    <div class="min-h-screen p-6">
        <div class="space-y-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center h-96">
                <UButton color="primary" variant="outline" loading>
                    Loading wishes wall...
                </UButton>
            </div>

            <!-- Not Found State -->
            <div v-else-if="isNotFound" class="text-center py-12">
                <Icon name="i-lucide-calendar-x" class="w-16 h-16 mx-auto text-dimmed mb-4" />
                <h3 class="text-lg font-semibold mb-2">Wishes Wall Not Found</h3>
                <p class="text-sm text-dimmed mb-4">The wishes wall you're looking for doesn't exist.</p>
                <UButton color="primary" @click="navigateTo('/events')">
                    Browse Events
                </UButton>
            </div>

            <!-- Wishes Wall Content -->
            <div v-else class="space-y-6">
                <!-- Page Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <Icon name="i-lucide-message-square" class="w-5 h-5 text-primary" />
                            <span class="text-sm font-medium text-primary">Wishes Wall</span>
                        </div>
                        <h1 class="text-2xl font-semibold tracking-tight">{{ selectedEvent.title }}</h1>
                        <p class="text-sm text-dimmed mt-1">{{ selectedEvent.description }}</p>
                    </div>
                    <div class="flex gap-3">
                        <UButton color="primary" variant="solid" class="flex items-center gap-2"
                            @click="navigateTo(selectedEvent.qrValue)">
                            <Icon name="i-lucide-send" class="w-4 h-4" />
                            Send a Wish
                        </UButton>
                        <UDropdownMenu v-if="eventMessages.length" :items="[[
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

                <!-- Event Info Bar -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <UCard class="col-span-1">
                        <div class="flex items-center gap-3">
                            <Icon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
                            <div>
                                <p class="text-xs text-dimmed">Date</p>
                                <p class="text-sm font-medium">{{ new
                                    Date(selectedEvent.date).toLocaleDateString('id-ID') }}</p>
                            </div>
                        </div>
                    </UCard>

                    <UCard class="col-span-1">
                        <div class="flex items-center gap-3">
                            <Icon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
                            <div>
                                <p class="text-xs text-dimmed">Location</p>
                                <p class="text-sm font-medium">{{ selectedEvent.location }}</p>
                            </div>
                        </div>
                    </UCard>

                    <UCard class="col-span-1">
                        <div class="flex items-center gap-3">
                            <Icon name="i-lucide-users" class="w-5 h-5 text-primary" />
                            <div>
                                <p class="text-xs text-dimmed">Organizer</p>
                                <p class="text-sm font-medium">{{ selectedEvent.organizer }}</p>
                            </div>
                        </div>
                    </UCard>

                    <UCard class="col-span-1">
                        <div class="flex items-center gap-3">
                            <Icon name="i-lucide-message-circle" class="w-5 h-5 text-primary" />
                            <div>
                                <p class="text-xs text-dimmed">Messages</p>
                                <p class="text-sm font-medium">{{ selectedEvent.messages }} / {{
                                    selectedEvent.maxMessages }}</p>
                            </div>
                        </div>
                    </UCard>
                </div>

                <!-- Progress Bar -->
                <UCard>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-dimmed">Wall Capacity</span>
                            <span class="font-medium">{{ Math.round((selectedEvent.messages / selectedEvent.maxMessages)
                                * 100) }}%</span>
                        </div>
                        <UProgress :value="(selectedEvent.messages / selectedEvent.maxMessages) * 100" size="md"
                            color="primary" />
                    </div>
                </UCard>

                <!-- Messages List -->
                <UCard class="h-full">
                    <template #header>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <Icon name="i-lucide-message-circle" class="w-5 h-5 text-primary" />
                                <h2 class="text-lg font-semibold">Wishes & Messages</h2>
                                <UBadge color="neutral" variant="subtle">
                                    {{ eventMessages.length }} messages
                                </UBadge>
                            </div>
                            <UInput v-if="eventMessages.length" v-model="searchQuery" placeholder="Search messages..."
                                icon="i-lucide-search" size="sm" class="w-64" />
                        </div>
                    </template>

                    <div v-if="eventMessages.length === 0" class="text-center py-12">
                        <Icon name="i-lucide-message-circle" class="w-16 h-16 mx-auto text-dimmed mb-4" />
                        <h3 class="text-lg font-semibold mb-2">No Messages Yet</h3>
                        <p class="text-sm text-dimmed mb-4">Be the first to send a wish to this event!</p>
                        <UButton color="primary" variant="solid" @click="navigateTo(selectedEvent.qrValue)">
                            Send a Wish
                        </UButton>
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
                            <div class="flex items-center gap-2">
                                <Icon name="i-lucide-qr-code" class="w-4 h-4" />
                                <span>Wall ID: {{ wallId }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div :class="[
                                    'w-2 h-2 rounded-full',
                                    isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'
                                ]"></div>
                                <span>Live Updates: {{ isWebSocketConnected ? 'Connected' : 'Disconnected' }}</span>
                            </div>
                        </div>
                    </template>
                </UCard>
            </div>
        </div>
    </div>
</template>
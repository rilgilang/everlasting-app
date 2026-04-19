<!-- pages/dashboard/[id].vue -->
<script setup lang="ts">
definePageMeta({
    layout: 'dashboard',
})

import { useMessageStore } from '~/stores/messages'

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

const messageStore = useMessageStore()
const toast = useToast()

// Local state
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

// WebSocket connection status
const isWebSocketConnected = ref(false)
let ws: WebSocket | null = null

// Filtered messages based on search
const filteredMessages = computed(() => {
    if (!searchQuery.value) return messages.value
    return messages.value.filter(msg =>
        msg.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
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

// Fetch event info
const fetchEventInfo = async () => {
    try {
        const response = await fetch(`https://everlasting-api.ourmoment.my.id/api/v1/event/${eventId}`)
        
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
    } catch (error: any) {
        console.error('Error fetching event info:', error)
        // Use fallback event info
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

// Fetch messages for this event
const fetchMessages = async () => {
    isLoading.value = true
    try {
        const response = await fetch(`https://everlasting-api.ourmoment.my.id/api/v1/event/${eventId}/wishing-wall`)
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`)
        }
        
        const data = await response.json()
        messages.value = data.data || data.messages || data || []
        
        // Update stats
        updateStats()
        
        toast.add({
            title: 'Success',
            description: `${messages.value.length} messages loaded`,
            color: 'success',
            icon: 'i-lucide-check-circle'
        })
    } catch (error: any) {
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

// Update statistics
const updateStats = () => {
    stats.value.total = messages.value.length
    
    const today = new Date().toDateString()
    stats.value.today = messages.value.filter(msg => 
        new Date(msg.created_at).toDateString() === today
    ).length
    
    const uniqueUsers = new Set(messages.value.map(msg => msg.name))
    stats.value.activeUsers = uniqueUsers.size
}

// Connect to WebSocket for real-time updates
const connectWebSocket = () => {
    try {
        ws = new WebSocket('wss://s13783.blr1.piesocket.com/v3/1?api_key=7SEqHklfXLf4YSvF8OmgAd147ewDT0RT2tZrCE3f&notify_self=1')
        
        ws.onopen = () => {
            console.log('WebSocket connected')
            isWebSocketConnected.value = true
        }
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                console.log('New message received:', data)
                
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
                    
                    // Add to messages list
                    messages.value.unshift(newMessage)
                    
                    // Update stats
                    updateStats()
                    
                    // Show notification
                    toast.add({
                        title: 'New Message!',
                        description: `New message from ${newMessage.name}`,
                        color: 'info',
                        icon: 'i-lucide-message-circle',
                        duration: 3000
                    })
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error)
            }
        }
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            isWebSocketConnected.value = false
        }
        
        ws.onclose = () => {
            console.log('WebSocket disconnected')
            isWebSocketConnected.value = false
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (!isWebSocketConnected.value) {
                    connectWebSocket()
                }
            }, 5000)
        }
    } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        isWebSocketConnected.value = false
    }
}

// Refresh messages
const refreshMessages = async () => {
    await fetchMessages()
}

// Clear all messages (admin only)
const clearMessages = () => {
    messages.value = []
    updateStats()
    toast.add({
        title: 'Cleared',
        description: 'All messages have been cleared',
        color: 'info',
        icon: 'i-lucide-trash-2'
    })
}

// Initialize on mount
onMounted(() => {
    fetchEventInfo()
    fetchMessages()
    connectWebSocket()
})

// Cleanup on unmount
onUnmounted(() => {
    if (ws) {
        ws.close()
    }
})
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div class="p-6 space-y-6">
            <!-- Header with Event Info -->
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <Icon name="i-lucide-calendar" class="w-5 h-5 text-primary-500" />
                        <span class="text-sm text-primary-600 dark:text-primary-400 font-medium">Event Dashboard</span>
                    </div>
                    <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {{ eventInfo.title }}
                    </h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ eventInfo.description || 'Monitor and manage messages for this event' }}
                    </p>
                    <div class="flex gap-4 mt-2 text-sm text-gray-500">
                        <span v-if="eventInfo.location" class="flex items-center gap-1">
                            <Icon name="i-lucide-map-pin" class="w-3 h-3" />
                            {{ eventInfo.location }}
                        </span>
                        <span v-if="eventInfo.category" class="flex items-center gap-1">
                            <Icon name="i-lucide-tag" class="w-3 h-3" />
                            {{ eventInfo.category }}
                        </span>
                        <span v-if="eventInfo.organizer" class="flex items-center gap-1">
                            <Icon name="i-lucide-user" class="w-3 h-3" />
                            {{ eventInfo.organizer }}
                        </span>
                    </div>
                </div>
                <div class="flex gap-3">
                    <UButton 
                        color="primary" 
                        variant="outline" 
                        @click="refreshMessages"
                        :loading="isLoading"
                    >
                        <Icon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
                        Refresh
                    </UButton>
                    <UButton 
                        color="error" 
                        variant="outline" 
                        @click="clearMessages"
                    >
                        <Icon name="i-lucide-trash-2" class="w-4 h-4 mr-2" />
                        Clear All
                    </UButton>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UCard class="shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</p>
                        </div>
                        <div class="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
                            <Icon name="i-lucide-message-circle" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                    </div>
                </UCard>

                <UCard class="shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Today's Messages</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.today }}</p>
                        </div>
                        <div class="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                            <Icon name="i-lucide-calendar" class="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </UCard>

                <UCard class="shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.activeUsers }}</p>
                        </div>
                        <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                            <Icon name="i-lucide-users" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Connection Status -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div :class="[
                        'w-2 h-2 rounded-full',
                        isWebSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    ]"></div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        WebSocket: {{ isWebSocketConnected ? 'Connected' : 'Disconnected' }}
                    </span>
                </div>
                <div class="text-sm text-gray-500">
                    Event ID: <span class="font-mono font-semibold">{{ eventId }}</span>
                </div>
            </div>

            <!-- Search Bar -->
            <UInput 
                v-model="searchQuery" 
                placeholder="Search messages by name or content..."
                icon="i-lucide-search"
                size="lg"
                class="w-full"
            />

            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center py-12">
                <UButton color="primary" variant="outline" loading>
                    Loading messages...
                </UButton>
            </div>

            <!-- Messages List -->
            <div v-else-if="filteredMessages.length > 0" class="space-y-4">
                <div class="text-sm text-gray-500 mb-2">
                    Showing {{ filteredMessages.length }} of {{ messages.length }} messages
                </div>
                
                <div 
                    v-for="message in filteredMessages" 
                    :key="message.id"
                    class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-all duration-200"
                >
                    <div class="flex gap-4">
                        <!-- Avatar / Photo -->
                        <div class="flex-shrink-0">
                            <img 
                                :src="getPhotoUrl(message.photo)" 
                                :alt="message.name"
                                class="w-12 h-12 rounded-full object-cover"
                                @error="(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=User'"
                            />
                        </div>
                        
                        <!-- Message Content -->
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 class="font-semibold text-gray-900 dark:text-white">
                                    {{ message.name }}
                                </h3>
                                <span class="text-xs text-gray-500">
                                    {{ formatDate(message.created_at) }}
                                </span>
                            </div>
                            <p class="text-gray-700 dark:text-gray-300">
                                {{ message.message }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
                <Icon name="i-lucide-message-circle" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Messages Yet
                </h3>
                <p class="text-gray-500 dark:text-gray-400">
                    Messages from guests will appear here
                </p>
                <UButton 
                    color="primary" 
                    variant="outline" 
                    class="mt-4"
                    @click="refreshMessages"
                >
                    <Icon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
                    Refresh
                </UButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>
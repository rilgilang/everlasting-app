<!-- pages/event/[id].vue -->
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

const API_URL = runtimeConfig.public.apiUrl || 'http://localhost:8090/api'

// Fetch event data
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

// Format date
const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD'
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// Format time
const formatTime = (timeString: string) => {
    if (!timeString) return 'Time TBD'
    return timeString
}

// Generate QR code
const generateQRCode = async () => {
    try {
        // Get the current host URL
        const qrValue = `${request.host}/guest/${eventId}`

        const qrDataUrl = await QRCode.toDataURL(qrValue, {
            width: 1000,
            height: 1000,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })
        qrCodeUrl.value = qrDataUrl
    } catch (error) {
        console.error('Error generating QR code:', error)
    }
}

// Copy QR value to clipboard
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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div class="max-w-7xl mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Ucapin</h1>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Ucapkan pesanmu, hadirkan momen.</p>
                        </div>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ new Date().toLocaleDateString('id-ID', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        }) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-12">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center h-64">
                <UButton color="primary" variant="outline" loading>
                    Loading event details...
                </UButton>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-12">
                <Icon name="i-lucide-calendar-x" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Event Not Found</h3>
                <p class="text-gray-500 dark:text-gray-400">The event you're looking for doesn't exist or has been
                    removed.</p>
                <UButton color="primary" variant="outline" class="mt-4" @click="() => navigateTo('/')">
                    Back to Home
                </UButton>
            </div>

            <!-- Event Details -->
            <div v-else-if="event" class="space-y-8">
                <!-- Event Header -->
                <div class="text-center mb-12">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 shadow-lg mb-4">
                        <Icon name="i-lucide-calendar" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                        {{ event.title }}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
                        {{ event.description }}
                    </p>
                </div>

                <!-- Event Info Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <!-- Date Card -->
                    <UCard class="shadow-sm hover:shadow-md transition-all duration-200">
                        <div class="text-center">
                            <div
                                class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Icon name="i-lucide-calendar" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                            <p class="font-semibold text-gray-900 dark:text-white">{{ formatDate(event.date) }}</p>
                        </div>
                    </UCard>

                    <!-- Time Card -->
                    <UCard class="shadow-sm hover:shadow-md transition-all duration-200">
                        <div class="text-center">
                            <div
                                class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Icon name="i-lucide-clock" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Time</p>
                            <p class="font-semibold text-gray-900 dark:text-white">{{ formatTime(event.time) }}</p>
                        </div>
                    </UCard>

                    <!-- Location Card -->
                    <UCard class="shadow-sm hover:shadow-md transition-all duration-200">
                        <div class="text-center">
                            <div
                                class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Icon name="i-lucide-map-pin" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Location</p>
                            <p class="font-semibold text-gray-900 dark:text-white">{{ event.location }}</p>
                        </div>
                    </UCard>

                    <!-- Category Card -->
                    <UCard class="shadow-sm hover:shadow-md transition-all duration-200">
                        <div class="text-center">
                            <div
                                class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Icon name="i-lucide-tag" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Category</p>
                            <p class="font-semibold text-gray-900 dark:text-white">{{ event.category }}</p>
                        </div>
                    </UCard>
                </div>

                <!-- Organizer Info -->
                <UCard class="shadow-sm mb-8">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                <Icon name="i-lucide-users" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Organized by</p>
                                <p class="font-semibold text-gray-900 dark:text-white">{{ event.organizer }}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
                            <p class="font-semibold text-gray-900 dark:text-white">{{ event.messages }} / {{
                                event.max_messages }} messages</p>
                        </div>
                    </div>
                </UCard>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <UButton :to="`/dashboard/${event.id}`" color="primary" variant="solid" size="lg" class="px-8">
                        <Icon name="i-lucide-layout-dashboard" class="w-5 h-5 mr-2" />
                        Go to Dashboard
                    </UButton>

                    <UButton :to="`/wishing-wall/${event.id}`" color="neutral" variant="outline" size="lg" class="px-8">
                        <Icon name="i-lucide-message-circle" class="w-5 h-5 mr-2" />
                        View Wishes Wall
                    </UButton>
                </div>
                <UCard class="shadow-sm hover:shadow-md transition-all duration-200">
                    <div class="text-center">
                        <div
                            class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Icon name="i-lucide-qr-code" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">QR Code</p>
                        <div class="flex justify-center mb-2">
                            <img :src="qrCodeUrl" :alt="`QR Code for ${event.title}`"
                                class="w-24 h-24 cursor-pointer hover:scale-105 transition-transform" v-if="qrCodeUrl"
                                @click="copyQrValue" />
                            <div v-else class="w-24 h-24 flex items-center justify-center">
                                <Icon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary-500" />
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Click QR to copy link</p>
                    </div>
                </UCard>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 py-6 border-t border-gray-200 dark:border-gray-800">
            <div class="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>&copy; {{ new Date().getFullYear() }} Ucapin. All rights reserved.</p>
            </div>
        </div>
    </div>
</template>
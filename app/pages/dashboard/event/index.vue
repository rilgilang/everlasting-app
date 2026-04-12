<!-- pages/event/index.vue -->
<script setup lang="ts">

declare module 'nuxt/app' {
    interface NuxtLayouts {
        'dashboard': unknown
    }
}
// ---cut---
definePageMeta({
    layout: 'dashboard',
})

// Dummy data for events - will be replaced by API later
const events = ref([
    {
        id: 1,
        title: 'Annual Tech Conference 2026',
        description: 'Join us for the biggest tech conference of the year featuring industry leaders, workshops, and networking opportunities.',
        date: '2026-05-15',
        time: '09:00 AM - 06:00 PM',
        location: 'Jakarta Convention Center',
        category: 'Conference',
        messages: 250,
        maxMessages: 500,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
        status: 'upcoming',
        organizer: 'Tech Events Indonesia'
    },
    {
        id: 2,
        title: 'Creative Design Workshop',
        description: 'Hands-on workshop for UI/UX designers. Learn the latest design trends and tools.',
        date: '2026-05-20',
        time: '10:00 AM - 04:00 PM',
        location: 'Creative Hub, Bandung',
        category: 'Workshop',
        messages: 45,
        maxMessages: 100,
        image: 'https://images.unsplash.com/photo-1558403194-611308249627?w=800&h=400&fit=crop',
        status: 'upcoming',
        organizer: 'Design Community'
    },
    {
        id: 3,
        title: 'Startup Networking Night',
        description: 'Connect with founders, investors, and entrepreneurs. Build valuable relationships for your startup journey.',
        date: '2026-05-25',
        time: '07:00 PM - 10:00 PM',
        location: 'Coworking Space, Surabaya',
        category: 'Networking',
        messages: 120,
        maxMessages: 150,
        image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop',
        status: 'upcoming',
        organizer: 'Startup Association'
    },
    {
        id: 4,
        title: 'Data Science Bootcamp',
        description: 'Intensive 3-day bootcamp covering Python, Machine Learning, and Data Visualization.',
        date: '2026-06-01',
        time: '09:00 AM - 05:00 PM',
        location: 'Online (Zoom)',
        category: 'Bootcamp',
        messages: 180,
        maxMessages: 200,
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
        status: 'upcoming',
        organizer: 'Data Science Academy'
    },
    {
        id: 5,
        title: 'Music Festival 2026',
        description: 'Experience live performances from top artists. Food trucks, art installations, and more!',
        date: '2026-06-10',
        time: '02:00 PM - 11:00 PM',
        location: 'Lapangan Banteng, Jakarta',
        category: 'Festival',
        messages: 3200,
        maxMessages: 5000,
        image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop',
        status: 'upcoming',
        organizer: 'Music Events Co.'
    },
    {
        id: 6,
        title: 'Digital Marketing Seminar',
        description: 'Learn SEO, Social Media Marketing, and Content Strategy from industry experts.',
        date: '2026-04-10',
        time: '09:00 AM - 05:00 PM',
        location: 'Hotel Grand Asia, Jakarta',
        category: 'Seminar',
        messages: 210,
        maxMessages: 300,
        image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=400&fit=crop',
        status: 'ongoing',
        organizer: 'Digital Marketing Institute'
    },
    {
        id: 7,
        title: 'Community Clean Up Day',
        description: 'Help us keep our city clean! Join our community service event.',
        date: '2026-03-25',
        time: '07:00 AM - 12:00 PM',
        location: 'Various Locations',
        category: 'Community',
        messages: 150,
        maxMessages: 200,
        image: 'https://images.unsplash.com/photo-1557425529-b1ae9c141e7d?w=800&h=400&fit=crop',
        status: 'past',
        organizer: 'Green Community'
    }
])

// Filter and search functionality
const searchQuery = ref('')
const selectedCategory = ref('all') // Changed from '' to 'all'
const selectedStatus = ref('all') // Changed from '' to 'all'

// Define select items with proper value props (not empty strings)
const categoryItems = [
    { label: 'All Categories', value: 'all' },
    ...Array.from(new Set(events.value.map(event => event.category))).map(category => ({
        label: category,
        value: category
    }))
]

const statusItems = [
    { label: 'All Status', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Past', value: 'past' }
]

const filteredEvents = computed(() => {
    let filtered = events.value

    if (searchQuery.value) {
        filtered = filtered.filter(event =>
            event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    }

    if (selectedCategory.value && selectedCategory.value !== 'all') {
        filtered = filtered.filter(event => event.category === selectedCategory.value)
    }

    if (selectedStatus.value && selectedStatus.value !== 'all') {
        filtered = filtered.filter(event => event.status === selectedStatus.value)
    }

    return filtered
})

const getStatusColor = (status: string) => {
    switch (status) {
        case 'upcoming': return 'success'
        case 'ongoing': return 'info'
        case 'past': return 'neutral'
        default: return 'neutral'
    }
}

const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
}

// Clear all filters
const clearFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = 'all'
    selectedStatus.value = 'all'
}
</script>

<template>
    <div class="min-h-screen p-6">
        <div class="space-y-6">
            <!-- Page Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-semibold tracking-tight">Events</h1>
                    <p class="text-sm text-dimmed mt-1">Discover and join exciting events happening around you</p>
                </div>
                <UButton color="primary" variant="solid" class="flex items-center gap-2">
                    <Icon name="i-lucide-plus" class="w-4 h-4" />
                    Create Event
                </UButton>
            </div>

            <!-- Filters Section -->
            <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1">
                    <UInput v-model="searchQuery" placeholder="Search events..." icon="i-lucide-search" size="lg" />
                </div>
                <div class="flex gap-3">
                    <USelect v-model="selectedCategory" :items="categoryItems" placeholder="Select category" size="lg"
                        class="w-48" />
                    <USelect v-model="selectedStatus" :items="statusItems" placeholder="Select status" size="lg"
                        class="w-48" />
                    <UButton v-if="searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'"
                        @click="clearFilters" color="neutral" variant="ghost" size="lg">
                        Clear
                    </UButton>
                </div>
            </div>

            <!-- Results Count -->
            <div class="text-sm text-dimmed">
                Showing {{ filteredEvents.length }} of {{ events.length }} events
            </div>

            <!-- Events Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <UCard v-for="event in filteredEvents" :key="event.id"
                    class="hover:shadow-md transition-all duration-200">
                    <!-- Card Header with Image -->
                    <template #header>
                        <div class="relative -m-6 mb-0 rounded-t-lg overflow-hidden">
                            <img :src="event.image" :alt="event.title" class="w-full h-48 object-cover"
                                @error="(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Event+Image'" />
                            <div class="absolute top-4 right-4">
                                <UBadge :color="getStatusColor(event.status)" variant="solid">
                                    {{ event.status.charAt(0).toUpperCase() + event.status.slice(1) }}
                                </UBadge>
                            </div>
                            <div class="absolute bottom-4 left-4">
                                <UBadge color="neutral" variant="subtle">
                                    {{ event.category }}
                                </UBadge>
                            </div>
                        </div>
                    </template>

                    <!-- Card Content -->
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-lg font-semibold mb-2 line-clamp-2">
                                {{ event.title }}
                            </h3>
                            <p class="text-sm text-dimmed line-clamp-2">
                                {{ event.description }}
                            </p>
                        </div>

                        <div class="space-y-2">
                            <!-- Date and Time -->
                            <div class="flex items-center gap-2 text-sm">
                                <Icon name="i-lucide-calendar" class="w-4 h-4 text-dimmed" />
                                <span class="text-foreground">{{ formatDate(event.date) }}</span>
                                <span class="text-dimmed">•</span>
                                <span class="text-dimmed">{{ event.time }}</span>
                            </div>

                            <!-- Location -->
                            <div class="flex items-center gap-2 text-sm">
                                <Icon name="i-lucide-map-pin" class="w-4 h-4 text-dimmed" />
                                <span class="text-dimmed line-clamp-1">{{ event.location }}</span>
                            </div>

                            <!-- Message Progress -->
                            <div class="space-y-1.5 pt-1">
                                <div class="flex justify-between text-xs">
                                    <span class="text-dimmed">Messages</span>
                                    <span class="text-foreground font-medium">{{ event.messages }} / {{
                                        event.maxMessages
                                        }}</span>
                                </div>
                                <UProgress :value="(event.messages / event.maxMessages) * 100" size="sm" color="primary"
                                    class="w-full" />
                            </div>
                        </div>
                    </div>

                    <!-- Card Footer -->
                    <template #footer>
                        <div class="flex justify-between items-center">
                            <div class="text-xs text-dimmed">
                                By {{ event.organizer }}
                            </div>
                            <UButton :color="event.status === 'past' ? 'neutral' : 'primary'"
                                :variant="event.status === 'past' ? 'outline' : 'solid'"
                                :disabled="event.status === 'past'" size="sm">
                                <template v-if="event.status === 'past'">
                                    Event Ended
                                </template>
                                <template v-else>
                                    Update
                                </template>
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </div>

            <!-- Empty State -->
            <div v-if="filteredEvents.length === 0" class="text-center py-12">
                <Icon name="i-lucide-calendar-x" class="w-16 h-16 mx-auto text-dimmed mb-4" />
                <h3 class="text-lg font-semibold mb-2">No events found</h3>
                <p class="text-sm text-dimmed">Try adjusting your search or filter criteria</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
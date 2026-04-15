<!-- pages/event/edit/[id].vue -->
<script setup lang="ts">
declare module 'nuxt/app' {
    interface NuxtLayouts {
        'dashboard': unknown
    }
}

definePageMeta({
    layout: 'dashboard',
})

import { z } from 'zod'

// Get event ID from route params
const route = useRoute()
const eventId = route.params.id

// Form schema validation (same as create)
const formSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be less than 500 characters'),
    date: z.string().min(1, 'Date is required'),
    time: z.object({
        start: z.string().min(1, 'Start time is required'),
        end: z.string().min(1, 'End time is required')
    }),
    location: z.string().min(3, 'Location must be at least 3 characters'),
    category: z.string().min(1, 'Category is required'),
    maxMessages: z.number().min(1, 'Maximum messages must be at least 1').max(10000, 'Maximum messages must be less than 10000'),
    image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    organizer: z.string().min(2, 'Organizer name must be at least 2 characters'),
    status: z.string().min(1, 'Status is required')
})

type FormData = z.infer<typeof formSchema>

// Dummy event data - will be replaced by API call
const fetchEventData = async (id: string | string[]) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Dummy data based on ID (in real app, this would be an API call)
    const dummyEvents: Record<string, any> = {
        '1': {
            title: 'Annual Tech Conference 2026',
            description: 'Join us for the biggest tech conference of the year featuring industry leaders, workshops, and networking opportunities.',
            date: '2026-05-15',
            time: { start: '09:00', end: '18:00' },
            location: 'Jakarta Convention Center',
            category: 'Conference',
            maxMessages: 500,
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
            organizer: 'Tech Events Indonesia',
            status: 'upcoming'
        },
        '2': {
            title: 'Creative Design Workshop',
            description: 'Hands-on workshop for UI/UX designers. Learn the latest design trends and tools.',
            date: '2026-05-20',
            time: { start: '10:00', end: '16:00' },
            location: 'Creative Hub, Bandung',
            category: 'Workshop',
            maxMessages: 100,
            image: 'https://images.unsplash.com/photo-1558403194-611308249627?w=800&h=400&fit=crop',
            organizer: 'Design Community',
            status: 'upcoming'
        }
    }

    return dummyEvents[id as string] || null
}

// Form state
const formData = ref<FormData>({
    title: '',
    description: '',
    date: '',
    time: {
        start: '09:00',
        end: '17:00'
    },
    location: '',
    category: '',
    maxMessages: 100,
    image: '',
    organizer: '',
    status: 'upcoming'
})

// Loading states
const isLoading = ref(true)
const isSubmitting = ref(false)
const isNotFound = ref(false)

// Categories options
const categoryOptions = [
    { label: 'Conference', value: 'Conference' },
    { label: 'Workshop', value: 'Workshop' },
    { label: 'Seminar', value: 'Seminar' },
    { label: 'Networking', value: 'Networking' },
    { label: 'Festival', value: 'Festival' },
    { label: 'Bootcamp', value: 'Bootcamp' },
    { label: 'Community', value: 'Community' },
    { label: 'Other', value: 'Other' }
]

// Status options
const statusOptions = [
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Past', value: 'past' }
]

// Preview image URL
const previewImage = computed(() => {
    return formData.value.image || 'https://placehold.co/800x400?text=Preview+Image'
})

const toast = useToast()

// Load event data on mount
onMounted(async () => {
    try {
        const event = await fetchEventData(eventId)

        if (!event) {
            isNotFound.value = true
            return
        }

        // Populate form with event data
        formData.value = {
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            category: event.category,
            maxMessages: event.maxMessages,
            image: event.image || '',
            organizer: event.organizer,
            status: event.status
        }

        isLoading.value = false
    } catch (error) {
        console.error('Error loading event:', error)
        toast.add({
            title: 'Error',
            description: 'Failed to load event data',
            color: 'error',
            icon: 'i-lucide-alert-circle'
        })
        isLoading.value = false
    }
})

// Handle form submission (update)
const onSubmit = async (data: FormData) => {
    isSubmitting.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Format time string
    const timeString = `${data.time.start} - ${data.time.end}`

    const updatedEvent = {
        id: eventId,
        title: data.title,
        description: data.description,
        date: data.date,
        time: timeString,
        location: data.location,
        category: data.category,
        messages: 100, // This would come from the original event
        maxMessages: data.maxMessages,
        image: data.image || 'https://placehold.co/800x400?text=Event+Image',
        status: data.status,
        organizer: data.organizer
    }

    console.log('Updated Event:', updatedEvent)

    // Show success message
    toast.add({
        title: 'Success',
        description: 'Event updated successfully!',
        color: 'success',
        icon: 'i-lucide-check-circle'
    })

    isSubmitting.value = false

    // Navigate back to events page after 1 second
    setTimeout(() => {
        navigateTo('/event')
    }, 1000)
}

// Cancel and go back
const onCancel = () => {
    navigateTo('/event')
}

// Delete event
// const onDelete = async () => {
//     const confirmed = await toast.promise(
//         new Promise((resolve) => {
//             // Use confirm dialog
//             if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
//                 resolve(true)
//             } else {
//                 resolve(false)
//             }
//         }),
//         {
//             loading: 'Deleting event...',
//             success: 'Event deleted successfully!',
//             error: 'Failed to delete event'
//         }
//     )

//     if (confirmed) {
//         // Simulate API call
//         await new Promise(resolve => setTimeout(resolve, 1000))

//         // Navigate back to events page
//         navigateTo('/event')
//     }
// }
</script>

<template>
    <div class="min-h-screen p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center h-64">
            <UButton color="primary" variant="outline" loading>
                Loading event data...
            </UButton>
        </div>

        <!-- Not Found State -->
        <div v-else-if="isNotFound" class="text-center py-12">
            <Icon name="i-lucide-calendar-x" class="w-16 h-16 mx-auto text-dimmed mb-4" />
            <h3 class="text-lg font-semibold mb-2">Event Not Found</h3>
            <p class="text-sm text-dimmed mb-4">The event you're trying to edit doesn't exist.</p>
            <UButton color="primary" @click="navigateTo('/event')">
                Back to Events
            </UButton>
        </div>

        <!-- Edit Form -->
        <div v-else class="space-y-6">
            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-semibold tracking-tight">Edit Event</h1>
                        <p class="text-sm text-dimmed mt-1">Update the event details</p>
                    </div>
                </div>
                <!-- <UButton color="error" variant="outline" icon="i-lucide-trash-2" @click="onDelete">
                    Delete Event
                </UButton> -->
            </div>

            <!-- Form -->
            <UForm :schema="formSchema" :state="formData" class="space-y-6" @submit="onSubmit">
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <Icon name="i-lucide-info" class="w-5 h-5 text-primary" />
                            <h2 class="text-lg font-semibold">Basic Information</h2>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <!-- Title -->
                        <UFormField label="Event Title" name="title" required>
                            <UInput v-model="formData.title" placeholder="Enter event title" size="lg" class="w-full" />
                        </UFormField>

                        <!-- Description -->
                        <UFormField label="Description" name="description" required>
                            <UTextarea v-model="formData.description" placeholder="Describe your event..." :rows="4"
                                size="lg" class="w-full" />
                            <template #hint>
                                <span class="text-xs text-dimmed">
                                    {{ formData.description.length }}/500 characters
                                </span>
                            </template>
                        </UFormField>

                        <!-- Category and Status Row -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UFormField label="Category" name="category" required>
                                <USelect v-model="formData.category" :items="categoryOptions"
                                    placeholder="Select category" size="lg" />
                            </UFormField>

                            <UFormField label="Status" name="status" required>
                                <USelect v-model="formData.status" :items="statusOptions" placeholder="Select status"
                                    size="lg" />
                            </UFormField>
                        </div>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <Icon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
                            <h2 class="text-lg font-semibold">Date & Time</h2>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <!-- Date -->
                        <UFormField label="Event Date" name="date" required>
                            <UInput v-model="formData.date" type="date" size="lg" class="w-full" />
                        </UFormField>

                        <!-- Time Range -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UFormField label="Start Time" name="time.start" required>
                                <UInput v-model="formData.time.start" type="time" size="lg" class="w-full" />
                            </UFormField>

                            <UFormField label="End Time" name="time.end" required>
                                <UInput v-model="formData.time.end" type="time" size="lg" class="w-full" />
                            </UFormField>
                        </div>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <Icon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
                            <h2 class="text-lg font-semibold">Location & Organization</h2>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <!-- Location -->
                        <UFormField label="Location" name="location" required>
                            <UInput v-model="formData.location" placeholder="Enter event location" size="lg"
                                class="w-full" />
                        </UFormField>

                        <!-- Organizer -->
                        <UFormField label="Organizer" name="organizer" required>
                            <UInput v-model="formData.organizer" placeholder="Enter organizer name" size="lg"
                                class="w-full" />
                        </UFormField>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <Icon name="i-lucide-users" class="w-5 h-5 text-primary" />
                            <h2 class="text-lg font-semibold">Capacity & Media</h2>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <!-- Max Messages -->
                        <UFormField label="Maximum Messages" name="maxMessages" required>
                            <UInput v-model="formData.maxMessages" type="number"
                                placeholder="Maximum number of messages" size="lg" class="w-full" />
                            <template #hint>
                                <span class="text-xs text-dimmed">Maximum number of messages for this
                                    event</span>
                            </template>
                        </UFormField>

                        <!-- Image URL -->
                        <UFormField label="Event Image URL" name="image">
                            <UInput v-model="formData.image" placeholder="Enter image URL (optional)" size="lg"
                                class="w-full" />
                            <template #hint>
                                <span class="text-xs text-dimmed">Leave empty to use default image</span>
                            </template>
                        </UFormField>

                        <!-- Image Preview -->
                        <div v-if="formData.image" class="mt-2">
                            <p class="text-sm font-medium mb-2">Preview:</p>
                            <div class="relative rounded-lg overflow-hidden border border-default">
                                <img :src="previewImage" alt="Preview" class="w-full h-48 object-cover"
                                    @error="(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Invalid+Image+URL'" />
                            </div>
                        </div>
                    </div>
                </UCard>

                <!-- Form Actions -->
                <div class="flex justify-end gap-3">
                    <UButton color="neutral" variant="outline" size="lg" @click="onCancel">
                        Cancel
                    </UButton>
                    <UButton type="submit" color="primary" size="lg" :loading="isSubmitting">
                        Update Event
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>
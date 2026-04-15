<!-- pages/event/create.vue -->
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


import { z } from 'zod'

// Form schema validation
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

// Submit state
const isSubmitting = ref(false)
const toast = useToast()

// Handle form submission
const onSubmit = async (data: FormData) => {
    isSubmitting.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Format time string
    const timeString = `${data.time.start} - ${data.time.end}`

    const newEvent = {
        id: Date.now(), // Temporary ID
        title: data.title,
        description: data.description,
        date: data.date,
        time: timeString,
        location: data.location,
        category: data.category,
        messages: 0,
        maxMessages: data.maxMessages,
        image: data.image || 'https://placehold.co/800x400?text=Event+Image',
        status: data.status,
        organizer: data.organizer
    }

    console.log('New Event:', newEvent)

    // Show success message
    toast.add({
        title: 'Success',
        description: 'Event created successfully!',
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
</script>

<template>
    <div class="min-h-screen p-6 space-y-6">
        <div class="space-y-6">
            <!-- Page Header -->
            <div class="flex items-center gap-4">
                <!-- <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left"
                    @click="navigateTo('/dashboard/event')" /> -->
                <div>
                    <h1 class="text-2xl font-semibold tracking-tight">Create New Event</h1>
                    <p class="text-sm text-dimmed mt-1">Fill in the details to create a new event</p>
                </div>
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
                        Create Event
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>
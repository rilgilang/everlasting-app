<!-- components/user/UserForm.vue -->
<script setup lang="ts">
import { z } from 'zod'
import type { User, Event } from '~/types/user'

const props = defineProps<{
    mode: 'create' | 'edit'
    initialData?: Partial<User>
    events: Event[]
}>()

const emit = defineEmits<{
    submit: [data: any]
    cancel: []
}>()

// Form schema validation
const userFormSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['admin', 'user', 'user-assistant'], {
        errorMap: () => ({ message: 'Please select a valid role' })
    }),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    status: z.enum(['active', 'inactive']),
    assignedEvents: z.array(z.number()).default([])
})

type UserFormData = z.infer<typeof userFormSchema>

// Form data
const formData = ref<UserFormData>({
    name: '',
    email: '',
    role: 'user',
    password: '',
    status: 'active',
    assignedEvents: []
})

// Role options
const roleOptions = [
    { label: 'Admin', value: 'admin', color: 'primary', description: 'Full access to all features' },
    { label: 'User', value: 'user', color: 'info', description: 'Can manage assigned events' },
    { label: 'User Assistant', value: 'user-assistant', color: 'warning', description: 'View and moderate messages only' }
]

const statusOptions = [
    { label: 'Active', value: 'active', color: 'success' },
    { label: 'Inactive', value: 'inactive', color: 'neutral' }
]

// Initialize form data for edit mode
onMounted(() => {
    if (props.mode === 'edit' && props.initialData) {
        formData.value = {
            name: props.initialData.name || '',
            email: props.initialData.email || '',
            role: props.initialData.role || 'user',
            password: '', // Don't populate password for edit
            status: props.initialData.status || 'active',
            assignedEvents: props.initialData.assignedEvents || []
        }
    }
})

// Submit form
const onSubmit = () => {
    emit('submit', formData.value)
}
</script>

<template>
    <UForm :schema="userFormSchema" :state="formData" class="space-y-4" @submit="onSubmit">
        <UFormField label="Full Name" name="name" required>
            <UInput v-model="formData.name" placeholder="Enter full name" size="lg" />
        </UFormField>

        <UFormField label="Email" name="email" required>
            <UInput v-model="formData.email" type="email" placeholder="user@example.com" size="lg" />
        </UFormField>

        <UFormField label="Role" name="role" required>
            <div class="grid grid-cols-1 gap-3">
                <div v-for="role in roleOptions" :key="role.value" @click="formData.role = role.value as any" :class="[
                    'p-3 rounded-lg border-2 cursor-pointer transition-all',
                    formData.role === role.value
                        ? `border-${role.color} bg-${role.color}/5`
                        : 'border-default hover:border-primary/50'
                ]">
                    <div class="flex items-center gap-3">
                        <div :class="[
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            formData.role === role.value ? `bg-${role.color}/10` : 'bg-gray-100 dark:bg-gray-800'
                        ]">
                            <Icon :name="formData.role === role.value ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                                :class="formData.role === role.value ? `text-${role.color}` : 'text-dimmed'"
                                class="w-5 h-5" />
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <h3 class="font-semibold">{{ role.label }}</h3>
                            </div>
                            <p class="text-xs text-dimmed">{{ role.description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </UFormField>

        <UFormField label="Password" name="password" :required="mode === 'create'">
            <UInput v-model="formData.password" type="password"
                :placeholder="mode === 'create' ? 'Enter password' : 'Leave blank to keep current'" size="lg" />
            <template v-if="mode === 'edit'" #hint>
                <span class="text-xs text-dimmed">Leave blank to keep current password</span>
            </template>
        </UFormField>

        <UFormField label="Status" name="status" required>
            <div class="flex gap-3">
                <UButton v-for="status in statusOptions" :key="status.value"
                    :color="formData.status === status.value ? status.color : 'neutral'"
                    :variant="formData.status === status.value ? 'solid' : 'outline'"
                    @click="formData.status = status.value as any">
                    {{ status.label }}
                </UButton>
            </div>
        </UFormField>

        <UFormField label="Assigned Events" name="assignedEvents">
            <div class="space-y-2">
                <div v-for="event in events" :key="event.id" @click="
                        const index = formData.assignedEvents.indexOf(event.id)
                    if (index > -1) {
                        formData.assignedEvents.splice(index, 1)
                    } else {
                        formData.assignedEvents.push(event.id)
                    }
                    " :class="[
                        'p-3 rounded-lg border-2 cursor-pointer transition-all',
                        formData.assignedEvents.includes(event.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-default hover:border-primary/50'
                    ]">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-semibold">{{ event.title }}</h4>
                            <p class="text-xs text-dimmed">{{ event.location }} • {{ new
                                Date(event.date).toLocaleDateString('id-ID') }}</p>
                        </div>
                        <Icon
                            :name="formData.assignedEvents.includes(event.id) ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                            :class="formData.assignedEvents.includes(event.id) ? 'text-primary' : 'text-dimmed'"
                            class="w-5 h-5" />
                    </div>
                </div>
            </div>
            <template #hint>
                <span class="text-xs text-dimmed">Select events that this user can access</span>
            </template>
        </UFormField>

        <template #footer>
            <div class="flex justify-end gap-3 pt-4">
                <UButton color="neutral" variant="outline" size="lg" @click="emit('cancel')">
                    Cancel
                </UButton>
                <UButton type="submit" color="primary" size="lg">
                    {{ mode === 'create' ? 'Create User' : 'Update User' }}
                </UButton>
            </div>
        </template>
    </UForm>
</template>
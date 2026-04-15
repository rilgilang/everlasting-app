<!-- components/user/UserList.vue -->
<script setup lang="ts">
import type { User } from '~/types/user'

const props = defineProps<{
    users: User[]
    loading?: boolean
}>()

const emit = defineEmits<{
    edit: [user: User]
    delete: [user: User]
}>()

const getRoleColor = (role: string) => {
    switch (role) {
        case 'admin': return 'primary'
        case 'user': return 'info'
        case 'user-assistant': return 'warning'
        default: return 'neutral'
    }
}

const getRoleLabel = (role: string) => {
    switch (role) {
        case 'admin': return 'Admin'
        case 'user': return 'User'
        case 'user-assistant': return 'User Assistant'
        default: return role
    }
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>

<template>
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="border-b border-default">
                <tr class="text-left">
                    <th class="pb-3 text-sm font-semibold">User</th>
                    <th class="pb-3 text-sm font-semibold">Email</th>
                    <th class="pb-3 text-sm font-semibold">Role</th>
                    <th class="pb-3 text-sm font-semibold">Status</th>
                    <th class="pb-3 text-sm font-semibold">Assigned Events</th>
                    <th class="pb-3 text-sm font-semibold">Created At</th>
                    <th class="pb-3 text-sm font-semibold">Last Login</th>
                    <th class="pb-3 text-sm font-semibold text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in users" :key="user.id"
                    class="border-b border-default hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td class="py-3">
                        <div class="flex items-center gap-3">
                            <img :src="user.avatar || `https://i.pravatar.cc/150?img=${user.id}`" :alt="user.name"
                                class="w-8 h-8 rounded-full" />
                            <span class="font-medium">{{ user.name }}</span>
                        </div>
                    </td>
                    <td class="py-3 text-sm">{{ user.email }}</td>
                    <td class="py-3">
                        <UBadge :color="getRoleColor(user.role)" variant="subtle">
                            {{ getRoleLabel(user.role) }}
                        </UBadge>
                    </td>
                    <td class="py-3">
                        <UBadge :color="user.status === 'active' ? 'success' : 'neutral'" variant="solid">
                            {{ user.status === 'active' ? 'Active' : 'Inactive' }}
                        </UBadge>
                    </td>
                    <td class="py-3">
                        <div class="flex gap-1">
                            <UBadge v-for="eventId in user.assignedEvents.slice(0, 2)" :key="eventId" color="neutral"
                                variant="subtle" size="sm">
                                Event {{ eventId }}
                            </UBadge>
                            <span v-if="user.assignedEvents.length > 2" class="text-xs text-dimmed">
                                +{{ user.assignedEvents.length - 2 }} more
                            </span>
                            <span v-if="user.assignedEvents.length === 0" class="text-xs text-dimmed">
                                No events assigned
                            </span>
                        </div>
                    </td>
                    <td class="py-3 text-sm">{{ formatDate(user.createdAt) }}</td>
                    <td class="py-3 text-sm">
                        {{ user.lastLogin ? formatDate(user.lastLogin) : 'Never' }}
                    </td>
                    <td class="py-3 text-right">
                        <div class="flex justify-end gap-2">
                            <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-edit-2"
                                @click="emit('edit', user)" />
                            <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2"
                                @click="emit('delete', user)" />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <div v-if="users.length === 0 && !loading" class="text-center py-12">
            <Icon name="i-lucide-users" class="w-16 h-16 mx-auto text-dimmed mb-4" />
            <h3 class="text-lg font-semibold mb-2">No users found</h3>
            <p class="text-sm text-dimmed">Try adjusting your search or filter criteria</p>
        </div>
    </div>
</template>
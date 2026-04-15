<!-- pages/login.vue -->
<script setup lang="ts">
definePageMeta({
    layout: false, // Full page without dashboard layout
})

import { z } from 'zod'

// Form schema validation
const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
})

type FormData = z.infer<typeof formSchema>

// Form state
const formData = ref<FormData>({
    email: '',
    password: ''
})

const isLoading = ref(false)
const showPassword = ref(false)
const toast = useToast()
const router = useRouter()

// Handle login
const handleLogin = async (data: FormData) => {
    isLoading.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Demo authentication - in real app, this would be an API call
    // Backend will determine the role based on credentials
    const demoUsers = [
        { email: 'admin@ucapin.com', password: 'admin123', role: 'admin' },
        { email: 'user@ucapin.com', password: 'user123', role: 'user' },
        { email: 'assistant@ucapin.com', password: 'assistant123', role: 'user-assistant' }
    ]

    const user = demoUsers.find(u => u.email === data.email && u.password === data.password)

    if (user) {
        // Store user data in localStorage/session
        const userData = {
            email: user.email,
            role: user.role,
            loggedInAt: new Date().toISOString()
        }

        localStorage.setItem('user', JSON.stringify(userData))

        toast.add({
            title: 'Welcome!',
            description: `Logged in as ${user.role}`,
            color: 'success',
            icon: 'i-lucide-check-circle'
        })

        // Redirect based on role from backend
        switch (user.role) {
            case 'admin':
                router.push('/dashboard')
                break
            case 'user':
                router.push('/event')
                break
            case 'user-assistant':
                router.push('/wishes-wall')
                break
            default:
                router.push('/')
        }
    } else {
        toast.add({
            title: 'Login Failed',
            description: 'Invalid email or password',
            color: 'error',
            icon: 'i-lucide-alert-circle'
        })
    }

    isLoading.value = false
}
</script>

<template>
    <div class="min-h-screen">
        <div class="container mx-auto px-4 py-12">
            <div class="max-w-6xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-12">
                    <div
                        class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-lg mb-6">
                        <Icon name="i-lucide-message-square" class="w-10 h-10 text-white" />
                    </div>
                    <h1 class="text-4xl font-bold text-white mb-2">Ucapin</h1>
                    <p class="text-emerald-100">Platform dinding ucapan real-time</p>
                </div>

                <!-- Login Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Login Form -->
                    <div>
                        <UCard class="backdrop-blur-lg bg-white/95">
                            <template #header>
                                <div class="text-center">
                                    <h2 class="text-2xl font-semibold">Welcome Back</h2>
                                    <p class="text-sm text-dimmed mt-1">Login to access your dashboard</p>
                                </div>
                            </template>

                            <UForm :schema="formSchema" :state="formData" class="space-y-5" @submit="handleLogin">
                                <!-- Email -->
                                <UFormField label="Email" name="email" required>
                                    <UInput v-model="formData.email" type="email" placeholder="your@email.com" size="lg"
                                        icon="i-lucide-mail" class="w-full" />
                                </UFormField>

                                <!-- Password -->
                                <UFormField label="Password" name="password" required>
                                    <UInput v-model="formData.password" :type="showPassword ? 'text' : 'password'"
                                        placeholder="Enter your password" size="lg"
                                        :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-full"
                                        @click-icon="showPassword = !showPassword" />
                                </UFormField>

                                <!-- Remember Me & Forgot Password -->
                                <div class="flex justify-between items-center">
                                    <UCheckbox label="Remember me" />
                                    <UButton color="neutral" variant="link" size="sm">
                                        Forgot Password?
                                    </UButton>
                                </div>

                                <!-- Submit Button -->
                                <UButton type="submit" color="primary" size="lg" class="w-full" :loading="isLoading">
                                    <Icon name="i-lucide-log-in" class="w-5 h-5 mr-2" />
                                    Login
                                </UButton>
                            </UForm>

                            <template #footer>
                                <div class="text-center text-sm text-dimmed">
                                    Don't have an account?
                                    <UButton color="primary" variant="link" size="sm">
                                        Contact Administrator
                                    </UButton>
                                </div>
                            </template>
                        </UCard>
                    </div>

                    <!-- Info Panel with Image -->
                    <div>
                        <UCard class="backdrop-blur-lg bg-white/95 h-full overflow-hidden">
                            <div class="relative h-full flex flex-col">
                                <!-- Decorative Image -->
                                <div class="relative h-48 rounded-lg overflow-hidden mb-6">
                                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
                                        alt="Team collaboration" class="w-full h-full object-cover" />
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                    <div class="absolute bottom-4 left-4 text-white">
                                        <p class="text-sm font-semibold">Real-time Messages</p>
                                        <p class="text-xs opacity-90">Connect instantly</p>
                                    </div>
                                </div>

                                <!-- Features List -->
                                <div class="space-y-4 flex-1">
                                    <div class="text-center">
                                        <Icon name="i-lucide-sparkles" class="w-12 h-12 text-primary mx-auto mb-3" />
                                        <h3 class="text-xl font-semibold mb-2">Welcome to Ucapin</h3>
                                        <p class="text-sm text-dimmed">Share messages, celebrate moments, connect with
                                            others</p>
                                    </div>

                                    <div class="space-y-3">
                                        <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <div
                                                class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Icon name="i-lucide-message-circle" class="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-sm">Live Messages Wall</h4>
                                                <p class="text-xs text-dimmed">Real-time updates with WebSocket
                                                    connections</p>
                                            </div>
                                        </div>

                                        <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <div
                                                class="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                                                <Icon name="i-lucide-qr-code" class="w-4 h-4 text-info" />
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-sm">QR Code Integration</h4>
                                                <p class="text-xs text-dimmed">Easy event access with unique QR codes
                                                </p>
                                            </div>
                                        </div>

                                        <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <div
                                                class="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                                                <Icon name="i-lucide-image" class="w-4 h-4 text-warning" />
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-sm">Photo Messages</h4>
                                                <p class="text-xs text-dimmed">Share selfies and images with your wishes
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Demo Credentials Hint -->
                                <div class="mt-6 pt-4 border-t border-default">
                                    <div class="text-center">
                                        <p class="text-xs text-dimmed mb-2">Demo Credentials</p>
                                        <div class="space-y-1 text-xs">
                                            <p><span class="font-semibold">Admin:</span> admin@ucapin.com / admin123</p>
                                            <p><span class="font-semibold">User:</span> user@ucapin.com / user123</p>
                                            <p><span class="font-semibold">Assistant:</span> assistant@ucapin.com /
                                                assistant123</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </UCard>
                    </div>
                </div>

                <!-- Footer -->
                <div class="text-center mt-8">
                    <p class="text-sm text-white/80">
                        &copy; {{ new Date().getFullYear() }} Ucapin. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
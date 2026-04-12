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
</script>


<template>
    <div class="min-h-screen">
        <div class="p-6">
            <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p class="text-gray-600">Selamat datang di dashboard Anda!</p>
        </div>
    </div>

</template>
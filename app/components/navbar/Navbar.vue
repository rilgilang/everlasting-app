<!-- components/Navbar.vue -->
<script setup>
const props = defineProps({
  showDate: {
    type: Boolean,
    default: true
  },
  appName: {
    type: String,
    default: 'Ucapin'
  },
  appTagline: {
    type: String,
    default: 'Ucapkan pesanmu, hadirkan momen.'
  }
})

// Format date to Indonesian locale
const formattedDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>

<template>
  <div class="bg-white border-b border-gray-100 shadow-sm">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo and App Info -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-800">{{ appName }}</h1>
            <p class="text-xs text-gray-500">{{ appTagline }}</p>
          </div>
        </div>

        <!-- Date Display -->
        <div v-if="showDate" class="text-sm text-gray-500">
          {{ formattedDate }}
        </div>
      </div>
    </div>
  </div>
</template>
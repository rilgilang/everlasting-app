<script setup lang="ts">
const open = ref(true)

const route = useRoute()
const eventId = route.params.id as string

const items = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: `/dashboard/${eventId}` },
  { label: 'Wishing Wall', icon: 'i-lucide-message-circle', to: `/wishing-wall/${eventId}` },
  { label: 'Guest Form', icon: 'i-lucide-user-plus', to: `/guest/${eventId}` }
]
</script>

<template>
  <div class="flex h-screen bg-stone-50">
    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col border-r border-stone-200 bg-white transition-all duration-300',
        open ? 'w-56' : 'w-16'
      ]"
    >
      <!-- Brand -->
      <div class="flex items-center gap-3 px-4 h-14 border-b border-stone-100 shrink-0">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center shrink-0">
          <svg
            class="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <span
          v-show="open"
          class="font-bold text-stone-800 text-sm whitespace-nowrap"
        >Ucapin</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-2 space-y-1">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            route.path === item.to
              ? 'bg-gradient-to-r from-rose-50 to-amber-50 text-rose-700 border border-rose-200'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
          ]"
        >
          <Icon
            :name="item.icon"
            class="w-5 h-5 shrink-0"
          />
          <span v-show="open">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Collapse button -->
      <div class="p-2 border-t border-stone-100">
        <button
          class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-all"
          @click="open = !open"
        >
          <Icon
            name="i-lucide-panel-left-close"
            class="w-5 h-5 shrink-0"
            :class="{ 'rotate-180': !open }"
          />
          <span v-show="open">Collapse</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <div class="h-14 shrink-0 flex items-center px-6 border-b border-stone-200 bg-white">
        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-all"
          @click="open = !open"
        >
          <Icon
            name="i-lucide-panel-left"
            class="w-5 h-5"
          />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

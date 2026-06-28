<script setup>
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 animate-gradient relative overflow-hidden">
    <!-- Floating decorative elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl animate-float" />
      <div
        class="absolute top-40 right-20 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl animate-float"
        style="animation-delay: -2s"
      />
      <div
        class="absolute bottom-40 left-1/4 w-40 h-40 bg-rose-300/20 rounded-full blur-3xl animate-float"
        style="animation-delay: -4s"
      />
      <div
        class="absolute bottom-20 right-1/3 w-36 h-36 bg-amber-300/20 rounded-full blur-3xl animate-float"
        style="animation-delay: -1s"
      />
    </div>

    <!-- Header -->
    <div class="relative z-10 bg-white/60 backdrop-blur-xl border-b border-rose-100/50 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
              <svg
                class="w-5 h-5 text-white"
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
            <div>
              <h1 class="text-xl font-serif font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Ucapin
              </h1>
              <p class="text-xs text-stone-500">
                Ucapkan pesanmu, hadirkan momen.
              </p>
            </div>
          </div>
          <div class="text-sm text-stone-500 font-medium">
            {{ new Date().toLocaleDateString('id-ID', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-6 py-20">
      <!-- Hero Section -->
      <div class="text-center mb-16">
        <!-- Decorative top element -->
        <div class="flex justify-center mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-px bg-gradient-to-r from-transparent to-rose-400" />
            <div class="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <div class="w-12 h-px bg-gradient-to-l from-transparent to-rose-400" />
          </div>
        </div>

        <h2 class="text-6xl md:text-7xl font-serif font-bold bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 bg-clip-text text-transparent mb-6 animate-gradient">
          Ucapin
        </h2>

        <p class="text-stone-600 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-light">
          Platform dinding ucapan <span class="font-medium text-rose-600">real-time</span> yang memungkinkan orang mengirim dan menampilkan pesan secara langsung dalam satu ruang bersama.
        </p>

        <!-- Decorative bottom element -->
        <div class="flex justify-center mt-8">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-rose-300 rounded-full" />
            <div class="w-2 h-2 bg-amber-300 rounded-full" />
            <div class="w-2 h-2 bg-rose-300 rounded-full" />
          </div>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
        <div class="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/30 border border-rose-100/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-rose-200/50">
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 class="font-serif font-semibold text-lg text-stone-800 mb-2">
            Kirim Pesan
          </h3>
          <p class="text-stone-600 text-sm">
            Tulis ucapan dan pesan hangat untuk acara spesial
          </p>
        </div>

        <div class="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/30 border border-rose-100/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-200/50">
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 class="font-serif font-semibold text-lg text-stone-800 mb-2">
            Ambil Selfie
          </h3>
          <p class="text-stone-600 text-sm">
            Abadikan momen dengan foto selfie yang keren
          </p>
        </div>

        <div class="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-rose-100/30 border border-rose-100/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-200/50">
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 class="font-serif font-semibold text-lg text-stone-800 mb-2">
            Tampilkan
          </h3>
          <p class="text-stone-600 text-sm">
            Pesan muncul live di dinding ucapan acara
          </p>
        </div>
      </div>

      <!-- Continue Button -->
      <div class="flex justify-center">
        <NuxtLink
          to="/dashboard"
          class="group relative px-12 py-4 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-semibold rounded-2xl shadow-xl shadow-rose-300/50 hover:shadow-2xl hover:shadow-rose-400/60 hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 flex items-center gap-3 overflow-hidden"
        >
          <!-- Shimmer effect -->
          <div class="absolute inset-0 animate-shimmer" />
          <span class="relative z-10">Masuk Dashboard</span>
          <svg
            class="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <!-- Footer -->
    <div class="relative z-10 mt-16 py-8 border-t border-rose-100/50">
      <div class="max-w-7xl mx-auto px-6 text-center">
        <p class="text-sm text-stone-500">
          &copy; {{ new Date().getFullYear() }} Ucapin. All rights reserved.
        </p>
        <p class="text-xs text-stone-400 mt-1">
          Crafted with <span class="text-rose-500">&hearts;</span> by Ourmoment
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(1deg);
  }
  66% {
    transform: translateY(5px) rotate(-1deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 3s infinite;
}
</style>

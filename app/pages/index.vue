<script setup>
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-800">Ucapin</h1>
              <p class="text-xs text-gray-500">Ucapkan pesanmu, hadirkan momen.</p>
            </div>
          </div>
          <div class="text-sm text-gray-500">
            {{ new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-6 py-12">
      <!-- Welcome Section -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          Ucapin
        </h2>
        <p class="text-gray-600 text-lg">
          Platform dinding ucapan real-time yang memungkinkan orang mengirim dan menampilkan pesan secara langsung dalam satu ruang bersama.
        </p>
      </div>

      
      <!-- Continue Button -->
      <div class="flex justify-center">
        <button
          class="px-12 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
        >
          <span v-if="!isLoading">Masuk Dashboard</span>
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-12 py-6 border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
        <p>&copy; {{ new Date().getFullYear() }} Ucapin. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

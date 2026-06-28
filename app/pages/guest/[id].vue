<script setup lang="ts">
const route = useRoute()
const eventId = route.params.id
const runtimeConfig = useRuntimeConfig()

const currentStep = ref(1)
const isLoading = ref(false)
const eventData = ref<{ title: string, location: string, date: string } | null>(null)
const capturedPhoto = ref<string | null>(null)
const capturedPhotoFile = ref<File | null>(null)
const stream = ref<MediaStream | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const formData = ref({
  name: '',
  message: ''
})

const errors = ref({
  name: '',
  message: ''
})

const toast = useToast()

const fetchEventData = async () => {
  try {
    const response = await fetch(
      `${runtimeConfig.public.apiUrl}/v1/event/${eventId}`
    )

    if (!response.ok) {
      throw new Error('Event not found')
    }

    const result = await response.json()
    eventData.value = result.data
  } catch (error) {
    console.error('Error fetching event:', error)
    toast.add({
      title: 'Error',
      description: 'Event not found',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

const startCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    toast.add({
      title: 'Camera Error',
      description: 'Unable to access camera. Please check permissions.',
      color: 'error',
      icon: 'i-lucide-camera-off'
    })
  }
}

const capturePhoto = () => {
  if (videoRef.value && canvasRef.value) {
    const context = canvasRef.value.getContext('2d')
    if (context) {
      canvasRef.value.width = videoRef.value.videoWidth
      canvasRef.value.height = videoRef.value.videoHeight
      context.drawImage(
        videoRef.value,
        0,
        0,
        canvasRef.value.width,
        canvasRef.value.height
      )

      canvasRef.value.toBlob(
        (blob) => {
          if (blob) {
            capturedPhotoFile.value = new File([blob], 'selfie.jpg', {
              type: 'image/jpeg'
            })
            capturedPhoto.value = URL.createObjectURL(blob)
          }
        },
        'image/jpeg',
        0.8
      )

      if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
      }
    }
  }
}

const retakePhoto = async () => {
  capturedPhoto.value = null
  capturedPhotoFile.value = null
  await startCamera()
}

const validateForm = () => {
  let isValid = true
  errors.value = { name: '', message: '' }

  if (!formData.value.name.trim()) {
    errors.value.name = 'Name is required'
    isValid = false
  } else if (formData.value.name.length < 2) {
    errors.value.name = 'Name must be at least 2 characters'
    isValid = false
  }

  if (!formData.value.message.trim()) {
    errors.value.message = 'Message is required'
    isValid = false
  } else if (formData.value.message.length < 5) {
    errors.value.message = 'Message must be at least 5 characters'
    isValid = false
  } else if (formData.value.message.length > 500) {
    errors.value.message = 'Message must be less than 500 characters'
    isValid = false
  }

  return isValid
}

const submitMessage = async () => {
  if (!validateForm()) return

  if (!capturedPhotoFile.value) {
    toast.add({
      title: 'Error',
      description: 'Please take a selfie first',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isLoading.value = true

  try {
    const formDataObj = new FormData()
    formDataObj.append('name', formData.value.name)
    formDataObj.append('message', formData.value.message)
    formDataObj.append('photo', capturedPhotoFile.value)

    const response = await fetch(
      `${runtimeConfig.public.apiUrl}/v1/wishing-wall/${eventId}/message`,
      {
        method: 'POST',
        body: formDataObj
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send message')
    }

    const result = await response.json()
    console.log('Message sent:', result)

    toast.add({
      title: 'Success!',
      description: 'Your wish has been sent to the event wall',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    currentStep.value = 3
  } catch (error: unknown) {
    console.error('Error sending message:', error)
    toast.add({
      title: 'Error',
      description: (error as Error).message || 'Failed to send message',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

const nextStep = () => {
  if (currentStep.value === 1 && capturedPhoto.value) {
    currentStep.value = 2
  }
}

const resetForm = () => {
  currentStep.value = 1
  capturedPhoto.value = null
  capturedPhotoFile.value = null
  formData.value = { name: '', message: '' }
  startCamera()
}

onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
  if (capturedPhoto.value) {
    URL.revokeObjectURL(capturedPhoto.value)
  }
})

onMounted(() => {
  fetchEventData()
  startCamera()
})
</script>

<template>
  <div class="min-h-screen bg-stone-950 text-white relative overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-rose-950 via-stone-950 to-amber-950" />
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-800/20 via-transparent to-transparent" />

    <div class="relative z-10 container max-w-lg mx-auto px-4 py-8">
      <!-- Step Progress -->
      <div class="flex items-center justify-center gap-2 mb-12">
        <div
          v-for="step in 3"
          :key="step"
          :class="[
            'flex items-center gap-2',
            step < 3 ? 'after:content-[\'\'] after:w-8 after:h-0.5 after:rounded-full after:transition-colors after:duration-300' : ''
          ]"
        >
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300',
              currentStep >= step
                ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-stone-800 text-stone-500'
            ]"
          >
            <Icon
              v-if="currentStep > step"
              name="i-lucide-check"
              class="w-4 h-4"
            />
            <span v-else>{{ step }}</span>
          </div>
          <div
            v-if="step < 3"
            :class="['w-8 h-0.5 rounded-full transition-all duration-300', currentStep > step ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-stone-800']"
          />
        </div>
      </div>

      <!-- Step 1: Selfie -->
      <div
        v-if="currentStep === 1"
        class="animate-fadeIn"
      >
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-500/30">
            <Icon
              name="i-lucide-camera"
              class="w-8 h-8 text-white"
            />
          </div>
          <h1 class="text-2xl font-bold text-white mb-1">
            Take a Selfie
          </h1>
          <p class="text-stone-400 text-sm">
            Your photo will appear with your message
          </p>
        </div>

        <div class="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
          <div
            v-if="!capturedPhoto"
            class="relative aspect-[3/4] bg-stone-950 rounded-xl overflow-hidden"
          >
            <video
              ref="videoRef"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-40 h-40 rounded-full border-2 border-white/20" />
            </div>
          </div>

          <div
            v-else
            class="relative aspect-[3/4] bg-stone-950 rounded-xl overflow-hidden"
          >
            <img
              :src="capturedPhoto"
              alt="Captured selfie"
              class="w-full h-full object-cover"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div class="mt-4 flex gap-3">
            <button
              v-if="!capturedPhoto"
              class="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity"
              @click="capturePhoto"
            >
              <Icon
                name="i-lucide-camera"
                class="w-5 h-5 mr-2 inline"
              />
              Capture
            </button>

            <template v-else>
              <button
                class="flex-1 bg-stone-800 text-stone-300 font-semibold rounded-xl py-3 hover:bg-stone-700 transition-colors"
                @click="retakePhoto"
              >
                <Icon
                  name="i-lucide-refresh-cw"
                  class="w-5 h-5 mr-2 inline"
                />
                Retake
              </button>
              <button
                class="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity"
                @click="nextStep"
              >
                Next
                <Icon
                  name="i-lucide-arrow-right"
                  class="w-5 h-5 ml-2 inline"
                />
              </button>
            </template>
          </div>
        </div>

        <div
          v-if="eventData"
          class="mt-4 text-center"
        >
          <p class="text-stone-500 text-xs">
            Sending wish to
          </p>
          <p class="text-stone-300 font-semibold text-sm">
            {{ eventData.title }}
          </p>
        </div>
      </div>

      <!-- Step 2: Form -->
      <div
        v-else-if="currentStep === 2"
        class="animate-fadeIn"
      >
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-500/30">
            <Icon
              name="i-lucide-message-circle"
              class="w-8 h-8 text-white"
            />
          </div>
          <h1 class="text-2xl font-bold text-white mb-1">
            Your Wish
          </h1>
          <p class="text-stone-400 text-sm">
            Share your thoughts and well wishes
          </p>
        </div>

        <!-- Selfie Preview -->
        <div class="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-4">
          <div class="flex items-center gap-3">
            <img
              :src="capturedPhoto || undefined"
              alt=""
              class="w-12 h-12 rounded-full object-cover ring-2 ring-rose-600/50"
            >
            <div class="flex-1">
              <p class="text-stone-400 text-sm">
                Your selfie will appear
              </p>
              <button
                class="text-rose-500 text-xs hover:text-rose-400 transition-colors"
                @click="currentStep = 1"
              >
                Retake
              </button>
            </div>
          </div>
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-stone-300 mb-1">Your Name <span class="text-rose-500">*</span></label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Enter your name"
              class="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.name }"
            >
            <p
              v-if="errors.name"
              class="text-red-500 text-xs mt-1"
            >
              {{ errors.name }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-stone-300 mb-1">Your Message <span class="text-rose-500">*</span></label>
            <textarea
              v-model="formData.message"
              placeholder="Write your wish or message here..."
              rows="5"
              class="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all resize-none"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.message }"
            />
            <div class="flex justify-between mt-1">
              <p
                v-if="errors.message"
                class="text-red-500 text-xs"
              >
                {{ errors.message }}
              </p>
              <p
                v-else
                class="text-stone-600 text-xs"
              >
                Share your thoughts, well wishes, or feedback
              </p>
              <span
                :class="[
                  'text-xs',
                  formData.message.length > 500 ? 'text-red-500' : 'text-stone-500'
                ]"
              >
                {{ formData.message.length }}/500
              </span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 bg-stone-800 text-stone-300 font-semibold rounded-xl py-3 hover:bg-stone-700 transition-colors"
            @click="currentStep = 1"
          >
            Back
          </button>
          <button
            class="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading"
            @click="submitMessage"
          >
            <Icon
              v-if="isLoading"
              name="i-lucide-loader-2"
              class="w-5 h-5 mr-2 animate-spin inline"
            />
            <span v-else>Send Wish</span>
            <Icon
              v-if="!isLoading"
              name="i-lucide-send"
              class="w-5 h-5 ml-2 inline"
            />
          </button>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div
        v-else-if="currentStep === 3"
        class="text-center animate-fadeIn"
      >
        <div class="w-24 h-24 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/30">
          <Icon
            name="i-lucide-check"
            class="w-12 h-12 text-white"
          />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          Thank You!
        </h1>
        <p class="text-stone-400 mb-8">
          Your wish has been sent successfully
        </p>

        <div class="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 text-left">
          <div class="flex gap-3">
            <img
              :src="capturedPhoto || undefined"
              alt=""
              class="w-12 h-12 rounded-full object-cover ring-2 ring-rose-600/50"
            >
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-white">{{ formData.name || 'Anonymous' }}</span>
                <span class="text-xs text-stone-500">Just now</span>
              </div>
              <p class="text-stone-400 text-sm">
                {{ formData.message }}
              </p>
            </div>
          </div>
        </div>

        <button
          class="mt-6 text-rose-500 hover:text-rose-400 font-medium transition-colors"
          @click="resetForm"
        >
          <Icon
            name="i-lucide-plus"
            class="w-4 h-4 mr-1 inline"
          />
          Send Another Wish
        </button>
      </div>
    </div>

    <canvas
      ref="canvasRef"
      class="hidden"
    />
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
</style>

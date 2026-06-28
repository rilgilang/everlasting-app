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

const messageCharCount = computed(() => formData.value.message.length)
const charProgress = computed(() => (messageCharCount.value / 500) * 100)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-amber-50 relative">
    <!-- Decorative background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-20 left-10 w-40 h-40 bg-rose-200/20 rounded-full blur-3xl" />
      <div class="absolute bottom-40 right-20 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 container max-w-2xl mx-auto px-4 py-8">
      <!-- Step Progress Indicator -->
      <div class="flex items-center justify-center mb-10">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300',
              currentStep >= 1
                ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-200/50'
                : 'bg-stone-200 text-stone-500'
            ]"
          >
            <Icon
              v-if="currentStep > 1"
              name="i-lucide-check"
              class="w-5 h-5"
            />
            <span v-else>1</span>
          </div>
          <div :class="['w-16 h-1 rounded-full transition-all duration-500', currentStep >= 2 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-stone-200']" />
          <div
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300',
              currentStep >= 2
                ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-200/50'
                : 'bg-stone-200 text-stone-500'
            ]"
          >
            <Icon
              v-if="currentStep > 2"
              name="i-lucide-check"
              class="w-5 h-5"
            />
            <span v-else>2</span>
          </div>
          <div :class="['w-16 h-1 rounded-full transition-all duration-500', currentStep >= 3 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-stone-200']" />
          <div
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300',
              currentStep >= 3
                ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-200/50'
                : 'bg-stone-200 text-stone-500'
            ]"
          >
            <Icon
              v-if="currentStep >= 3"
              name="i-lucide-check"
              class="w-5 h-5"
            />
            <span v-else>3</span>
          </div>
        </div>
      </div>

      <!-- Step 1: Selfie -->
      <div
        v-if="currentStep === 1"
        class="space-y-6 animate-fadeIn"
      >
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 shadow-xl shadow-rose-200/50 mb-4">
            <Icon
              name="i-lucide-camera"
              class="w-8 h-8 text-white"
            />
          </div>
          <h1 class="text-3xl font-serif font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Take a Selfie
          </h1>
          <p class="text-stone-600">
            Smile! Your photo will appear with your message
          </p>
        </div>

        <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-rose-100/30 border border-rose-100/50">
          <div class="relative">
            <div
              v-if="!capturedPhoto"
              class="relative aspect-video bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl overflow-hidden shadow-inner"
            >
              <video
                ref="videoRef"
                autoplay
                playsinline
                class="w-full h-full object-cover"
              />
              <!-- Instagram-style ring overlay -->
              <div class="absolute inset-3 border-2 border-white/20 rounded-xl pointer-events-none" />
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-40 h-40 rounded-full border-3 border-white/40 shadow-lg" />
              </div>
              <!-- Camera flash effect -->
              <div class="absolute inset-0 bg-white/0 pointer-events-none" />
            </div>

            <div
              v-else
              class="relative aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-inner"
            >
              <img
                :src="capturedPhoto"
                alt="Captured selfie"
                class="w-full h-full object-cover"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <UButton
              v-if="!capturedPhoto"
              color="primary"
              variant="solid"
              size="lg"
              class="flex-1 rounded-xl shadow-lg shadow-rose-300/50"
              @click="capturePhoto"
            >
              <Icon
                name="i-lucide-camera"
                class="w-5 h-5 mr-2"
              />
              Capture Selfie
            </UButton>

            <UButton
              v-else
              color="neutral"
              variant="outline"
              size="lg"
              class="flex-1 rounded-xl border-stone-300"
              @click="retakePhoto"
            >
              <Icon
                name="i-lucide-refresh-cw"
                class="w-5 h-5 mr-2"
              />
              Retake
            </UButton>

            <UButton
              v-if="capturedPhoto"
              color="primary"
              variant="solid"
              size="lg"
              class="flex-1 rounded-xl shadow-lg shadow-rose-300/50"
              @click="nextStep"
            >
              Next
              <Icon
                name="i-lucide-arrow-right"
                class="w-5 h-5 ml-2"
              />
            </UButton>
          </div>
        </div>

        <div
          v-if="eventData"
          class="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-rose-100/20 border border-rose-100/50"
        >
          <div class="text-center">
            <p class="text-sm text-stone-500 mb-1">
              Sending wish to
            </p>
            <h3 class="font-serif font-semibold text-lg text-stone-800">
              {{ eventData.title }}
            </h3>
            <p class="text-xs text-stone-500 mt-1">
              {{ eventData.location }} • {{ new Date(eventData.date).toLocaleDateString("id-ID") }}
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2: Form -->
      <div
        v-else-if="currentStep === 2"
        class="space-y-6 animate-fadeIn"
      >
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 shadow-xl shadow-rose-200/50 mb-4">
            <Icon
              name="i-lucide-message-circle"
              class="w-8 h-8 text-white"
            />
          </div>
          <h1 class="text-3xl font-serif font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Your Wish
          </h1>
          <p class="text-stone-600">
            Share your thoughts and well wishes
          </p>
        </div>

        <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl shadow-rose-100/30 border border-rose-100/50">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-stone-200 ring-3 ring-rose-200 shadow-lg">
              <img
                :src="capturedPhoto || undefined"
                alt="Your selfie"
                class="w-full h-full object-cover"
              >
            </div>
            <div class="flex-1">
              <p class="text-sm text-stone-600 font-medium">
                Your selfie will appear with your message
              </p>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-rose-600"
                @click="currentStep = 1"
              >
                <Icon
                  name="i-lucide-edit-2"
                  class="w-3 h-3 mr-1"
                />
                Retake
              </UButton>
            </div>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-rose-100/30 border border-rose-100/50">
          <div class="space-y-5">
            <UFormField
              label="Your Name"
              required
              :error="errors.name"
            >
              <UInput
                v-model="formData.name"
                placeholder="Enter your name"
                size="lg"
                class="w-full rounded-xl"
                :class="{ 'border-red-500': errors.name }"
              />
            </UFormField>

            <UFormField
              label="Your Wish / Message"
              required
              :error="errors.message"
            >
              <UTextarea
                v-model="formData.message"
                placeholder="Write your wish or message here..."
                :rows="5"
                size="lg"
                class="w-full rounded-xl"
                :class="{ 'border-red-500': errors.message }"
              />
              <template #hint>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs text-stone-500">Share your thoughts, well wishes, or feedback</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        :class="[
                          'h-full rounded-full transition-all',
                          messageCharCount > 500 ? 'bg-red-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                        ]"
                        :style="{ width: `${Math.min(charProgress, 100)}%` }"
                      />
                    </div>
                    <span
                      :class="[
                        'text-xs font-medium',
                        messageCharCount > 500 ? 'text-red-500' : 'text-stone-500'
                      ]"
                    >
                      {{ messageCharCount }}/500
                    </span>
                  </div>
                </div>
              </template>
            </UFormField>
          </div>
        </div>

        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="flex-1 rounded-xl border-stone-300"
            @click="currentStep = 1"
          >
            Back
          </UButton>
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            class="flex-1 rounded-xl shadow-lg shadow-rose-300/50"
            :loading="isLoading"
            @click="submitMessage"
          >
            Send Wish
            <Icon
              name="i-lucide-send"
              class="w-5 h-5 ml-2"
            />
          </UButton>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div
        v-else-if="currentStep === 3"
        class="space-y-6 animate-fadeIn"
      >
        <div class="text-center">
          <!-- Success badge with animation -->
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 mb-6 shadow-xl shadow-rose-300/50 animate-pulse-glow">
            <Icon
              name="i-lucide-check"
              class="w-12 h-12 text-white"
            />
          </div>
          <h1 class="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Thank You!
          </h1>
          <p class="text-stone-600 text-lg">
            Your wish has been sent successfully
          </p>
        </div>

        <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-rose-100/30 border border-rose-100/50">
          <div class="flex gap-4">
            <div class="w-14 h-14 rounded-full overflow-hidden bg-stone-200 ring-2 ring-rose-200">
              <img
                :src="capturedPhoto || undefined"
                alt="Your selfie"
                class="w-full h-full object-cover"
              >
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-semibold text-stone-800">{{ formData.name || "Anonymous" }}</span>
                <span class="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">Just now</span>
              </div>
              <p class="text-stone-700 leading-relaxed">
                {{ formData.message }}
              </p>
            </div>
          </div>
        </div>

        <div class="text-center">
          <UButton
            color="primary"
            variant="outline"
            size="lg"
            class="rounded-xl border-rose-200 hover:border-rose-300"
            @click="resetForm"
          >
            <Icon
              name="i-lucide-plus"
              class="w-5 h-5 mr-2"
            />
            Send Another Wish
          </UButton>
        </div>
      </div>
    </div>

    <!-- Hidden Canvas -->
    <canvas
      ref="canvasRef"
      class="hidden"
    />
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(244, 63, 94, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(244, 63, 94, 0.6);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.aspect-video {
  aspect-ratio: 16 / 9;
}
</style>

<!-- pages/guest/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const eventId = route.params.id;
const runtimeConfig = useRuntimeConfig();

// State
const currentStep = ref(1); // 1: Selfie, 2: Form, 3: Success
const isLoading = ref(false);
const eventData = ref<any>(null);
const capturedPhoto = ref<string | null>(null);
const capturedPhotoFile = ref<File | null>(null);
const stream = ref<MediaStream | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Form data
const formData = ref({
  name: "",
  message: "",
});

// Form errors
const errors = ref({
  name: "",
  message: "",
});

const toast = useToast();

// Fetch event data
const fetchEventData = async () => {
  try {
    const response = await fetch(
      `${runtimeConfig.public.apiUrl}/v1/event/${eventId}`,
    );

    if (!response.ok) {
      throw new Error("Event not found");
    }

    const result = await response.json();
    eventData.value = result.data;
  } catch (error) {
    console.error("Error fetching event:", error);
    toast.add({
      title: "Error",
      description: "Event not found",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  }
};

// Start camera
const startCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    if (videoRef.value) {
      videoRef.value.srcObject = stream.value;
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    toast.add({
      title: "Camera Error",
      description: "Unable to access camera. Please check permissions.",
      color: "error",
      icon: "i-lucide-camera-off",
    });
  }
};

// Capture photo
const capturePhoto = () => {
  if (videoRef.value && canvasRef.value) {
    const context = canvasRef.value.getContext("2d");
    if (context) {
      canvasRef.value.width = videoRef.value.videoWidth;
      canvasRef.value.height = videoRef.value.videoHeight;
      context.drawImage(
        videoRef.value,
        0,
        0,
        canvasRef.value.width,
        canvasRef.value.height,
      );

      // Convert canvas to blob
      canvasRef.value.toBlob(
        (blob) => {
          if (blob) {
            capturedPhotoFile.value = new File([blob], "selfie.jpg", {
              type: "image/jpeg",
            });
            capturedPhoto.value = URL.createObjectURL(blob);
          }
        },
        "image/jpeg",
        0.8,
      );

      // Stop camera stream
      if (stream.value) {
        stream.value.getTracks().forEach((track) => track.stop());
      }
    }
  }
};

// Retake photo
const retakePhoto = async () => {
  capturedPhoto.value = null;
  capturedPhotoFile.value = null;
  await startCamera();
};

// Validate form
const validateForm = () => {
  let isValid = true;
  errors.value = { name: "", message: "" };

  if (!formData.value.name.trim()) {
    errors.value.name = "Name is required";
    isValid = false;
  } else if (formData.value.name.length < 2) {
    errors.value.name = "Name must be at least 2 characters";
    isValid = false;
  }

  if (!formData.value.message.trim()) {
    errors.value.message = "Message is required";
    isValid = false;
  } else if (formData.value.message.length < 5) {
    errors.value.message = "Message must be at least 5 characters";
    isValid = false;
  } else if (formData.value.message.length > 500) {
    errors.value.message = "Message must be less than 500 characters";
    isValid = false;
  }

  return isValid;
};

// Submit message
const submitMessage = async () => {
  if (!validateForm()) return;

  if (!capturedPhotoFile.value) {
    toast.add({
      title: "Error",
      description: "Please take a selfie first",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  isLoading.value = true;

  try {
    const formDataObj = new FormData();
    formDataObj.append("name", formData.value.name);
    formDataObj.append("message", formData.value.message);
    formDataObj.append("photo", capturedPhotoFile.value);

    const response = await fetch(
      `${runtimeConfig.public.apiUrl}/v1/wishing-wall/${eventId}/message`,
      {
        method: "POST",
        body: formDataObj,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send message");
    }

    const result = await response.json();

    console.log("Message sent:", result);

    toast.add({
      title: "Success!",
      description: "Your wish has been sent to the event wall",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    currentStep.value = 3;
  } catch (error: any) {
    console.error("Error sending message:", error);
    toast.add({
      title: "Error",
      description: error.message || "Failed to send message",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    isLoading.value = false;
  }
};

// Next step
const nextStep = () => {
  if (currentStep.value === 1 && capturedPhoto.value) {
    currentStep.value = 2;
  }
};

// Reset form
const resetForm = () => {
  currentStep.value = 1;
  capturedPhoto.value = null;
  capturedPhotoFile.value = null;
  formData.value = { name: "", message: "" };
  startCamera();
};

// Go back to event page
const goToEvent = () => {
  navigateTo(`/event/${eventId}`);
};

// Cleanup on unmount
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }
  if (capturedPhoto.value) {
    URL.revokeObjectURL(capturedPhoto.value);
  }
});

onMounted(() => {
  fetchEventData();
  startCamera();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container max-w-2xl mx-auto px-4 py-8">
      <!-- Step 1: Selfie -->
      <div v-if="currentStep === 1" class="space-y-6">
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 shadow-lg mb-4"
          >
            <Icon
              name="i-lucide-camera"
              class="w-8 h-8 text-primary-600 dark:text-primary-400"
            />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Take a Selfie
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Smile! Your photo will appear with your message
          </p>
        </div>

        <!-- Camera Preview -->
        <UCard class="overflow-hidden">
          <div class="relative">
            <!-- Video Preview -->
            <div
              v-if="!capturedPhoto"
              class="relative aspect-video bg-black rounded-lg overflow-hidden"
            >
              <video
                ref="videoRef"
                autoplay
                playsinline
                class="w-full h-full object-cover"
              ></video>
              <div
                class="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div
                  class="w-48 h-48 rounded-full border-4 border-white/50"
                ></div>
              </div>
            </div>

            <!-- Captured Photo -->
            <div
              v-else
              class="relative aspect-video bg-black rounded-lg overflow-hidden"
            >
              <img
                :src="capturedPhoto"
                alt="Captured selfie"
                class="w-full h-full object-cover"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
              ></div>
            </div>
          </div>

          <div class="mt-4 flex gap-3">
            <UButton
              v-if="!capturedPhoto"
              color="primary"
              variant="solid"
              size="lg"
              class="flex-1"
              @click="capturePhoto"
            >
              <Icon name="i-lucide-camera" class="w-5 h-5 mr-2" />
              Capture Selfie
            </UButton>

            <UButton
              v-else
              color="neutral"
              variant="outline"
              size="lg"
              class="flex-1"
              @click="retakePhoto"
            >
              <Icon name="i-lucide-refresh-cw" class="w-5 h-5 mr-2" />
              Retake
            </UButton>

            <UButton
              v-if="capturedPhoto"
              color="primary"
              variant="solid"
              size="lg"
              class="flex-1"
              @click="nextStep"
            >
              Next
              <Icon name="i-lucide-arrow-right" class="w-5 h-5 ml-2" />
            </UButton>
          </div>
        </UCard>

        <!-- Event Info -->
        <UCard v-if="eventData">
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Sending wish to
            </p>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ eventData.title }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ eventData.location }} •
              {{ new Date(eventData.date).toLocaleDateString("id-ID") }}
            </p>
          </div>
        </UCard>
      </div>

      <!-- Step 2: Form -->
      <div v-else-if="currentStep === 2" class="space-y-6">
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 shadow-lg mb-4"
          >
            <Icon
              name="i-lucide-message-circle"
              class="w-8 h-8 text-primary-600 dark:text-primary-400"
            />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Wish
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Share your thoughts and well wishes
          </p>
        </div>

        <!-- Selfie Preview -->
        <UCard class="overflow-hidden">
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img
                :src="capturedPhoto"
                alt="Your selfie"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Your selfie will appear with your message
              </p>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                @click="currentStep = 1"
              >
                <Icon name="i-lucide-edit-2" class="w-3 h-3 mr-1" />
                Retake
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Form -->
        <UCard>
          <div class="space-y-4">
            <!-- Name Field -->
            <UFormField label="Your Name" required :error="errors.name">
              <UInput
                v-model="formData.name"
                placeholder="Enter your name"
                size="lg"
                class="w-full"
                :class="{ 'border-red-500': errors.name }"
              />
            </UFormField>

            <!-- Message Field -->
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
                class="w-full"
                :class="{ 'border-red-500': errors.message }"
              />
              <template #hint>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500 dark:text-gray-400"
                    >Share your thoughts, well wishes, or feedback</span
                  >
                  <span
                    :class="
                      formData.message.length > 500
                        ? 'text-red-500'
                        : 'text-gray-500'
                    "
                  >
                    {{ formData.message.length }}/500
                  </span>
                </div>
              </template>
            </UFormField>
          </div>
        </UCard>

        <!-- Actions -->
        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="flex-1"
            @click="currentStep = 1"
          >
            Back
          </UButton>
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            class="flex-1"
            :loading="isLoading"
            @click="submitMessage"
          >
            Send Wish
            <Icon name="i-lucide-send" class="w-5 h-5 ml-2" />
          </UButton>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div v-else-if="currentStep === 3" class="space-y-6">
        <!-- Success Animation -->
        <div class="text-center">
          <div
            class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
          >
            <Icon
              name="i-lucide-check"
              class="w-12 h-12 text-green-600 dark:text-green-400"
            />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You!
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Your wish has been sent successfully
          </p>
        </div>

        <!-- Message Preview -->
        <UCard>
          <div class="space-y-4">
            <div class="flex gap-3">
              <div
                class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800"
              >
                <img
                  :src="capturedPhoto"
                  alt="Your selfie"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    formData.name || "Anonymous"
                  }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400"
                    >Just now</span
                  >
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  {{ formData.message }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Actions -->
        <!-- <div class="space-y-3">
                    <UButton color="primary" variant="solid" size="lg" class="w-full" @click="resetForm">
                        <Icon name="i-lucide-plus" class="w-5 h-5 mr-2" />
                        Send Another Wish
                    </UButton>

                    <UButton color="neutral" variant="outline" size="lg" class="w-full" @click="goToEvent">
                        <Icon name="i-lucide-eye" class="w-5 h-5 mr-2" />
                        View Event Details
                    </UButton>
                </div> -->
      </div>
    </div>

    <!-- Hidden Canvas for Photo Capture -->
    <canvas ref="canvasRef" class="hidden"></canvas>
  </div>
</template>

<style scoped>
.aspect-video {
  aspect-ratio: 16 / 9;
}
</style>

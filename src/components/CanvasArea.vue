<script setup>
import { ref } from 'vue'

const props = defineProps({
  image: String,
  hotspots: Array,
  selectedId: String,
  themeColor: String,
  pulse: Boolean
})

const emit = defineEmits(['upload', 'add', 'select'])

const containerRef = ref(null)

const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    const url = URL.createObjectURL(file)
    emit('upload', url)
  }
}

const handleClick = (e) => {
  if (!props.image || !containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  
  emit('add', { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) })
}
</script>

<template>
  <div 
    ref="containerRef"
    class="relative w-full max-w-4xl mx-auto select-none"
    @click="handleClick"
  >
    <!-- Image Upload (Visual Only if no image) -->
    <div v-if="!image" class="w-full aspect-[4/3] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 transition-all hover:border-blue-400 hover:bg-white group cursor-pointer">
      <label class="cursor-pointer text-center p-12 w-full h-full flex flex-col items-center justify-center">
        <div class="bg-blue-50 p-6 rounded-[2rem] mb-6 mx-auto w-fit group-hover:scale-110 transition-transform shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span class="text-2xl font-bold text-slate-800 block mb-2">Upload Visual Asset</span>
        <span class="text-slate-400 text-sm">PNG, JPG or SVG (Max 10MB)</span>
        <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
      </label>
    </div>

    <!-- Active Canvas -->
    <div v-else class="relative overflow-hidden rounded-[2rem] shadow-lg border border-slate-100 bg-white p-2">
      <img 
        :src="image" 
        class="w-full h-auto block rounded-[1.5rem] pointer-events-none select-none" 
        alt="Base"
        @dragstart.prevent
      />

      <!-- Hotspots -->
      <div 
        v-for="h in hotspots" 
        :key="h.id"
        class="absolute -translate-x-1/2 -translate-y-1/2 group z-10 w-12 h-12 flex items-center justify-center cursor-pointer"
        :style="{ left: h.x + '%', top: h.y + '%' }"
        @click.stop="emit('select', h.id)"
      >
        <!-- Hotspot Indicator -->
        <div 
          class="relative w-8 h-8 rounded-full border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-all hover:scale-110 active:scale-90 flex items-center justify-center text-white"
          :class="{ 'scale-110 ring-4 ring-indigo-500/20': selectedId === h.id }"
          :style="{ backgroundColor: h.color || themeColor }"
        >
          <!-- Dynamic Icon -->
          <svg v-if="h.icon === 'plus'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
          </svg>
          <svg v-else-if="h.icon === 'info'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="h.icon === 'question'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="h.icon === 'star'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          <svg v-else-if="h.icon === 'exclamation'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>

          <!-- Pulse -->
          <div 
            v-if="pulse"
            class="absolute inset-0 rounded-full animate-ping opacity-40 -z-10"
            :style="{ backgroundColor: h.color || themeColor }"
          ></div>
        </div>

        <!-- Label Preview -->
        <div class="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 pointer-events-none shadow-xl border border-white/10">
          {{ h.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  BellIcon, 
  EnvelopeIcon, 
  ChevronDownIcon,
  CommandLineIcon,
  Bars3Icon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

defineProps({
  title: String
})

defineEmits(['generate', 'toggle-sidebar'])
</script>

<template>
  <header class="h-20 md:h-28 flex items-center justify-between px-4 md:px-8 z-20">
    <div class="flex items-center gap-4">
      <!-- Hamburger Menu -->
      <button @click="$emit('toggle-sidebar')" class="lg:hidden p-2 text-slate-600 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Bars3Icon class="w-6 h-6" />
      </button>

      <div class="flex flex-col">
        <div class="hidden sm:flex items-center text-[11px] font-bold text-slate-400 gap-2 uppercase tracking-widest leading-none mb-1">
          <span>Pages</span>
          <span class="text-slate-300 font-normal">/</span>
          <span class="text-slate-400">{{ title }}</span>
        </div>
        <h2 class="text-xl md:text-3xl font-black text-slate-800 tracking-tighter leading-tight">Main Dashboard</h2>
      </div>
    </div>

    <!-- High Density Utility Bar -->
    <div class="bg-white rounded-full border border-slate-100 p-1.5 md:p-2 flex items-center gap-1.5 md:gap-2 shadow-sm">
      <!-- Search Input -->
      <div class="flex items-center bg-slate-50 border border-slate-50 rounded-full px-3 md:px-4 py-1.5 md:py-2 group focus-within:border-indigo-100 transition-all">
        <MagnifyingGlassIcon class="h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Search..." class="hidden sm:block bg-transparent border-none outline-none text-xs ml-2 w-24 lg:w-48 text-slate-600 font-bold placeholder:text-slate-300 placeholder:font-medium" />
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <button class="p-2 md:p-2.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all relative">
          <BellIcon class="w-4 h-4 md:w-4.5 md:h-4.5" />
          <span class="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <button 
          @click="$emit('generate')"
          class="p-2 md:p-2.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          title="Compile Code"
        >
          <CommandLineIcon class="w-4 h-4 md:w-4.5 md:h-4.5" />
        </button>
      </div>

      <!-- Avatar Badge -->
      <div class="flex items-center bg-slate-900 text-white w-8 h-8 md:w-10 md:h-10 rounded-full justify-center text-[9px] md:text-[10px] font-black cursor-pointer hover:bg-indigo-600 transition-colors">
        JD
      </div>
    </div>
  </header>
</template>

<script setup>
import {
  BellIcon,
  CommandLineIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

defineProps({
  title: String,
  currentUser: Object
})

defineEmits(['generate', 'logout'])
</script>

<template>
  <header class="h-20 md:h-28 flex items-center justify-between px-4 md:px-8 z-20">
    <div class="flex items-center gap-4">
      <h1 class="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-tight">
        Infografika-készítő
      </h1>
    </div>

    <!-- Utility Bar -->
    <div class="bg-white rounded-full border border-slate-100 p-1.5 md:p-2 flex items-center gap-1.5 md:gap-2 shadow-sm">
      <div class="flex items-center gap-1.5">
        <span v-if="currentUser" class="text-xs font-bold text-slate-600 px-3 border-r border-slate-100 hidden sm:inline-block">
          Szia, {{ currentUser.username }}!
        </span>
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
        <button
          @click="$emit('logout')"
          class="p-2 md:p-2.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
          title="Kijelentkezés"
        >
          <ArrowRightOnRectangleIcon class="w-4 h-4 md:w-4.5 md:h-4.5" />
        </button>
      </div>
    </div>
  </header>
</template>

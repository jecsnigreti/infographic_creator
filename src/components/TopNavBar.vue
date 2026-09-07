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

defineEmits(['generate', 'logout', 'upgrade'])
</script>

<template>
  <header class="h-20 md:h-28 flex items-center justify-between px-4 md:px-8 z-20">
    <div class="flex items-center gap-4">
      <h1 class="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-tight">
        Infografika-készítő
      </h1>
    </div>

    <!-- Utility Bar -->
    <div class="flex items-center gap-2 md:gap-3">
      <div v-if="currentUser && currentUser.plan" class="flex items-center gap-2">
        <span
          class="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full whitespace-nowrap"
          :class="currentUser.plan === 'pro' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'"
        >
          {{ currentUser.plan === 'pro' ? 'PRO' : 'Ingyenes' }}
          <span v-if="currentUser.plan !== 'pro' && currentUser.usage"> · {{ currentUser.usage.hostedLinksUsed }}/{{ currentUser.usage.hostedLinksLimit }} link</span>
        </span>
        <button
          v-if="currentUser.plan !== 'pro'"
          @click="$emit('upgrade')"
          class="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-all whitespace-nowrap"
        >
          Frissítés Pro-ra
        </button>
      </div>
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
    </div>
  </header>
</template>

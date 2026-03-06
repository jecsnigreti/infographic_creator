<script setup>
import { 
  Squares2X2Icon, 
  PhotoIcon, 
  ChartBarIcon, 
  CubeIcon, 
  Cog6ToothIcon,
  CircleStackIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

defineProps({
  isOpen: Boolean,
  activeView: {
    type: String,
    default: 'canvas'
  }
})

const emit = defineEmits(['close', 'navigate'])

const menuItems = [
  { name: 'Dashboard', icon: Squares2X2Icon, id: 'dashboard' },
  { name: 'Canvas', icon: PhotoIcon, id: 'canvas' },
  { name: 'Database', icon: CircleStackIcon, id: 'database' },
  { name: 'Assets', icon: CubeIcon, id: 'assets' },
  { name: 'Analytics', icon: ChartBarIcon, id: 'analytics' },
  { name: 'Settings', icon: Cog6ToothIcon, id: 'settings' },
]
</script>

<template>
  <aside class="h-full bg-white border-r border-slate-100 flex flex-col py-8 shrink-0 shadow-2xl lg:shadow-none">
    <!-- Logo & Close -->
    <div class="px-8 mb-10 flex items-center justify-between">
      <h1 class="text-2xl font-black text-slate-800 tracking-tighter">FINDASH<span class="text-indigo-600">.</span></h1>
      <button @click="emit('close')" class="lg:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors">
        <XMarkIcon class="w-6 h-6" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 flex flex-col gap-1 px-4">
      <button 
        v-for="item in menuItems" 
        :key="item.name"
        @click="emit('navigate', item.id)"
        class="group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all w-full text-left"
        :class="activeView === item.id ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'"
      >
        <component :is="item.icon" class="w-5 h-5 shrink-0" />
        <span class="text-sm tracking-tight">{{ item.name }}</span>
        
        <!-- Active Indicator (Right Side) -->
        <div v-if="activeView === item.id" class="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-l-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
      </button>
    </nav>

    <!-- Upgrade Card -->
    <div class="px-6 mt-auto">
      <div class="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
        <div class="relative z-10">
          <h4 class="text-sm font-black mb-1">Upgrade to PRO</h4>
          <p class="text-[10px] font-medium opacity-80 mb-4 leading-relaxed">Unlock all features and custom export options.</p>
          <button class="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Upgrade</button>
        </div>
        <!-- Decorative Circle -->
        <div class="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
      </div>
    </div>
  </aside>
</template>

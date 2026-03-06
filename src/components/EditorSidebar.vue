<script setup>
import { ref } from 'vue'
import { CommandLineIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  hotspots: Array,
  selectedHotspot: Object,
  config: Object
})

const emit = defineEmits(['update-hotspot', 'delete-hotspot', 'update-config', 'generate'])

const isExporterVisible = ref(false)

const handleFieldChange = (field, value) => {
  if (props.selectedHotspot) {
    emit('update-hotspot', props.selectedHotspot.id, { [field]: value })
  }
}
</script>

<template>
  <aside class="flex flex-col h-full bg-white">
    <!-- Panel Header - Finder style -->
    <div class="px-8 py-6 border-b border-slate-50">
      <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Property Explorer</h2>
      <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Node Configuration</p>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-auto p-8 space-y-8 custom-scrollbar pb-32">
      <!-- Global Config Card -->
      <section class="bg-[#F4F7FE] p-6 rounded-[2rem] border border-slate-100 shadow-inner">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] mb-5 text-indigo-600 flex items-center gap-2">
          <CommandLineIcon class="w-3.5 h-3.5" />
          Engine Styles
        </h3>
        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-slate-500 uppercase tracking-tight">Theme Color</span>
            <input 
              type="color" 
              :value="config.themeColor" 
              class="w-8 h-8 rounded-lg border-2 border-white shadow-sm cursor-pointer overflow-hidden p-0 bg-transparent transition-transform hover:scale-110"
              @input="e => emit('update-config', { themeColor: e.target.value })"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-slate-500 uppercase tracking-tight">Pulse Mode</span>
            <button 
              class="w-10 h-6 rounded-full transition-all relative p-1"
              :class="config.pulseAnimation ? 'bg-indigo-600' : 'bg-slate-300'"
              @click="emit('update-config', { pulseAnimation: !config.pulseAnimation })"
            >
              <div class="w-4 h-4 bg-white rounded-full transition-all shadow-sm" :class="{ 'translate-x-4': config.pulseAnimation }"></div>
            </button>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-slate-500 uppercase tracking-tight">Minify Output</span>
            <button 
              class="w-10 h-6 rounded-full transition-all relative p-1"
              :class="config.minifyExport ? 'bg-indigo-600' : 'bg-slate-300'"
              @click="emit('update-config', { minifyExport: !config.minifyExport })"
            >
              <div class="w-4 h-4 bg-white rounded-full transition-all shadow-sm" :class="{ 'translate-x-4': config.minifyExport }"></div>
            </button>
          </div>

          <div class="space-y-3 pt-3 border-t border-slate-200/50">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Animation</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button 
                v-for="type in ['fade', 'slide', 'zoom']"
                :key="type"
                @click="emit('update-config', { popupAnimation: type })"
                class="px-2 py-2 text-[9px] font-black rounded-xl border transition-all capitalize tracking-widest"
                :class="config.popupAnimation === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'"
              >
                {{ type }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Hotspot Editor -->
      <section v-if="selectedHotspot" class="space-y-6 animate-in fade-in slide-in-from-right duration-500">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">
            Node <span class="text-indigo-600">#{{ selectedHotspot.id.split('_')[1].slice(-4) }}</span>
          </h3>
          <button @click="emit('delete-hotspot', selectedHotspot.id)" class="text-rose-500 hover:text-rose-600 transition-all font-black uppercase text-[9px] tracking-[0.2em] px-3 py-1 bg-rose-50 rounded-full">
            Delete
          </button>
        </div>

        <div class="space-y-6">
          <div class="space-y-2 group">
            <label class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-focus-within:text-indigo-600 transition-colors pl-1">Heading</label>
            <input 
              type="text" 
              :value="selectedHotspot.title"
              class="w-full bg-[#FAFBFF] border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
              @input="e => handleFieldChange('title', e.target.value)"
            />
          </div>

          <div class="space-y-2 group">
            <label class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-focus-within:text-indigo-600 transition-colors pl-1">Body Text (HTML OK)</label>
            <textarea 
              :value="selectedHotspot.content"
              rows="4"
              class="w-full bg-[#FAFBFF] border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-500 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none"
              @input="e => handleFieldChange('content', e.target.value)"
            ></textarea>
          </div>

          <!-- Per-Hotspot Styling -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pl-1">Node Color</label>
              <div class="flex items-center gap-3 bg-[#FAFBFF] p-3 rounded-2xl border border-slate-100">
                <input 
                  type="color" 
                  :value="selectedHotspot.color || config.themeColor"
                  class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                  @input="e => handleFieldChange('color', e.target.value)"
                />
                <span class="text-[10px] font-mono text-slate-400 uppercase">{{ selectedHotspot.color || config.themeColor }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pl-1">Icon Style</label>
              <select 
                :value="selectedHotspot.icon || 'plus'"
                class="w-full bg-[#FAFBFF] border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-500 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                @change="e => handleFieldChange('icon', e.target.value)"
              >
                <option value="plus">Plus (+)</option>
                <option value="info">Info (i)</option>
                <option value="question">Help (?)</option>
                <option value="star">Star (★)</option>
                <option value="exclamation">Alert (!)</option>
              </select>
            </div>
          </div>
            <div class="space-y-2 group">
              <label class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-focus-within:text-indigo-600 pl-1">Media URL (Image/Video)</label>
              <input 
                type="text" 
                :value="selectedHotspot.mediaUrl"
                placeholder="https://example.com/image.jpg"
                class="w-full bg-[#FAFBFF] border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                @input="e => handleFieldChange('mediaUrl', e.target.value)"
              />
            </div>
            <div class="space-y-2 group">
              <label class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-focus-within:text-indigo-600 pl-1">Redirect URI</label>
              <input 
                type="text" 
                :value="selectedHotspot.link"
                placeholder="https://..."
                class="w-full bg-[#FAFBFF] border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                @input="e => handleFieldChange('link', e.target.value)"
              />
            </div>
            <div class="space-y-2 group">
              <label class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-focus-within:text-indigo-600 pl-1">Action Button</label>
              <input 
                type="text" 
                :value="selectedHotspot.cta"
                class="w-full bg-[#FAFBFF] border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                @input="e => handleFieldChange('cta', e.target.value)"
              />
            </div>
          </div>
      </section>

      <div v-else class="text-center py-20 bg-[#FAFBFF] rounded-[2.5rem] border border-slate-50 flex flex-col items-center">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Select node to edit</p>
      </div>
    </div>

    <!-- Final CTA Footer -->
    <div class="p-8 border-t border-slate-50 bg-white sticky bottom-0 z-20">
      <button 
        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 group flex items-center justify-center gap-3"
        @click="emit('generate')"
      >
        Compile Block
        <CommandLineIcon class="w-4 h-4 transition-transform group-hover:rotate-12" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #e2e8f0;
}
</style>

<script setup>
import { 
  MapIcon, 
  ChartPieIcon, 
  PhotoIcon,
  PaintBrushIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  engine: {
    type: String,
    default: 'map'
  },
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:engine', 'update:config', 'generate'])

const engines = [
  { id: 'map', name: 'SVG Map', icon: MapIcon, desc: 'Interactive Geo-heatmap' },
  { id: 'chart', name: 'Data Chart', icon: ChartPieIcon, desc: 'Bar, Pie, Radar, etc.' },
  { id: 'hotspot', name: 'Image Hotspot', icon: PhotoIcon, desc: 'Points on custom image' }
]

const maps = [
  { id: 'hu-counties', name: 'Hungary (Counties)' },
  { id: 'usa', name: 'USA States' },
  { id: 'eu', name: 'European Union' },
  { id: 'africa', name: 'Africa' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'world', name: 'World Map' }
]

const chartTypes = [
  { id: 'bar', name: 'Bar Chart' },
  { id: 'line', name: 'Line Chart' },
  { id: 'pie', name: 'Pie Chart' },
  { id: 'radar', name: 'Radar' }
]
</script>

<template>
  <div class="h-full flex flex-col bg-[#FAFBFF]">
    <div class="p-6 md:p-8 border-b border-slate-100 flex-1 overflow-auto custom-scrollbar">
      
      <!-- Engine Selector -->
      <section class="mb-10">
        <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <AdjustmentsHorizontalIcon class="w-4 h-4 text-indigo-500" />
          Visualization Engine
        </h3>
        
        <div class="grid grid-cols-1 gap-3">
          <button 
            v-for="eng in engines" :key="eng.id"
            @click="emit('update:engine', eng.id)"
            class="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all relative overflow-hidden group"
            :class="engine === eng.id ? 'border-indigo-500 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'"
          >
            <!-- Active Indicator -->
            <div v-if="engine === eng.id" class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
            
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                 :class="engine === eng.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-500'">
              <component :is="eng.icon" class="w-6 h-6" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-800" :class="engine === eng.id ? 'text-indigo-900' : ''">{{ eng.name }}</h4>
              <p class="text-xs font-medium text-slate-400 mt-0.5">{{ eng.desc }}</p>
            </div>
          </button>
        </div>
      </section>

      <!-- Advanced Configuration -->
      <section>
        <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <PaintBrushIcon class="w-4 h-4 text-indigo-500" />
          Appearance Settings
        </h3>
        
        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-6">
          
          <!-- Map Settings -->
          <template v-if="engine === 'map'">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Map Template</label>
              <select 
                :value="config.mapTemplate"
                @change="e => emit('update:config', { ...config, mapTemplate: e.target.value })"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all mb-4"
              >
                <option v-for="m in maps" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>

              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Heatmap Column</label>
              <select 
                :value="config.heatValueCol"
                @change="e => emit('update:config', { ...config, heatValueCol: e.target.value })"
                class="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option v-if="Object.keys(config.seriesColors).length === 0" value="">Assign Value roles first</option>
                <option v-for="(_, col) in config.seriesColors" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
            
            <div class="pt-4 border-t border-slate-100">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Heatmap Color Scale</label>
              <div class="flex items-center gap-3">
                <div class="flex-1 flex flex-col gap-1.5">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Min Value</span>
                  <div class="relative">
                    <input type="color" :value="config.heatMin" @input="e => emit('update:config', { ...config, heatMin: e.target.value })" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div class="h-10 rounded-xl border-2 border-slate-100 flex items-center px-3 gap-2" :style="{ backgroundColor: config.heatMin + '20' }">
                      <div class="w-4 h-4 rounded-full border border-black/10 shadow-inner" :style="{ backgroundColor: config.heatMin }"></div>
                      <span class="text-xs font-bold text-slate-600 font-mono uppercase">{{ config.heatMin }}</span>
                    </div>
                  </div>
                </div>
                <!-- Gradient Arrow -->
                <div class="w-6 shrink-0 flex items-center justify-center mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <span class="text-[10px] font-bold text-slate-400 uppercase text-right">Max Value</span>
                  <div class="relative">
                    <input type="color" :value="config.heatMax" @input="e => emit('update:config', { ...config, heatMax: e.target.value })" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div class="h-10 rounded-xl border-2 border-slate-100 flex items-center px-3 gap-2 justify-end" :style="{ backgroundColor: config.heatMax + '20' }">
                      <span class="text-xs font-bold text-slate-600 font-mono uppercase">{{ config.heatMax }}</span>
                      <div class="w-4 h-4 rounded-full border border-black/10 shadow-inner" :style="{ backgroundColor: config.heatMax }"></div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Preview Gradient -->
              <div class="h-3 rounded-full w-full mt-4 bg-slate-100 shadow-inner" :style="{ background: `linear-gradient(to right, ${config.heatMin}, ${config.heatMax})` }"></div>
            </div>
          </template>

          <!-- Chart Settings -->
          <template v-else-if="engine === 'chart'">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Width</label>
                <input 
                  type="text" 
                  :value="config.chartWidth"
                  @input="e => emit('update:config', { ...config, chartWidth: e.target.value })"
                  placeholder="100% or 600px"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Height</label>
                <input 
                  type="text" 
                  :value="config.chartHeight"
                  @input="e => emit('update:config', { ...config, chartHeight: e.target.value })"
                  placeholder="400px"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chart Layout</label>
              <select 
                :value="config.chartType"
                @change="e => emit('update:config', { ...config, chartType: e.target.value })"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option v-for="c in chartTypes" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            
            <div class="pt-4 border-t border-slate-100 space-y-4">
               <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Series Styling</label>
               <div v-if="Object.keys(config.seriesColors).length === 0" class="text-[10px] text-slate-400 italic">
                 Assign 'Value' role to columns in the data table to add series.
               </div>
               <div v-for="(color, colName) in config.seriesColors" :key="colName" class="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-dotted border-slate-200">
                 <div class="relative w-8 h-8 shrink-0">
                    <input type="color" :value="color" @input="e => {
                      const newColors = { ...config.seriesColors, [colName]: e.target.value };
                      emit('update:config', { ...config, seriesColors: newColors });
                    }" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div class="w-full h-full rounded-lg border border-black/10 shadow-inner" :style="{ backgroundColor: color }"></div>
                 </div>
                 <div class="min-w-0 flex-1">
                   <p class="text-[10px] font-black text-slate-400 uppercase truncate">{{ colName }}</p>
                   <p class="text-[11px] font-mono font-bold text-slate-600 uppercase">{{ color }}</p>
                 </div>
               </div>
            </div>
          </template>

          <template v-else>
            <div class="text-center py-6 text-slate-400">
              <PhotoIcon class="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p class="text-sm font-bold">Configure Image & Hotspots in the Canvas Maker.</p>
            </div>
          </template>

        </div>
      </section>

    </div>
    
    <!-- Action Area -->
    <div class="p-6 md:p-8 bg-white border-t border-slate-100">
      <button 
        @click="emit('generate')"
        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
        </svg>
        Generate Visual
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>

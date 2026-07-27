<script setup>
import {
  MapIcon,
  ChartPieIcon,
  PaintBrushIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
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
  { id: 'chart', name: 'Data Chart', icon: ChartPieIcon, desc: 'Bar, Pie, Radar, etc.' }
]

const maps = [
  { id: 'hu-counties', name: 'Hungary (Counties)' },
  { id: 'de-states', name: 'Germany (States)' },
  { id: 'fr-regions', name: 'France (Regions)' },
  { id: 'it-regions', name: 'Italy (Regions)' },
  { id: 'es-regions', name: 'Spain (Regions)' },
  { id: 'pl-voivodeships', name: 'Poland (Voivodeships)' },
  { id: 'ro-regions', name: 'Romania (Regions)' },
  { id: 'nl-provinces', name: 'Netherlands (Provinces)' },
  { id: 'at-states', name: 'Austria (States)' },
  { id: 'usa-high-res', name: 'USA States' },
  { id: 'eu', name: 'European Union' },
  { id: 'africa', name: 'Africa' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'australia', name: 'Australia States' },
  { id: 'world', name: 'World Map' }
]

const chartTypes = [
  { id: 'bar', name: 'Bar Chart' },
  { id: 'line', name: 'Line Chart' },
  { id: 'pie', name: 'Pie Chart' },
  { id: 'doughnut', name: 'Doughnut Chart' },
  { id: 'radar', name: 'Radar' }
]

const numberFormatTypes = [
  { id: 'thousands', name: 'Ezres tagolás (1 234)' },
  { id: 'plain', name: 'Sima szám' },
  { id: 'percent', name: 'Százalék (%)' },
  { id: 'currency', name: 'Pénznem (Ft)' }
]

const palettes = [
  { name: 'Indigo', colors: ['#eef2ff', '#6366f1', '#f97316', '#14b8a6', '#a855f7'] },
  { name: 'Óceán', colors: ['#f0f9ff', '#0ea5e9', '#0891b2', '#0284c7', '#075985'] },
  { name: 'Naplemente', colors: ['#fff7ed', '#f97316', '#ef4444', '#f59e0b', '#dc2626'] },
  { name: 'Erdő', colors: ['#f0fdf4', '#16a34a', '#14b8a6', '#65a30d', '#059669'] },
  { name: 'Bogyó', colors: ['#fdf4ff', '#a855f7', '#ec4899', '#8b5cf6', '#d946ef'] },
  { name: 'Monokróm', colors: ['#f8fafc', '#0f172a', '#475569', '#94a3b8', '#1e293b'] }
]

function updateConfig(patch) {
  emit('update:config', { ...props.config, ...patch })
}

function applyPalette(palette) {
  if (props.engine === 'map') {
    updateConfig({ heatMin: palette.colors[0], heatMax: palette.colors[1] })
  } else {
    const cols = Object.keys(props.config.seriesColors || {})
    const newColors = {}
    cols.forEach((col, i) => { newColors[col] = palette.colors[(i % (palette.colors.length - 1)) + 1] })
    updateConfig({ seriesColors: newColors })
  }
}

function updateNumberFormat(patch) {
  updateConfig({ numberFormat: { ...(props.config.numberFormat || {}), ...patch } })
}
</script>

<template>
  <div class="h-full flex flex-col bg-[#FAFBFF]">
    <div class="p-6 md:p-8 border-b border-slate-100 flex-1 overflow-auto custom-scrollbar">

      <!-- Content Fields -->
      <section class="mb-10">
        <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <DocumentTextIcon class="w-4 h-4 text-indigo-500" />
          Tartalom
        </h3>
        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
          <input
            type="text"
            :value="config.title"
            @input="e => updateConfig({ title: e.target.value })"
            placeholder="Cím"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="text"
            :value="config.subtitle"
            @input="e => updateConfig({ subtitle: e.target.value })"
            placeholder="Alcím"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="text"
            :value="config.legendLabel"
            @input="e => updateConfig({ legendLabel: e.target.value })"
            placeholder="Jelmagyarázat felirata"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="text"
            :value="config.source"
            @input="e => updateConfig({ source: e.target.value })"
            placeholder="Forrás megjelölése (pl. KSH, 2026)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </section>

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

          <!-- Palette Quick-Picker -->
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Színpaletta</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="p in palettes" :key="p.name"
                @click="applyPalette(p)"
                :title="p.name"
                class="flex rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-all h-7 w-16"
              >
                <span v-for="c in p.colors.slice(1)" :key="c" class="flex-1 h-full" :style="{ backgroundColor: c }"></span>
              </button>
            </div>
          </div>

          <!-- Number Format -->
          <div class="pt-4 border-t border-slate-100">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Számformátum</label>
            <select
              :value="config.numberFormat?.type"
              @change="e => updateNumberFormat({ type: e.target.value })"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 mb-2"
            >
              <option v-for="nf in numberFormatTypes" :key="nf.id" :value="nf.id">{{ nf.name }}</option>
            </select>
            <div class="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0" max="4"
                :value="config.numberFormat?.decimals"
                @input="e => updateNumberFormat({ decimals: e.target.value === '' ? null : Number(e.target.value) })"
                placeholder="Tizedesjegyek"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                type="text"
                :value="config.numberFormat?.suffix"
                @input="e => updateNumberFormat({ suffix: e.target.value })"
                placeholder="Utótag (pl. kg)"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

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

        </div>
      </section>

      <!-- Export Settings -->
      <section class="mt-8">
        <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ArrowDownTrayIcon class="w-4 h-4 text-indigo-500" />
          Export
        </h3>
        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Kimenet tömörítése (minify)</span>
          <button
            @click="updateConfig({ minifyExport: !config.minifyExport })"
            class="w-11 h-6 rounded-full transition-colors relative shrink-0"
            :class="config.minifyExport ? 'bg-indigo-600' : 'bg-slate-200'"
          >
            <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" :class="config.minifyExport ? 'translate-x-5' : 'translate-x-0.5'"></span>
          </button>
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

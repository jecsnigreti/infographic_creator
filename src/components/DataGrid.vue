<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  mapping: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update-mapping'])

const mappingOptions = [
  { value: 'label', label: 'X-Axis / Label' },
  { value: 'value', label: 'Y-Axis / Value' },
  { value: 'geoId', label: 'Geo ID' },
  { value: 'meta', label: 'Metadata' }
]

const truncate = (text, length = 30) => {
  const str = String(text)
  return str.length > length ? str.substring(0, length) + '...' : str
}

// Ensure the grid doesn't break browser memory on huge datasets
const previewData = computed(() => {
  return props.data.slice(0, 100) // Preview first 100 rows
})
const isRoleActive = (column, role) => {
  const roles = props.mapping[column] || []
  return roles.includes(role)
}
</script>

<template>
  <div class="w-full bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
    <!-- Grid Header / Tools -->
    <div class="px-6 py-4 flex items-center justify-between border-b border-slate-50 bg-[#FAFBFF]">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest pl-1">Data Model</h3>
          <p class="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest pl-1">Total Rows: {{ data.length }}</p>
        </div>
      </div>
      <button 
        @click="$emit('transpose')"
        class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span class="text-[10px] font-black uppercase tracking-widest">Transpose</span>
      </button>
    </div>

    <!-- Table Container -->
    <div class="flex-1 overflow-auto custom-scrollbar">
      <table class="w-full text-left text-sm whitespace-nowrap">
        <thead class="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <!-- Data Column Names -->
          <tr>
            <th class="w-12 px-4 py-3 border-b border-slate-100 bg-slate-50 text-slate-400 font-bold text-center border-r">#</th>
            <th 
              v-for="col in columns" 
              :key="'header-'+col" 
              class="px-5 py-4 border-b border-slate-100 font-black text-slate-800 tracking-tight"
            >
              {{ truncate(col, 25) }}
            </th>
          </tr>
          
          <!-- Mapping Selectors -->
          <tr>
            <th class="border-b-2 border-slate-200 bg-slate-50/50 border-r border-slate-100"></th>
            <th 
              v-for="col in columns" 
              :key="'map-'+col" 
              class="px-3 py-2 border-b-2 border-slate-200 bg-slate-50/50 min-w-[200px]"
            >
              <div class="flex flex-wrap gap-1 mt-1">
                <button 
                  v-for="opt in mappingOptions" 
                  :key="opt.value"
                  @click="emit('update-mapping', col, opt.value)"
                  class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all border whitespace-nowrap"
                  :class="isRoleActive(col, opt.value) 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'"
                >
                  {{ opt.label }}
                </button>
              </div>
            </th>
          </tr>
        </thead>
        
        <tbody class="divide-y divide-slate-50">
          <tr v-for="(row, idx) in previewData" :key="idx" class="hover:bg-slate-50/50 transition-colors">
            <td class="px-4 py-3 text-xs font-bold text-slate-300 text-center border-r border-slate-100">{{ idx + 1 }}</td>
            <td 
              v-for="col in columns" 
              :key="'cell-'+idx+'-'+col" 
              class="px-5 py-3 text-slate-600 max-w-[300px] truncate"
            >
              {{ row[col] }}
            </td>
          </tr>
          <tr v-if="data.length > 100">
            <td :colspan="columns.length + 1" class="px-5 py-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50">
              Showing 100 of {{ data.length }} rows. Preview limited for performance.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f8fafc;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

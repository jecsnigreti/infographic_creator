<script setup>
import { ref, reactive, computed } from 'vue'
import NavigationSidebar from './components/NavigationSidebar.vue'
import TopNavBar from './components/TopNavBar.vue'
import CanvasArea from './components/CanvasArea.vue'
import EditorSidebar from './components/EditorSidebar.vue'
import DataLoader from './components/DataLoader.vue'
import DataGrid from './components/DataGrid.vue'
import VisualConfigSidebar from './components/VisualConfigSidebar.vue'
import { generateWPCode, generateDataVisualCode } from './utils/exporter.js'

const activeView = ref('canvas')
const activeDatabase = ref(null) // Holds { filename, data, columns }
const dataMapping = reactive({}) // Holds column -> array of roles ['label', 'geoId']

const visualEngine = ref('map')
const engineConfig = reactive({
  mapTemplate: 'hu-counties',
  heatMin: '#e2e8f0', // slate-200
  heatMax: '#4f46e5', // indigo-600
  chartType: 'bar',
  chartColor: '#4f46e5', // legacy/fallback
  chartWidth: '100%',
  chartHeight: '400px',
  seriesColors: {} // mapping of colName -> color hex
})

const handleDataLoaded = (payload) => {
  activeDatabase.value = payload
  // Auto-map based on common heuristics (optional, can just init empty)
  payload.columns.forEach(col => {
    const lower = col.toLowerCase()
    // More specific mapping to avoid "Megye" being both label and geoId by default
    if (lower.includes('név') || lower === 'nev') dataMapping[col] = ['label']
    else if (lower.includes('value') || lower.includes('érték') || lower.includes('gdp') || lower.includes('lélek')) {
      dataMapping[col] = ['value']
      if (!engineConfig.heatValueCol) engineConfig.heatValueCol = col
    }
    else if (lower.includes('geo') || lower.includes('megye') || lower === 'id') dataMapping[col] = ['geoId', 'label']
    else dataMapping[col] = []
  })
}

const handleMappingUpdate = (column, role) => {
  if (!dataMapping[column]) dataMapping[column] = []
  
  const idx = dataMapping[column].indexOf(role)
  if (idx > -1) {
    dataMapping[column].splice(idx, 1)
  } else {
    dataMapping[column].push(role)
  }
  
  // If mapped to value, ensure it has a color entry and set as heat source if none exists
  if (role === 'value' && dataMapping[column].includes('value')) {
    if (!engineConfig.seriesColors[column]) {
      engineConfig.seriesColors[column] = '#4f46e5'
    }
    if (!engineConfig.heatValueCol) {
      engineConfig.heatValueCol = column
    }
  }
}

const baseImage = ref(null)
const hotspots = reactive([])
const selectedHotspotId = ref(null)
const generatedCode = ref('')
const showModal = ref(false)

const globalConfig = reactive({
  themeColor: '#4f46e5',
  pulseAnimation: true,
  popupAnimation: 'zoom', // fade, slide, zoom
  finalImageUrl: '',
  minifyExport: false
})

const handleImageUpload = (url) => {
  baseImage.value = url
}

const addHotspot = ({ x, y }) => {
  const id = `node_${Date.now()}`
  hotspots.push({
    id,
    x,
    y,
    title: 'New Hotspot',
    content: 'Add description here... HTML supported.',
    link: '',
    cta: 'Learn More',
    color: globalConfig.themeColor,
    icon: 'plus', // Default icon identifier
    mediaUrl: ''
  })
  selectedHotspotId.value = id
}

const updateHotspot = (id, data) => {
  const index = hotspots.findIndex(h => h.id === id)
  if (index !== -1) {
    hotspots[index] = { ...hotspots[index], ...data }
  }
}

const deleteHotspot = (id) => {
  const index = hotspots.findIndex(h => h.id === id)
  if (index !== -1) {
    hotspots.splice(index, 1)
    if (selectedHotspotId.value === id) selectedHotspotId.value = null
  }
}

const selectedHotspot = computed(() => 
  hotspots.find(h => h.id === selectedHotspotId.value)
)

const isSidebarOpen = ref(false)

const handleGenerate = () => {
  if (activeView.value === 'canvas') {
    if (!baseImage.value) return alert('Please upload an image first!')
    const imageUrl = globalConfig.finalImageUrl || baseImage.value
    generatedCode.value = generateWPCode(hotspots, globalConfig, imageUrl)
    showModal.value = true
  } else if (activeView.value === 'database') {
    if (!activeDatabase.value) return alert('Please drop a Database file first!')
    
    // Using the new data generator from exporter.js
    generatedCode.value = generateDataVisualCode(
      activeDatabase.value,
      dataMapping,
      visualEngine.value,
      engineConfig
    )
    showModal.value = true
  }
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(generatedCode.value)
  alert('Code copied to clipboard!')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#F4F7FE] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Mobile Sidebar Backdrop -->
    <div 
      v-if="isSidebarOpen" 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
      @click="isSidebarOpen = false"
    ></div>

    <NavigationSidebar 
      :is-open="isSidebarOpen"
      :active-view="activeView"
      @navigate="view => activeView = view"
      @close="isSidebarOpen = false"
      class="fixed inset-y-0 left-0 z-50 lg:static transform transition-transform duration-300 lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    />

    <div class="flex-1 flex flex-col min-w-0">
      <TopNavBar :title="activeView === 'database' ? 'Database Source' : 'UI Builder'" @generate="handleGenerate" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

      <!-- Main Dashboard Area -->
      <main class="flex-1 overflow-auto p-4 md:p-8 pt-0 relative space-y-6 md:space-y-8 flex flex-col">
        <!-- Stats Row (FINDASH Style) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0">
          <div v-for="stat in [
            { label: 'Active View', val: activeView.toUpperCase(), icon: 'SquaresPlus' },
            { label: 'Data Rows', val: activeDatabase ? activeDatabase.data.length : '0', icon: 'CommandLine' },
            { label: 'Mapped Cols', val: Object.values(dataMapping).filter(roles => roles && roles.length > 0).length, icon: 'Eye' },
            { label: 'Engine Status', val: 'Active', icon: 'CircleStack' }
          ]" :key="stat.label" class="bg-white rounded-3xl p-5 md:p-6 flex items-center gap-4 md:gap-5 border border-slate-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              <span class="font-black text-lg">#</span>
            </div>
            <div class="min-w-0">
              <p class="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 md:mb-1.5 truncate">{{ stat.label }}</p>
              <h4 class="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-none truncate">{{ stat.val }}</h4>
            </div>
          </div>
        </div>

        <div v-if="activeView === 'database'" class="w-full flex-1 min-h-[500px] flex">
           <!-- Database View -->
          <div v-if="!activeDatabase" class="flex-1 flex items-center justify-center pointer-events-auto">
             <DataLoader @data-loaded="handleDataLoaded" />
          </div>
          <div v-else class="flex-1 flex flex-col lg:flex-row min-h-0 gap-6">
             
             <!-- Data Grid Panel -->
             <div class="flex-1 bg-white rounded-[2rem] border border-slate-50 shadow-sm flex flex-col overflow-hidden relative min-h-[400px]">
               <DataGrid 
                 :data="activeDatabase.data"
                 :columns="activeDatabase.columns"
                 :mapping="dataMapping"
                 @update-mapping="handleMappingUpdate"
               />
               
               <!-- Reset DB logic -->
               <button 
                 @click="activeDatabase = null" 
                 class="absolute bottom-6 right-6 bg-white/80 backdrop-blur text-rose-500 hover:text-white hover:bg-rose-500 px-4 py-2 border border-rose-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm z-50">
                 Reset DB
               </button>
             </div>

             <!-- Engine Configurator -->
             <div class="w-full lg:w-[380px] min-h-[500px] lg:min-h-0 bg-white rounded-[2rem] border border-slate-50 shadow-sm flex flex-col overflow-hidden shrink-0">
               <VisualConfigSidebar 
                 :engine="visualEngine"
                 :config="engineConfig"
                 @update:engine="val => visualEngine = val"
                 @update:config="val => Object.assign(engineConfig, val)"
                 @generate="handleGenerate"
               />
             </div>
          </div>
        </div>

        <!-- Canvas View -->
        <div v-else class="max-w-[1600px] mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 md:gap-8 pb-12">
          
          <!-- Canvas Container Card -->
          <div class="flex-1 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col overflow-hidden min-h-[400px] md:min-h-[600px]">
            <!-- Card Header -->
            <div class="px-6 md:px-10 py-5 border-b border-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Interactive Canvas</h3>
                  <p class="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-0.5">Asset Workspace</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="hotspots.length = 0" class="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">Reset</button>
              </div>
            </div>

            <div class="flex-1 flex items-center justify-center p-4 md:p-12 relative bg-[#FAFBFF]/50 overflow-auto">
              <CanvasArea 
                :image="baseImage"
                :hotspots="hotspots"
                :selected-id="selectedHotspotId"
                :theme-color="globalConfig.themeColor"
                :pulse="globalConfig.pulseAnimation"
                @upload="handleImageUpload"
                @add="addHotspot"
                @select="id => selectedHotspotId = id"
              />
              
              <!-- Empty State -->
              <div v-if="!baseImage" class="absolute inset-0 flex flex-col items-center justify-center text-slate-200 pointer-events-none p-6 md:p-12 text-center">
                <div class="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center mb-6 md:mb-8 border border-slate-50 shadow-sm italic font-serif text-5xl md:text-6xl text-slate-100 rotate-6 select-none">?</div>
                <h4 class="text-xl md:text-2xl font-black text-slate-300 tracking-tight">System Awaiting Asset</h4>
                <p class="text-slate-200 mt-2 max-w-sm text-xs md:text-sm font-medium">Inject your visual data block to begin coordinate mapping.</p>
              </div>
            </div>
          </div>

          <!-- Properties Pane (FINDASH Sub-Dashboard) -->
          <div class="w-full lg:w-[420px] min-h-[500px] lg:min-h-0 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col overflow-hidden shrink-0">
            <EditorSidebar 
              :hotspots="hotspots"
              :selected-hotspot="selectedHotspot"
              :config="globalConfig"
              @update-hotspot="updateHotspot"
              @delete-hotspot="deleteHotspot"
              @update-config="e => Object.assign(globalConfig, e)"
              @generate="handleGenerate"
            />
          </div>
        </div>
      </main>
    </div>

    <!-- Export Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      <div class="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden">
        <div class="p-8 border-b border-slate-50 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-slate-900">WordPress Ready Code</h2>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-auto p-8 bg-slate-50/50">
          <div class="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col gap-3 text-blue-800">
            <div class="flex gap-3 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <h4 class="text-sm font-bold m-0 tracking-tight">How to embed this infographic</h4>
            </div>
            <ol class="list-decimal list-outside text-sm space-y-1.5 ml-8 mt-1 font-medium">
              <li>In your WordPress editor (Gutenberg), add a <strong>Custom HTML</strong> block.</li>
              <li>Paste the generated code below completely into that block.</li>
              <li>Save or preview your page to see the interactive features.</li>
            </ol>
          </div>
          <div class="relative group">
            <pre class="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-[13px] font-mono overflow-auto whitespace-pre-wrap max-h-[400px] text-blue-300 shadow-inner text-left">{{ generatedCode }}</pre>
            <button 
              @click="copyToClipboard"
              class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm transition-all border border-white/10"
            >
              Copy
            </button>
          </div>
        </div>
        <div class="p-8 border-t border-slate-50 bg-white flex gap-4">
      <div class="p-8 border-t border-slate-50 bg-slate-50 flex gap-4 items-center">
        <button 
          @click="copyToClipboard"
          class="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95"
        >
          Copy Generated Code
        </button>
        <button 
          @click="showPreview = !showPreview"
          class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95"
        >
          {{ showPreview ? 'Hide' : 'Show' }} Preview
        </button>
        <button 
          @click="showModal = false"
          class="px-10 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
        >
          Close
        </button>
      </div>
      <div v-if="showPreview" class="p-8 bg-white border-t border-slate-50 overflow-auto max-h-[400px]">
        <div v-html="generatedCode" class="preview-content"></div>
      </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Scoped overrides if needed */
</style>

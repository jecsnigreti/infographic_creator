<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import TopNavBar from './components/TopNavBar.vue'
import DataLoader from './components/DataLoader.vue'
import DataGrid from './components/DataGrid.vue'
import VisualConfigSidebar from './components/VisualConfigSidebar.vue'
import AuthCard from './components/AuthCard.vue'
import { generateDataVisualCode, generateWordPressSafeMapCode } from './utils/exporter.js'
import { suggestMapping } from './utils/typeDetect.js'
import { exportPng, exportSvgFromIframe } from './utils/pngExport.js'

const currentUser = ref(null)
const loadingUser = ref(true)

const checkSession = async () => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    loadingUser.value = false
    return
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      currentUser.value = data.user
    } else {
      localStorage.removeItem('authToken')
    }
  } catch (err) {
    const mockSession = localStorage.getItem('mockUserSession')
    if (mockSession) {
      currentUser.value = JSON.parse(mockSession)
    } else {
      localStorage.removeItem('authToken')
    }
  } finally {
    loadingUser.value = false
  }
}

checkSession()

const handleAuthSuccess = (user) => {
  currentUser.value = user
}

const handleLogout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('mockUserSession')
  currentUser.value = null
}

const activeDatabase = ref(null) // Holds { filename, data, columns }
const dataMapping = reactive({}) // Holds column -> array of roles ['label', 'geoId']

const visualEngine = ref('map')
const engineConfig = reactive({
  title: '',
  subtitle: '',
  source: '',
  legendLabel: '',
  mapTemplate: 'hu-counties',
  heatMin: '#f8fafc',
  heatMax: '#06b6d4',
  chartType: 'bar',
  chartWidth: '100%',
  chartHeight: '400px',
  seriesColors: {}, // mapping of colName -> color hex
  numberFormat: { type: 'thousands', decimals: null, suffix: '' },
  minifyExport: false
})

const handleDataLoaded = (payload) => {
  activeDatabase.value = payload

  Object.keys(dataMapping).forEach(key => delete dataMapping[key])
  Object.keys(engineConfig.seriesColors).forEach(key => delete engineConfig.seriesColors[key])
  engineConfig.heatValueCol = ''

  // Real column-type inference (number/percent/date/geo/text) drives the initial role suggestion.
  const { mapping: suggested } = suggestMapping(payload.columns, payload.data)
  payload.columns.forEach(col => {
    dataMapping[col] = suggested[col] || []
    if (dataMapping[col].includes('value')) {
      engineConfig.seriesColors[col] = '#06b6d4'
      if (!engineConfig.heatValueCol) engineConfig.heatValueCol = col
    }
  })
}

const handleCellUpdate = (idx, col, value) => {
  if (!activeDatabase.value) return
  activeDatabase.value.data[idx][col] = value
}

const handleAddRow = () => {
  if (!activeDatabase.value) return
  const blank = {}
  activeDatabase.value.columns.forEach(c => { blank[c] = '' })
  activeDatabase.value.data.push(blank)
}

const handleRemoveRow = (idx) => {
  if (!activeDatabase.value) return
  activeDatabase.value.data.splice(idx, 1)
}

const handleAddColumn = () => {
  if (!activeDatabase.value) return
  let n = activeDatabase.value.columns.length + 1
  let name = `Oszlop ${n}`
  while (activeDatabase.value.columns.includes(name)) { n++; name = `Oszlop ${n}` }
  activeDatabase.value.columns.push(name)
  activeDatabase.value.data.forEach(row => { row[name] = '' })
}

const handleRemoveColumn = (col) => {
  if (!activeDatabase.value) return
  activeDatabase.value.columns = activeDatabase.value.columns.filter(c => c !== col)
  activeDatabase.value.data.forEach(row => { delete row[col] })
  delete dataMapping[col]
  delete engineConfig.seriesColors[col]
  if (engineConfig.heatValueCol === col) engineConfig.heatValueCol = ''
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
      engineConfig.seriesColors[column] = '#06b6d4'
    }
    if (!engineConfig.heatValueCol) {
      engineConfig.heatValueCol = column
    }
  }
}

const handleTranspose = () => {
  if (!activeDatabase.value) return

  const originalData = activeDatabase.value.data
  const originalColumns = activeDatabase.value.columns

  // Create a 2D matrix including headers as the first column/row
  // illustrator style:
  // [Col1, Col2]
  // [R1C1, R1C2]
  // becomes
  // [Col1, R1C1]
  // [Col2, R1C2]

  const matrix = [
    originalColumns,
    ...originalData.map(row => originalColumns.map(col => row[col]))
  ]

  const transposedMatrix = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]))

  // New columns are the first row of the transposed matrix
  const newColumns = transposedMatrix[0].map(val => String(val))

  // New data rows
  const newData = transposedMatrix.slice(1).map(row => {
    const obj = {}
    newColumns.forEach((col, idx) => {
      obj[col] = row[idx]
    })
    return obj
  })

  // Update original columns for display
  activeDatabase.value = {
    ...activeDatabase.value,
    columns: newColumns,
    data: newData
  }

  // Clear mapping because columns changed
  Object.keys(dataMapping).forEach(key => delete dataMapping[key])

  // Re-run heuristics
  handleDataLoaded(activeDatabase.value)
}

const generatedCode = ref('')
const showModal = ref(false)
const showPreview = ref(false)
const previewIframe = ref(null)
const isExportingPng = ref(false)
const exportMode = ref('script') // 'script' | 'wp-safe'
const wpImageUrl = ref('')
const lastSnapshot = ref(null) // { database, mapping, config } frozen at generate time

const handleGenerate = () => {
  if (!activeDatabase.value) return alert('Please drop a Database file first!')

  lastSnapshot.value = {
    database: JSON.parse(JSON.stringify(activeDatabase.value)),
    mapping: JSON.parse(JSON.stringify(dataMapping)),
    config: JSON.parse(JSON.stringify(engineConfig))
  }

  generatedCode.value = generateDataVisualCode(
    activeDatabase.value,
    dataMapping,
    visualEngine.value,
    engineConfig
  )
  exportMode.value = 'script'
  wpImageUrl.value = ''
  showModal.value = true
}

const wpSafeCode = computed(() => {
  if (!lastSnapshot.value) return ''
  return generateWordPressSafeMapCode(lastSnapshot.value.database, lastSnapshot.value.mapping, lastSnapshot.value.config, wpImageUrl.value)
})

const codeToShow = computed(() => exportMode.value === 'wp-safe' ? wpSafeCode.value : generatedCode.value)

const copyToClipboard = () => {
  navigator.clipboard.writeText(codeToShow.value)
  alert('Code copied to clipboard!')
}
const isMapExport = computed(() => visualEngine.value === 'map')

const stats = computed(() => [
  { label: 'Data Rows', val: activeDatabase.value ? activeDatabase.value.data.length : '0' },
  { label: 'Mapped Cols', val: Object.values(dataMapping).filter(roles => roles && roles.length > 0).length },
  { label: 'Engine Status', val: 'Active' }
])
const handlePngExport = async (scale) => {
  isExportingPng.value = true
  try {
    // chartWidth is a CSS value for the responsive embed (e.g. "100%"), not a pixel size -
    // the export render always uses a fixed capture width regardless of that setting.
    await exportPng(generatedCode.value, { width: 1000, scale, filename: `infografika-${scale}x.png` })
  } catch (err) {
    alert('PNG export sikertelen: ' + err.message)
  } finally {
    isExportingPng.value = false
  }
}

const handleSvgExport = async () => {
  try {
    if (!showPreview.value) {
      showPreview.value = true
      await nextTick()
      await new Promise(resolve => {
        const iframe = previewIframe.value
        if (!iframe) return resolve()
        iframe.addEventListener('load', resolve, { once: true })
        setTimeout(resolve, 2000)
      })
    }
    exportSvgFromIframe(previewIframe.value, 'infografika.svg')
  } catch (err) {
    alert(err.message)
  }
}
</script>

<template>
  <div v-if="loadingUser" class="min-h-screen w-full flex items-center justify-center bg-[#0F172A] text-white font-sans">
    <div class="flex flex-col items-center gap-3">
      <div class="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Betöltés...</p>
    </div>
  </div>
  <div v-else-if="!currentUser">
    <AuthCard @auth-success="handleAuthSuccess" />
  </div>
  <div v-else class="flex h-screen overflow-hidden bg-[#F4F7FE] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <div class="flex-1 flex flex-col min-w-0">
      <TopNavBar title="Database Source" :currentUser="currentUser" @generate="handleGenerate" @logout="handleLogout" />

      <!-- Main Dashboard Area -->
      <main class="flex-1 overflow-auto p-4 md:p-8 pt-0 relative space-y-6 md:space-y-8 flex flex-col">
        <!-- Stats Row (FINDASH Style) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 shrink-0">
          <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-3xl p-5 md:p-6 flex items-center gap-4 md:gap-5 border border-slate-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              <span class="font-black text-lg">#</span>
            </div>
            <div class="min-w-0">
              <p class="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 md:mb-1.5 truncate">{{ stat.label }}</p>
              <h4 class="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-none truncate">{{ stat.val }}</h4>
            </div>
          </div>
        </div>

        <div class="w-full flex-1 min-h-[500px] flex">
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
                  @transpose="handleTranspose"
                  @update-cell="handleCellUpdate"
                  @add-row="handleAddRow"
                  @remove-row="handleRemoveRow"
                  @add-column="handleAddColumn"
                  @remove-column="handleRemoveColumn"
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
                 @update:engine="visualEngine = $event"
                 @update:config="Object.assign(engineConfig, $event)"
                 @generate="handleGenerate"
               />
             </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Export Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      <div class="bg-white rounded-[2.5rem] w-full shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden transition-all" :class="showPreview ? 'max-w-6xl' : 'max-w-2xl'">
        <div class="p-8 border-b border-slate-50 flex justify-between items-center shrink-0">
          <h2 class="text-2xl font-bold text-slate-900">{{ exportMode === 'wp-safe' ? 'WordPress-safe Export (JS nélkül)' : 'WordPress Ready Code' }}</h2>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="isMapExport" class="px-8 pt-6 flex gap-2 shrink-0">
          <button
            @click="exportMode = 'script'"
            class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            :class="exportMode === 'script' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'"
          >
            Interaktív kód (JS)
          </button>
          <button
            @click="exportMode = 'wp-safe'"
            class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            :class="exportMode === 'wp-safe' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'"
          >
            WordPress-safe (JS nélkül)
          </button>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          <!-- Code Panel -->
          <div class="flex-1 overflow-auto p-8 bg-slate-50/50 min-w-0" :class="showPreview ? 'md:w-1/2' : 'w-full'">
            <div v-if="exportMode === 'wp-safe'" class="mb-6 p-5 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col gap-3 text-amber-900">
              <div class="flex gap-3 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <h4 class="text-sm font-bold m-0 tracking-tight">Ez a verzió nem tartalmaz &lt;script&gt; taget</h4>
              </div>
              <ol class="list-decimal list-outside text-sm space-y-2 ml-8 mt-1 font-medium">
                <li>Töltsd le a térkép képét: <button @click="handlePngExport(2)" :disabled="isExportingPng" class="underline font-bold disabled:opacity-50">Kép letöltése (2x)</button></li>
                <li>Töltsd fel ezt a képet a WordPress Média könyvtárba, majd másold ki a feltöltött kép URL-jét.</li>
                <li>Illeszd be az URL-t az alábbi mezőbe — a kód automatikusan frissül.</li>
                <li>Másold ki a kódot, és illeszd be bármelyik WordPress-blokkba (akár sima bekezdésbe is) — nincs jogosultsági követelmény.</li>
              </ol>
              <input
                v-model="wpImageUrl"
                type="text"
                placeholder="https://sajat-wordpress-oldalad.hu/wp-content/uploads/.../terkep.png"
                class="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div v-else class="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col gap-3 text-blue-800">
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
              <pre class="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-[13px] font-mono overflow-auto whitespace-pre-wrap text-blue-300 shadow-inner text-left">{{ codeToShow }}</pre>
              <button
                @click="copyToClipboard"
                class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm transition-all border border-white/10"
              >
                Copy
              </button>
            </div>
          </div>

          <!-- Preview Panel -->
          <div v-if="showPreview" class="flex-1 md:w-1/2 min-w-0 border-t md:border-t-0 md:border-l border-slate-100 overflow-auto p-8 bg-white flex flex-col items-center">
            <div class="w-full border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden bg-white">
              <div class="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                 <div class="flex gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-rose-400"></div>
                    <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                 </div>
                 <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Live Preview Engine</span>
              </div>
              <iframe
                ref="previewIframe"
                :srcdoc="codeToShow"
                class="w-full min-h-[500px] border-none block"
                sandbox="allow-scripts allow-same-origin"
              ></iframe>
            </div>
          </div>
        </div>

        <div class="p-8 border-t border-slate-50 bg-slate-50 flex gap-4 items-center shrink-0">
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
            class="px-10 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-4 rounded-2xl transition-all"
          >
            Close
          </button>
        </div>

        <div class="px-8 pb-8 bg-white flex gap-3 flex-wrap shrink-0">
          <button
            @click="handlePngExport(1)"
            :disabled="isExportingPng"
            class="flex-1 min-w-[160px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            PNG letöltése (1x)
          </button>
          <button
            @click="handlePngExport(2)"
            :disabled="isExportingPng"
            class="flex-1 min-w-[160px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            PNG letöltése (2x, retina)
          </button>
          <button
            v-if="isMapExport && exportMode === 'script'"
            @click="handleSvgExport"
            class="flex-1 min-w-[160px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 rounded-xl transition-all"
          >
            SVG letöltése
          </button>
        </div>
    </div>
  </div>
  </div>
</template>

<style>
/* Scoped overrides if needed */
</style>

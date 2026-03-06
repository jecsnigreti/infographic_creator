<script setup>
import { ref } from 'vue'
import { read, utils } from 'xlsx'
import { DocumentArrowUpIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits(['data-loaded'])
const isDragging = ref(false)
const isLoading = ref(false)
const error = ref(null)

const handleDrop = async (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    await processFile(files[0])
  }
}

const handleFileSelect = async (e) => {
  const files = e.target.files
  if (files.length > 0) {
    await processFile(files[0])
  }
}

const processFile = async (file) => {
  isLoading.value = true
  error.value = null

  try {
    const data = await file.arrayBuffer()
    const workbook = read(data)
    
    // Convert first sheet to JSON
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = utils.sheet_to_json(worksheet, { defval: "" }) // defval ensures empty cells are included

    if (jsonData.length === 0) {
      throw new Error("No data found in the spreadsheet.")
    }

    emit('data-loaded', {
      filename: file.name,
      sheetName: firstSheetName,
      data: jsonData,
      columns: Object.keys(jsonData[0] || {})
    })
  } catch (err) {
    console.error("Error reading file:", err)
    error.value = err.message || "Failed to process the spreadsheet."
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <div 
      class="border-2 border-dashed rounded-[2rem] p-12 transition-all duration-300 group flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden"
      :class="isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop="handleDrop"
    >
      <input 
        type="file" 
        id="fileInput" 
        class="hidden" 
        accept=".xlsx, .xls, .csv" 
        @change="handleFileSelect"
      />
      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center animate-pulse">
        <div class="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p class="text-sm font-black text-slate-500 uppercase tracking-widest">Processing Data...</p>
      </div>

      <!-- Normal State -->
      <label v-else for="fileInput" class="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
        <div class="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 relative">
          <DocumentArrowUpIcon class="w-10 h-10" />
          <div v-if="isDragging" class="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-40"></div>
        </div>
        
        <h3 class="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight">Drop Database File</h3>
        <p class="text-sm font-medium text-slate-500 mb-6 max-w-xs leading-relaxed">
          Upload your Excel (.xlsx, .xls) or CSV file to begin visual generation.
        </p>
        
        <div class="px-6 py-2.5 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-100 uppercase tracking-widest text-[10px] group-hover:bg-slate-800 group-hover:text-white transition-colors">
          Browse Files
        </div>
      </label>

      <!-- Error State Overlay -->
      <div v-if="error" class="absolute inset-x-4 bottom-4 bg-rose-50 text-rose-600 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <div class="text-sm">
          <p class="font-bold">Import Error</p>
          <p class="opacity-90">{{ error }}</p>
        </div>
        <button @click.prevent="error = null" class="ml-auto p-1 hover:bg-rose-100 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

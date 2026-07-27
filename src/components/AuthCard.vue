<script setup>
import { ref, reactive } from 'vue'

const emit = defineEmits(['auth-success'])

const isLogin = ref(true)
const loading = ref(false)
const message = ref({ text: '', type: '' }) // type: 'success' | 'error' | 'info'

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Clear message after 5 seconds
const setMessage = (text, type = 'info') => {
  message.value = { text, type }
  setTimeout(() => {
    if (message.value.text === text) {
      message.value = { text: '', type: '' }
    }
  }, 5000)
}

// Fallback: LocalStorage Mock Database
const getMockUsers = () => JSON.parse(localStorage.getItem('mock_users') || '[]')
const saveMockUser = (user) => {
  const users = getMockUsers()
  users.push(user)
  localStorage.setItem('mock_users', JSON.stringify(users))
}

const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    return setMessage('Kérlek töltsd ki az összes mezőt!', 'error')
  }

  loading.value = true
  setMessage('', '')

  try {
    // Attempt real API call
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    })

    if (res.status === 404) {
      throw new Error('API_NOT_FOUND')
    }

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Bejelentkezési hiba.')
    }

    // Success! Save token and emit
    localStorage.setItem('authToken', data.token)
    setMessage('Sikeres bejelentkezés!', 'success')
    setTimeout(() => {
      emit('auth-success', data.user)
      loading.value = false
    }, 800)

  } catch (err) {
    if (err.message === 'API_NOT_FOUND' || err.message.includes('Failed to fetch')) {
      // LocalStorage Fallback Authentication
      console.warn('API connection failed. Falling back to local authentication simulation.')
      
      const users = getMockUsers()
      const normalizedEmail = loginForm.email.trim().toLowerCase()
      const foundUser = users.find(u => u.email === normalizedEmail && u.password === loginForm.password)

      if (foundUser) {
        localStorage.setItem('authToken', 'mock-jwt-token-xyz-123')
        localStorage.setItem('mockUserSession', JSON.stringify(foundUser))
        setMessage('Sikeres bejelentkezés (Helyi szimuláció)!', 'success')
        setTimeout(() => {
          emit('auth-success', {
            id: foundUser.id,
            email: foundUser.email,
            username: foundUser.username
          })
          loading.value = false
        }, 800)
      } else {
        setMessage('Hibás e-mail cím vagy jelszó (helyi fiókokban sem található).', 'error')
        loading.value = false
      }
    } else {
      setMessage(err.message, 'error')
      loading.value = false
    }
  }
}

const handleRegister = async () => {
  const { username, email, password, confirmPassword } = registerForm
  
  if (!username || !email || !password || !confirmPassword) {
    return setMessage('Minden mezőt ki kell tölteni!', 'error')
  }

  if (password !== confirmPassword) {
    return setMessage('A két jelszó nem egyezik meg!', 'error')
  }

  if (password.length < 6) {
    return setMessage('A jelszónak legalább 6 karakterből kell állnia!', 'error')
  }

  loading.value = true
  setMessage('', '')

  try {
    // Attempt real API call
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })

    if (res.status === 404) {
      throw new Error('API_NOT_FOUND')
    }

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Regisztrációs hiba.')
    }

    setMessage('Sikeres regisztráció! Most már bejelentkezhetsz.', 'success')
    // Clear forms and switch to login
    registerForm.username = ''
    registerForm.email = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    
    setTimeout(() => {
      isLogin.value = true
      loading.value = false
    }, 1500)

  } catch (err) {
    if (err.message === 'API_NOT_FOUND' || err.message.includes('Failed to fetch')) {
      // LocalStorage Fallback Registration
      console.warn('API connection failed. Falling back to local registration simulation.')
      
      const users = getMockUsers()
      const normalizedEmail = email.trim().toLowerCase()
      
      if (users.some(u => u.email === normalizedEmail)) {
        setMessage('Ez az e-mail cím már regisztrálva van helyileg.', 'error')
        loading.value = false
        return
      }

      const mockUser = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        username: username.trim(),
        password: password // In mock we store plain text for simple local check
      }

      saveMockUser(mockUser)
      setMessage('Regisztráció sikeres (Helyi szimuláció)!', 'success')
      
      registerForm.username = ''
      registerForm.email = ''
      registerForm.password = ''
      registerForm.confirmPassword = ''

      setTimeout(() => {
        isLogin.value = true
        loading.value = false
      }, 1500)
    } else {
      setMessage(err.message, 'error')
      loading.value = false
    }
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#312E81] px-4 py-12 relative overflow-hidden select-none">
    <!-- Animated background glowing circles -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse delay-700"></div>

    <div class="w-full max-w-[440px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10 transition-all duration-500">
      
      <!-- Brand Logo / Title -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-black tracking-tight text-white mb-2">
          Infografika<span class="text-indigo-400">-készítő</span>
        </h2>
        <p class="text-xs font-semibold text-slate-300 uppercase tracking-widest">
          {{ isLogin ? 'Bejelentkezés a fiókodba' : 'Regisztrálj új fiókot' }}
        </p>
      </div>

      <!-- Messages Alert -->
      <div 
        v-if="message.text" 
        :class="[
          'mb-6 p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 transition-all duration-300',
          message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
          message.type === 'error' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 
          'bg-blue-500/20 text-blue-300 border-blue-500/30'
        ]"
      >
        <div class="shrink-0">
          <svg v-if="message.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <p class="m-0 leading-tight">{{ message.text }}</p>
      </div>

      <!-- Login Form -->
      <form v-if="isLogin" @submit.prevent="handleLogin" class="space-y-5">
        <div class="space-y-1.5">
          <label class="text-[11px] font-black text-slate-300 uppercase tracking-wider block">E-mail cím</label>
          <input 
            type="email" 
            v-model="loginForm.email"
            placeholder="pelda@email.hu"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all font-medium text-sm"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[11px] font-black text-slate-300 uppercase tracking-wider block">Jelszó</label>
          <input 
            type="password" 
            v-model="loginForm.password"
            placeholder="••••••••"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all font-medium text-sm"
            required
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ loading ? 'Bejelentkezés...' : 'Bejelentkezés' }}</span>
        </button>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="space-y-4">
        <div class="space-y-1">
          <label class="text-[11px] font-black text-slate-300 uppercase tracking-wider block">Felhasználónév</label>
          <input 
            type="text" 
            v-model="registerForm.username"
            placeholder="pl. Janika"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all font-medium text-sm"
            required
          />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-black text-slate-300 uppercase tracking-wider block">E-mail cím</label>
          <input 
            type="email" 
            v-model="registerForm.email"
            placeholder="pelda@email.hu"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all font-medium text-sm"
            required
          />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-black text-slate-300 uppercase tracking-wider block">Jelszó</label>
          <input 
            type="password" 
            v-model="registerForm.password"
            placeholder="••••••••"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all font-medium text-sm"
            required
          />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-black text-slate-300 uppercase tracking-wider block">Jelszó megerősítése</label>
          <input 
            type="password" 
            v-model="registerForm.confirmPassword"
            placeholder="••••••••"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all font-medium text-sm"
            required
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ loading ? 'Regisztráció...' : 'Regisztráció' }}</span>
        </button>
      </form>

      <!-- Toggle View Link -->
      <div class="text-center mt-6">
        <button 
          @click="isLogin = !isLogin; setMessage('', '')"
          class="text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          {{ isLogin ? 'Még nincs fiókod? Regisztrálj' : 'Már van fiókod? Jelentkezz be' }}
        </button>
      </div>

    </div>
  </div>
</template>

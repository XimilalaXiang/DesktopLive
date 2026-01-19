import { create } from 'zustand'
import type { TranscriptSession, RecordingState, AppSettings, SonioxToken } from '../types'
import { 
  getSessions, 
  saveSessions, 
  getSettings, 
  saveSettings, 
  generateId, 
  formatDate, 
  formatTime 
} from '../utils/storage'

// 主题类型定义
type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

// 获取系统主题
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// 解析主题
const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

// 从 localStorage 获取保存的主题
const getSavedTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  }
  return 'system'
}

// 应用主题到 DOM
const applyTheme = (resolvedTheme: ResolvedTheme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

interface TranscriptState {
  // 主题状态
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  initTheme: () => void
  
  // 录制状态
  recordingState: RecordingState
  setRecordingState: (state: RecordingState) => void
  
  // 当前转录内容
  currentTranscript: string
  finalTranscript: string
  nonFinalTranscript: string
  setTranscript: (final: string, nonFinal: string) => void
  clearTranscript: () => void
  
  // 当前会话
  currentSessionId: string | null
  startNewSession: () => string
  endCurrentSession: () => void
  
  // 历史会话
  sessions: TranscriptSession[]
  loadSessions: () => void
  updateSessionTitle: (id: string, title: string) => void
  deleteSession: (id: string) => void
  
  // 设置
  settings: AppSettings
  loadSettings: () => void
  updateSettings: (settings: Partial<AppSettings>) => void
  
  // Token处理
  processTokens: (tokens: SonioxToken[]) => void
  finalTokens: SonioxToken[]
}

export const useTranscriptStore = create<TranscriptState>((set, get) => ({
  // 主题状态
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => {
    const resolved = resolveTheme(theme)
    localStorage.setItem('theme', theme)
    applyTheme(resolved)
    set({ theme, resolvedTheme: resolved })
  },
  initTheme: () => {
    const savedTheme = getSavedTheme()
    const resolved = resolveTheme(savedTheme)
    applyTheme(resolved)
    set({ theme: savedTheme, resolvedTheme: resolved })
    
    // 监听系统主题变化
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const currentTheme = get().theme
        if (currentTheme === 'system') {
          const newResolved = getSystemTheme()
          applyTheme(newResolved)
          set({ resolvedTheme: newResolved })
        }
      }
      mediaQuery.addEventListener('change', handleChange)
    }
  },
  
  // 录制状态
  recordingState: 'idle',
  setRecordingState: (state) => set({ recordingState: state }),
  
  // 当前转录内容
  currentTranscript: '',
  finalTranscript: '',
  nonFinalTranscript: '',
  setTranscript: (final, nonFinal) => set({ 
    finalTranscript: final, 
    nonFinalTranscript: nonFinal,
    currentTranscript: final + nonFinal 
  }),
  clearTranscript: () => set({ 
    currentTranscript: '', 
    finalTranscript: '', 
    nonFinalTranscript: '',
    finalTokens: []
  }),
  
  // 当前会话
  currentSessionId: null,
  startNewSession: () => {
    const id = generateId()
    const now = Date.now()
    const session: TranscriptSession = {
      id,
      title: `转录 ${formatTime(now)}`,
      date: formatDate(now),
      time: formatTime(now),
      createdAt: now,
      updatedAt: now,
      transcript: '',
    }
    
    const sessions = [session, ...get().sessions]
    saveSessions(sessions)
    
    set({ 
      currentSessionId: id, 
      sessions,
      finalTranscript: '',
      nonFinalTranscript: '',
      currentTranscript: '',
      finalTokens: []
    })
    
    return id
  },
  endCurrentSession: () => {
    const { currentSessionId, finalTranscript, sessions } = get()
    if (currentSessionId && finalTranscript) {
      const updatedSessions = sessions.map(s => 
        s.id === currentSessionId 
          ? { ...s, transcript: finalTranscript, updatedAt: Date.now() }
          : s
      )
      saveSessions(updatedSessions)
      set({ sessions: updatedSessions })
    }
    set({ currentSessionId: null })
  },
  
  // 历史会话
  sessions: [],
  loadSessions: () => {
    const sessions = getSessions()
    set({ sessions })
  },
  updateSessionTitle: (id, title) => {
    const sessions = get().sessions.map(s =>
      s.id === id ? { ...s, title, updatedAt: Date.now() } : s
    )
    saveSessions(sessions)
    set({ sessions })
  },
  deleteSession: (id) => {
    const sessions = get().sessions.filter(s => s.id !== id)
    saveSessions(sessions)
    set({ sessions })
  },
  
  // 设置
  settings: { apiKey: '', languageHints: ['zh', 'en'] },
  loadSettings: () => {
    const settings = getSettings()
    set({ settings })
  },
  updateSettings: (newSettings) => {
    const settings = { ...get().settings, ...newSettings }
    saveSettings(settings)
    set({ settings })
  },
  
  // Token处理
  finalTokens: [],
  processTokens: (tokens) => {
    const { finalTokens } = get()
    const newFinalTokens = [...finalTokens]
    let nonFinalText = ''
    
    for (const token of tokens) {
      if (token.text) {
        if (token.is_final) {
          newFinalTokens.push(token)
        } else {
          nonFinalText += token.text
        }
      }
    }
    
    const finalText = newFinalTokens.map(t => t.text).join('')
    
    set({
      finalTokens: newFinalTokens,
      finalTranscript: finalText,
      nonFinalTranscript: nonFinalText,
      currentTranscript: finalText + nonFinalText
    })
    
    // 实时保存到当前会话
    const { currentSessionId, sessions } = get()
    if (currentSessionId) {
      const updatedSessions = sessions.map(s =>
        s.id === currentSessionId
          ? { ...s, transcript: finalText, updatedAt: Date.now() }
          : s
      )
      // 不频繁保存到localStorage，只更新内存中的状态
      set({ sessions: updatedSessions })
    }
  },
}))

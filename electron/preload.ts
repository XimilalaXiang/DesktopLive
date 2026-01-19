import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 最小化到托盘
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  
  // 检测是否在 Electron 环境中运行
  isElectron: true,
})

// 类型声明（供 TypeScript 使用）
declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>
      minimizeToTray: () => Promise<void>
      isElectron: boolean
    }
  }
}

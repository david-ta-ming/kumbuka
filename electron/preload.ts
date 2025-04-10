import { contextBridge, ipcRenderer } from 'electron'

interface ClipboardItem {
  type: 'text' | 'image'
  content: string
  timestamp: string
  imageUrl?: string
  hash?: string
  locked?: boolean
}

contextBridge.exposeInMainWorld('electronAPI', {
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),
  onClipboardUpdate: (callback: (data: ClipboardItem) => void) => {
    ipcRenderer.on('clipboard-updated', (_event, value) => callback(value))
  },
  setClipboardContent: (item: ClipboardItem) => ipcRenderer.invoke('set-clipboard-content', item),
  deleteClipboardItem: (timestamp: string) => ipcRenderer.invoke('delete-clipboard-item', timestamp),
  toggleLockItem: (timestamp: string) => ipcRenderer.invoke('toggle-lock-item', timestamp)
}) 
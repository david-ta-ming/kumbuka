import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
    clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),
    deleteClipboardItem: (timestamp: string) => ipcRenderer.invoke('delete-clipboard-item', timestamp),
    setClipboardContent: (item: { type: string; content: string }) => 
      ipcRenderer.invoke('set-clipboard-content', item),
    onClipboardUpdate: (callback: (event: any, value: any) => void) => {
      ipcRenderer.on('clipboard-updated', callback)
      return () => {
        ipcRenderer.removeListener('clipboard-updated', callback)
      }
    }
  }
) 
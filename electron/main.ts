import { app, BrowserWindow, ipcMain, clipboard, nativeImage, protocol, Tray, screen, Menu, IconButton, ButtonBase, Tooltip } from 'electron'
import path from 'path'
import Store from 'electron-store'
import fs from 'fs'
import crypto from 'crypto'

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...')
  app.quit()
  process.exit(0)
}

const store = new Store()

// Ensure the images directory exists
const imagesDir = path.join(app.getPath('userData'), 'clipboard-images')
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

// Calculate hash of image buffer
function calculateImageHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

let window: BrowserWindow | null = null
let tray: Tray | null = null

app.dock?.hide() // Hide dock icon immediately

app.on('ready', () => {
  // Register custom protocol
  protocol.registerFileProtocol('clipboard-image', (request, callback) => {
    const filePath = request.url.replace('clipboard-image://', '')
    try {
      callback(path.join(imagesDir, filePath))
    } catch (error) {
      console.error(error)
      callback({ error: -2 })
    }
  })

  // Get the primary display
  const primaryDisplay = screen.getPrimaryDisplay()
  console.log('Primary display:', primaryDisplay.bounds)
  console.log('All displays:', screen.getAllDisplays().map(d => d.bounds))

  // Create window
  window = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    frame: false,
    skipTaskbar: true,
    x: primaryDisplay.bounds.x + Math.round(primaryDisplay.bounds.width / 2 - 200),
    y: primaryDisplay.bounds.y + 24,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      webSecurity: true
    },
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    window.loadURL('http://localhost:5173')
  } else {
    window.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  // Create tray icon
  const iconPath = path.join(__dirname, '../../build/icon.png')
  console.log('Looking for icon at:', iconPath)
  
  if (!fs.existsSync(iconPath)) {
    console.error('Icon file not found:', iconPath)
    app.quit()
    return
  }

  const originalIcon = nativeImage.createFromPath(iconPath)
  // Resize to 16x16 for menubar
  const icon = originalIcon.resize({
    width: 16,
    height: 16
  })
  icon.setTemplateImage(true) // This is crucial for macOS menubar icons
  
  tray = new Tray(icon)
  tray.setToolTip('Kumbuka - Clipboard History')

  // Create minimal context menu for right-click
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', click: () => {
      app.quit()
    }}
  ])

  // Handle left-click to toggle window
  tray.on('click', (event, bounds) => {
    if (!window) return

    // Toggle window visibility
    if (window.isVisible()) {
      window.hide()
    } else {
      // Position window below the tray icon, ensuring it's on the primary display
      const { x, y } = bounds
      const { height: trayHeight } = bounds
      
      // Calculate position relative to primary display
      const windowX = primaryDisplay.bounds.x + Math.round(x - window.getBounds().width / 2)
      const windowY = primaryDisplay.bounds.y + Math.round(y + trayHeight)
      
      window.setPosition(windowX, windowY)
      window.show()
      window.focus()
    }
  })

  // Handle right-click to show quit menu
  tray.on('right-click', () => {
    tray?.popUpContextMenu(contextMenu)
  })

  // Handle window blur
  window.on('blur', () => {
    if (!window?.webContents.isDevToolsOpened()) {
      window?.hide()
    }
  })

  // Ensure app shows in dock during development
  if (process.env.NODE_ENV === 'development') {
    app.dock?.show()
    window.webContents.openDevTools()
  }

  console.log('App is ready')
  console.log('Window exists:', !!window)
  console.log('Tray exists:', !!tray)
  console.log('Window bounds:', window.getBounds())
  if (tray) {
    console.log('Tray bounds:', tray.getBounds())
  }

  // Start clipboard monitoring
  let lastClipboardContent = ''
  let lastImageHash: string | null = null

  const checkClipboard = () => {
    // Check for text content
    const textContent = clipboard.readText()
    const image = clipboard.readImage()
    
    const hasNewText = textContent && textContent !== lastClipboardContent
    let hasNewImage = false

    // Only process image if there is one
    if (!image.isEmpty()) {
      const pngData = image.toPNG()
      if (pngData && pngData.length > 0) {
        const currentImageHash = calculateImageHash(pngData)
        hasNewImage = currentImageHash !== lastImageHash
        lastImageHash = currentImageHash
      }
    } else {
      lastImageHash = null
    }

    if (hasNewText || hasNewImage) {
      const timestamp = new Date().toISOString()
      let newItem: { 
        type: 'text' | 'image',
        content: string,
        timestamp: string,
        imageUrl?: string,
        hash?: string,
        locked?: boolean
      }

      if (hasNewText) {
        // Check for duplicate text content
        const existingText = store.get('clipboardHistory', []) as Array<typeof newItem>
        const existingTextItem = existingText.find(item => 
          item.type === 'text' && item.content === textContent
        )
        
        if (existingTextItem) {
          // Update timestamp of existing text and move to top, preserving locked status
          const updatedHistory = [
            { ...existingTextItem, timestamp }, // Keep all existing properties including locked status
            ...existingText.filter(item => item.timestamp !== existingTextItem.timestamp)
          ]
          store.set('clipboardHistory', updatedHistory)
          window?.webContents.send('clipboard-updated', { ...existingTextItem, timestamp })
        } else {
          // Add new text item
          newItem = {
            type: 'text',
            content: textContent,
            timestamp,
            locked: false // Explicitly set locked to false for new items
          }
          const history = store.get('clipboardHistory', []) as Array<typeof newItem>
          store.set('clipboardHistory', [newItem, ...history.slice(0, 99)])
          window?.webContents.send('clipboard-updated', newItem)
        }
      }

      if (hasNewImage && lastImageHash) {
        try {
          const pngData = image.toPNG()
          if (pngData && pngData.length > 0) {
            const fileName = `${Date.now()}.png`
            
            // Check for duplicate image by hash
            const existingImage = store.get('clipboardHistory', []) as Array<typeof newItem>
            const existingImageItem = existingImage.find(item => item.hash === lastImageHash)
            if (existingImageItem) {
              // Update timestamp of existing image and move to top, preserving locked status
              const updatedHistory = [
                { ...existingImageItem, timestamp }, // Keep all existing properties including locked status
                ...existingImage.filter(item => item.timestamp !== existingImageItem.timestamp)
              ]
              store.set('clipboardHistory', updatedHistory)
              window?.webContents.send('clipboard-updated', { ...existingImageItem, timestamp })
            } else {
              // Save new image
              fs.writeFileSync(path.join(imagesDir, fileName), pngData)
              newItem = {
                type: 'image',
                content: '',
                timestamp,
                imageUrl: `clipboard-image://${fileName}`,
                hash: lastImageHash,
                locked: false // Explicitly set locked to false for new items
              }
              const history = store.get('clipboardHistory', []) as Array<typeof newItem>
              store.set('clipboardHistory', [newItem, ...history.slice(0, 99)])
              window?.webContents.send('clipboard-updated', newItem)
            }
          }
        } catch (error) {
          console.error('Error saving image:', error)
        }
      }

      lastClipboardContent = textContent
    }

    setTimeout(checkClipboard, 500)
  }

  checkClipboard()
})

// IPC handlers
ipcMain.handle('get-clipboard-history', () => {
  return store.get('clipboardHistory', [])
})

ipcMain.handle('clear-clipboard-history', () => {
  const history = store.get('clipboardHistory', []) as Array<{
    type: 'text' | 'image'
    content: string
    timestamp: string
    imageUrl?: string
    hash?: string
    locked?: boolean
  }>

  // Only keep locked items
  const lockedItems = history.filter(item => item.locked)
  store.set('clipboardHistory', lockedItems)
})

ipcMain.handle('delete-clipboard-item', (_event, timestamp: string) => {
  const history = store.get('clipboardHistory', []) as Array<{
    type: 'text' | 'image'
    content: string
    timestamp: string
    imageUrl?: string
    hash?: string
  }>

  const updatedHistory = history.filter(item => item.timestamp !== timestamp)
  store.set('clipboardHistory', updatedHistory)
})

ipcMain.handle('set-clipboard-content', (_event, item: { type: string; content: string }) => {
  if (item.type === 'text') {
    clipboard.writeText(item.content)
  } else if (item.type === 'image') {
    const imagePath = path.join(imagesDir, item.content)
    try {
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath)
        const image = nativeImage.createFromBuffer(imageBuffer)
        if (!image.isEmpty()) {
          clipboard.writeImage(image)
        }
      }
    } catch (error) {
      console.error('Error setting clipboard image:', error)
      return false
    }
  }
  return true
})

ipcMain.handle('toggle-lock-item', (_event, timestamp: string) => {
  const history = store.get('clipboardHistory', []) as Array<{
    type: 'text' | 'image'
    content: string
    timestamp: string
    imageUrl?: string
    hash?: string
    locked?: boolean
  }>

  const updatedHistory = history.map(item => {
    if (item.timestamp === timestamp) {
      return { ...item, locked: !item.locked }
    }
    return item
  })
  
  store.set('clipboardHistory', updatedHistory)
  return updatedHistory.find(item => item.timestamp === timestamp)
})
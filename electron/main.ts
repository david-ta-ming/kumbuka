import { app, BrowserWindow, ipcMain, clipboard, nativeImage, protocol } from 'electron'
import path from 'path'
import Store from 'electron-store'
import fs from 'fs'
import crypto from 'crypto'

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

function createWindow() {
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

  const iconPath = path.join(__dirname, '../../build/icon.png')
  if (!fs.existsSync(iconPath)) {
    console.error('Icon file not found:', iconPath)
  } else {
    console.log('Using icon:', iconPath)
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      webSecurity: true
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  // Clipboard monitoring
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
      // Reset last image hash if clipboard has no image
      lastImageHash = null
    }

    if (hasNewText || hasNewImage) {
      const timestamp = new Date().toISOString()
      let newItem: { 
        type: 'text' | 'image',
        content: string,
        timestamp: string,
        imageUrl?: string,
        hash?: string
      }

      if (hasNewImage && lastImageHash) {
        try {
          // Convert image to PNG buffer
          const pngData = image.toPNG()
          if (pngData && pngData.length > 0) {
            // Check if we already have this image
            const history = store.get('clipboardHistory', []) as Array<typeof newItem>
            const existingImage = history.find(item => item.type === 'image' && item.hash === lastImageHash)
            
            if (existingImage) {
              // Move existing image to top with new timestamp
              const filteredHistory = history.filter(item => 
                !(item.type === 'image' && item.hash === lastImageHash)
              )
              const updatedItem = {
                ...existingImage,
                timestamp
              }
              store.set('clipboardHistory', [updatedItem, ...filteredHistory])
              mainWindow.webContents.send('clipboard-updated', updatedItem)
              return
            }

            // Save new image
            const fileName = `${Date.now()}.png`
            const filePath = path.join(imagesDir, fileName)
            fs.writeFileSync(filePath, pngData)
            
            newItem = {
              type: 'image',
              content: fileName,
              imageUrl: `clipboard-image://${fileName}`,
              timestamp,
              hash: lastImageHash
            }
          } else {
            console.error('Invalid image data')
            return
          }
        } catch (error) {
          console.error('Error saving image:', error)
          return
        }
      } else if (hasNewText) {
        lastClipboardContent = textContent
        newItem = {
          type: 'text',
          content: textContent,
          timestamp
        }
      } else {
        return // Skip if neither condition is met
      }
      
      // Get current history
      const history = store.get('clipboardHistory', []) as Array<typeof newItem>
      
      // Remove any existing entries with the same content
      const filteredHistory = history.filter(item => 
        item.type !== newItem.type || 
        (item.type === 'text' ? item.content !== newItem.content : item.hash !== newItem.hash)
      )
      
      // Add new item at the beginning
      const updatedHistory = [newItem, ...filteredHistory]
      
      // Store the updated history
      store.set('clipboardHistory', updatedHistory)
      
      // Send update to renderer
      mainWindow.webContents.send('clipboard-updated', newItem)
    }
  }

  // Check clipboard every second
  const clipboardInterval = setInterval(checkClipboard, 1000)

  mainWindow.on('closed', () => {
    clearInterval(clipboardInterval)
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

// IPC handlers
ipcMain.handle('get-clipboard-history', () => {
  const history = store.get('clipboardHistory', []) as Array<{
    type: 'text' | 'image'
    content: string
    timestamp: string
    imageUrl?: string
    hash?: string
  }>

  // Update image URLs to use custom protocol
  return history.map(item => {
    if (item.type === 'image') {
      return {
        ...item,
        imageUrl: `clipboard-image://${item.content}`
      }
    }
    return item
  })
})

ipcMain.handle('clear-clipboard-history', () => {
  // Clear the stored history
  store.set('clipboardHistory', [])
  
  // Delete all saved images
  if (fs.existsSync(imagesDir)) {
    fs.readdirSync(imagesDir).forEach(file => {
      try {
        fs.unlinkSync(path.join(imagesDir, file))
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error)
      }
    })
  }
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
        } else {
          console.error('Failed to create image from buffer')
          return false
        }
      }
    } catch (error) {
      console.error('Error setting clipboard image:', error)
      return false
    }
  }
  return true
}) 
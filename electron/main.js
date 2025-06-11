const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const isDev = process.env.NODE_ENV === 'development'

let nextServer = null

// 启动Next.js服务器
function startNextServer() {
  const serverPath = path.join(__dirname, '..', 'server.js')
  nextServer = spawn('node', [serverPath], {
    stdio: 'pipe',
    env: { ...process.env, PORT: '3001' }
  })

  nextServer.stdout.on('data', (data) => {
    console.log(`Next.js Server: ${data}`)
  })

  nextServer.stderr.on('data', (data) => {
    console.error(`Next.js Server Error: ${data}`)
  })

  nextServer.on('close', (code) => {
    console.log(`Next.js Server exited with code ${code}`)
  })
}

// 保持对窗口对象的全局引用，如果不这样做，当JavaScript对象被垃圾回收时，窗口将自动关闭
let mainWindow

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/icon.png'), // 应用图标
    show: false, // 先不显示，等待ready-to-show事件
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  })

  // 启动Next.js服务器（如果不是开发模式）
  if (!isDev) {
    startNextServer()
  }

  // 加载应用
  const startUrl = isDev ? 'http://localhost:3000' : 'http://localhost:3001'

  // 等待服务器启动
  setTimeout(() => {
    mainWindow.loadURL(startUrl)
  }, isDev ? 0 : 5000)
  
  mainWindow.loadURL(startUrl)

  // 当窗口准备好显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // 开发模式下打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    // 取消对窗口对象的引用，如果你的应用支持多窗口，
    // 通常你会在这里存储窗口在一个数组中，
    // 这是删除相应元素的时候
    mainWindow = null
  })

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 阻止导航到外部URL
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
// 某些API只能在此事件发生后使用
app.whenReady().then(() => {
  createWindow()

  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常会重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // 设置应用菜单
  createMenu()
})

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 关闭Next.js服务器
  if (nextServer) {
    nextServer.kill()
  }

  // 在macOS上，应用和它们的菜单栏通常会保持活跃状态，
  // 直到用户明确地使用Cmd + Q退出
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前清理
app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill()
  }
})

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: 'SnapFit AI',
      submenu: [
        {
          label: '关于 SnapFit AI',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 SnapFit AI',
              message: 'SnapFit AI',
              detail: '智能健康管理应用\n版本: 1.0.0\n基于 AI 技术的个人健康助手'
            })
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '了解更多',
          click: () => {
            shell.openExternal('https://github.com/your-username/snapfit-ai')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 在这个文件中你可以包含应用的其他特定的主进程代码
// 你也可以把它们放在单独的文件中然后在这里引入

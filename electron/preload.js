const { contextBridge, ipcRenderer } = require('electron')

// 暴露受保护的方法，允许渲染进程使用
// ipcRenderer，而不暴露整个对象
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  // 文件操作
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // 通知
  showNotification: (title, body) => ipcRenderer.invoke('notification:show', title, body),
  
  // 平台信息
  platform: process.platform,
  
  // 事件监听
  onWindowStateChange: (callback) => ipcRenderer.on('window:state-changed', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})

// 当DOM加载完成时
window.addEventListener('DOMContentLoaded', () => {
  // 可以在这里添加一些初始化代码
  console.log('SnapFit AI Electron App Loaded')
})

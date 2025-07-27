const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件选择相关
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  
  // 配置文件相关
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  
  // 升级包制作相关
  createUpgradePackage: (config) => ipcRenderer.invoke('package:create', config),
  
  // 日志相关
  onLog: (callback) => ipcRenderer.on('log', (event, message) => callback(message))
});
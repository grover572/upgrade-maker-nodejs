const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

// 确保应用是单实例运行
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: '升级包制作工具',
  });

  // 加载页面 - 开发环境使用Vite服务器，生产环境加载打包文件
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // 打开开发者工具
  mainWindow.webContents.openDevTools();
}

// 当Electron初始化完成并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常会在应用中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口都关闭时退出应用
// 处理文件选择对话框
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{
      name: 'ZIP Files',
      extensions: ['zip']
    }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

app.on('window-all-closed', function () {
  // 在macOS上，除非用户用Cmd + Q显式退出，否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') app.quit();
});
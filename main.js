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
// 读取配置文件
ipcMain.on('read-config-file', (event) => {
  console.log('收到读取配置文件请求');
  try {
    const fs = require('fs');
    const path = require('path');
    // 获取当前工作目录
    const cwd = process.cwd();
    console.log(`当前工作目录: ${cwd}`);
    // 构建绝对路径
    const configPath = path.join(__dirname, 'config', 'old_package.json');
    console.log(`尝试读取配置文件: ${configPath}`);
    // 检查文件是否存在
    if (!fs.existsSync(configPath)) {
      // 列出config目录下的文件
      const configDir = path.join(__dirname, 'config');
      const files = fs.readdirSync(configDir);
      console.log(`config目录下的文件: ${files.join(', ')}`);
      throw new Error(`配置文件不存在: ${configPath}`);
    }
    // 检查文件权限
    try {
      fs.accessSync(configPath, fs.constants.R_OK);
      console.log('有读取配置文件的权限');
    } catch (accessError) {
      throw new Error(`没有读取配置文件的权限: ${accessError.message}`);
    }
    // 检查文件大小
    const stats = fs.statSync(configPath);
    console.log(`配置文件大小: ${stats.size} 字节`);
    if (stats.size === 0) {
      throw new Error('配置文件为空');
    }
    // 尝试读取文件内容
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      console.log('成功读取配置文件内容');
      console.log(`配置文件内容前100字符: ${configData.substring(0, 100)}`);
      // 尝试解析JSON
      try {
        const config = JSON.parse(configData);
        console.log('成功解析配置文件');
        event.reply('config-file-read', { config });
        console.log('已发送配置文件数据到渲染进程');
      } catch (jsonError) {
        console.error(`JSON解析错误: ${jsonError.message}`);
        console.error(`错误位置: ${jsonError.position}`);
        throw new Error(`解析配置文件失败: ${jsonError.message}`);
      }
    } catch (readError) {
      throw new Error(`读取配置文件内容失败: ${readError.message}`);
    }
  } catch (error) {
    console.error(`读取配置文件出错: ${error.message}`);
    event.reply('config-file-read', { error: error.message });
  }
});

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
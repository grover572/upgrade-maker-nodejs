<template>
  <div class="app-container">
    <el-container style="height: 100%; display: flex; flex-direction: column;">
      <!-- 上部分：安装包选择 -->
      <el-header style="padding: 10px; border-bottom: 1px solid #eee; height: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 18px; color: #333; margin: 0; padding-bottom: 8px; border-bottom: 2px solid #409EFF;">安装包选择</h2>
          <el-button type="primary" icon="Check" @click="startMaking" :loading="upgradeMaker && upgradeMaker.isMaking()">开始制作</el-button>
        </div>
        <el-table :data="packages" style="margin-top: 10px; width: 100%;">
          <el-table-column prop="name" label="包名称" width="200"></el-table-column>
          <el-table-column prop="path" label="文件路径"></el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="primary" text size="small" @click="selectPackagePath(scope.row)">选择文件</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-header>

      <!-- 中间部分：组件选择 -->
      <el-main style="flex: 1; overflow: auto; padding: 10px;">
        <h2 style="font-size: 18px; color: #333; margin: 0; padding-bottom: 8px; border-bottom: 2px solid #409EFF;">组件选择</h2>
        <el-tree
          :data="components"
          show-checkbox
          node-key="label"
          default-expand-all
          :props="componentProps"
          style="margin-top: 10px; width: 100%; height: calc(100% - 40px); overflow: auto;"
        ></el-tree>
      </el-main>

      <!-- 下部分：拷贝进度和日志 -->
      <el-footer style="padding: 10px; border-top: 1px solid #eee; height: 200px; display: flex; flex-direction: column;">
        <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; flex: 1;">
            <span style="white-space: nowrap; margin-right: 10px;">进度: </span>
            <el-progress :percentage="progress" :text-inside="true" stroke-width="18" style="flex: 1;"></el-progress>
          </div>
          <el-button type="default" size="small" @click="clearLogs" style="margin-left: 10px;">清除日志</el-button>
        </div>
        <div style="flex: 1; border: 1px solid #eee; border-radius: 4px; overflow: hidden;">
          <el-scrollbar style="height: 100%;">
            <pre style="margin: 0; padding: 10px; font-size: 12px; line-height: 1.5; background-color: #f5f5f5; height: 100%; overflow: auto;">{{ logs }}</pre>
          </el-scrollbar>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import UpgradeMaker from './services/UpgradeMaker';

export default {
  name: 'App',
  data() {
    return {
      // 安装包数据
      packages: [],
      // 组件树数据
      components: [],
      componentProps: {
        children: 'children',
        label: 'label'
      },
      // 拷贝进度
      progress: 0,
      // 日志信息
      logs: '应用已启动\n',
      // 升级包制作器
      upgradeMaker: null
    };
  },
  mounted() {
    // 加载配置文件中的安装包和组件数据
    fetch('./config/packages.json')
      .then(response => response.json())
      .then(data => {
        this.packages = data.packages || [];
        this.components = data.components || [];
        this.logs += '已加载安装包和组件配置\n';
        // 初始化升级包制作器
        this.upgradeMaker = new UpgradeMaker();
        this.logs += '升级包制作器已初始化\n';
      })
      .catch(error => {
        this.logs += `加载配置文件失败: ${error.message}\n`;
        console.error('Failed to load config:', error);
      });
  },
  methods: {
    // 开始制作升级包
    startMaking() {
      // 检查是否所有安装包都已选择文件
      const unselectedPackages = this.packages.filter(pkg => !pkg.path);
      if (unselectedPackages.length > 0) {
          this.logs += `错误: 请为以下安装包选择文件: ${unselectedPackages.map(pkg => pkg.name).join(', ')}\n`;
        return;
      }
      
      // 检查升级包制作器是否已初始化
      if (!this.upgradeMaker) {
        this.logs += '错误: 升级包制作器未初始化\n';
        return;
      }

      // 调用升级包制作器的makeUpgrade方法
      this.upgradeMaker.makeUpgrade(
        this.packages,
        this.components,
        // 进度更新回调
        (progress) => {
          this.progress = progress;
        },
        // 日志回调
        (message) => {
          this.logs += message + '\n';
        }
      );
    },
    // 为指定安装包选择文件路径
    selectPackagePath(pkg) {
      // 调用Electron的文件对话框API
      window.electronAPI.selectFile().then(filePath => {
        if (filePath) {
          // 更新选中包的路径
          pkg.path = filePath;
          this.logs += `已为 ${pkg.name} 选择文件: ${filePath}\n`;
        }
      });
    },
    // 清除日志
    clearLogs() {
      this.logs = '日志已清除\n';
      this.progress = 0;
    },

  }
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
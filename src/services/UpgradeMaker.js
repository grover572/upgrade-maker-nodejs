// 基础任务类
class Task {
  constructor(name) {
    this.name = name;
    this.nextTask = null;
  }

  setNextTask(task) {
    this.nextTask = task;
    return task;
  }

  async execute(context) {
    try {
      context.logger(`开始执行任务: ${this.name}`);
      await this.run(context);
      context.logger(`完成任务: ${this.name}`);
      context.progress += this.getProgressContribution();

      if (this.nextTask) {
        await this.nextTask.execute(context);
      }
    } catch (error) {
      context.logger(`任务失败: ${this.name}, 错误: ${error.message}`);
      throw error;
    }
  }

  async run(context) {
    // 子类实现具体逻辑
    throw new Error('子类必须实现run方法');
  }

  getProgressContribution() {
    // 子类返回此任务贡献的进度值
    return 0;
  }
}

// 拷贝文件任务
class CopyFileTask extends Task {
  constructor() {
    super('拷贝文件');
  }

  async run(context) {
    try {
        // 使用preload.js暴露的API读取配置文件
          context.logger('正在读取配置文件...');
          const config = await window.electronAPI.readConfigFile();
        context.logger('成功读取配置文件');

      // 获取选择的包和组件
      const { packages, components } = context;
      if (!packages || packages.length === 0) {
        throw new Error('没有选择要拷贝的包');
      }

      // 假设选择第一个包的osKey作为当前osKey
      // 实际应用中可能需要根据用户选择确定
      const firstPackage = packages[0];
      const osKey = config.source[firstPackage]?.osKey;
      if (!osKey) {
        throw new Error(`无法找到包${firstPackage}对应的osKey`);
      }
      context.logger(`使用osKey: ${osKey}`);

      // 遍历组件，执行拷贝
      let totalFiles = 0;
      let copiedFiles = 0;

      for (const component of components) {
        // 检查组件是否在映射配置中
        if (!config.mapping.group[component]) {
          context.logger(`警告: 组件${component}在配置中未找到，跳过`);
          continue;
        }

        const fileMappings = config.mapping.group[component];
        totalFiles += fileMappings.length;

        for (const mapping of fileMappings) {
          // 替换目标路径中的osKey变量
          let dstPath = mapping.dst.replace('$osKey$', osKey);
          context.logger(`准备拷贝: ${mapping.src} -> ${dstPath}`);

          // 这里只是模拟拷贝，实际应用中需要实现真正的文件拷贝逻辑
          // 包括创建目录、处理文件、处理clean_dst标志等
          await new Promise(resolve => setTimeout(resolve, 500));
          copiedFiles++;

          // 更新进度
          const progressPercent = Math.round((copiedFiles / totalFiles) * 100);
          context.progress = progressPercent;
          context.logger(`已完成 ${progressPercent}%`);
        }
      }

      context.logger('文件拷贝完成');
    } catch (error) {
      context.logger(`拷贝文件出错: ${error.message}`);
      throw error;
    }
  }

  getProgressContribution() {
    // 拷贝文件贡献100%的进度
    return 100;
  }
}

// 升级包制作器
class UpgradeMaker {
  constructor() {
    this.taskChain = null;
    this.isRunning = false;
  }

  // 初始化任务链
  initTaskChain() {
    // 创建任务链
    const copyTask = new CopyFileTask();
    // 可以在这里添加更多任务
    // copyTask.setNextTask(new AnotherTask());

    this.taskChain = copyTask;
  }

  // 开始制作升级包
  async makeUpgrade(packages, components, onProgress, onLog) {
    if (this.isRunning) {
      onLog('制作流程正在进行中，请不要重复点击');
      return;
    }

    try {
      this.isRunning = true;
      onLog('开始制作升级包...');
      onProgress(0);

      // 初始化任务链
      this.initTaskChain();

      // 创建上下文对象
      const context = {
        packages,
        components,
        progress: 0,
        logger: (message) => {
          onLog(message);
        }
      };

      // 执行任务链
      await this.taskChain.execute(context);

      onProgress(100);
      onLog('升级包制作完成!');
    } catch (error) {
      onLog(`制作失败: ${error.message}`);
      onProgress(0);
    } finally {
      this.isRunning = false;
    }
  }

  // 检查是否正在运行
  isMaking() {
    return this.isRunning;
  }
}

export default UpgradeMaker;
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
    // 拷贝文件的具体逻辑将在后续实现
    context.logger('模拟拷贝文件...');
    // 这里只是模拟，实际逻辑将在后续添加
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  getProgressContribution() {
    // 假设拷贝文件贡献100%的进度
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
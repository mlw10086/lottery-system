# 🚀 GitHub一键部署指南

## 📋 部署前准备

### 1. 创建GitHub仓库
1. 登录GitHub：https://github.com
2. 点击右上角的"+"号，选择"New repository"
3. 填写仓库信息：
   - **Repository name**: `lottery-system` (或您喜欢的名称)
   - **Description**: `智能城市抽奖系统 - 三轮抽奖，动态权重算法`
   - **Public/Private**: 选择Public（如果要使用GitHub Pages）
4. 点击"Create repository"
5. 复制仓库地址（例如：`https://github.com/username/lottery-system.git`）

### 2. 配置Git（首次使用）
如果您是第一次使用Git，需要配置用户信息：
```bash
git config --global user.name "您的姓名"
git config --global user.email "您的邮箱"
```

## 🖥️ Windows用户

### 🚀 推荐方法（适用于Win10/11）
1. **双击运行** `启动GitHub部署.cmd` 文件
2. **选择部署方式**：
   - 选择 `[1] PowerShell版本`（推荐）
   - 如果PowerShell版本无法运行，选择 `[2] 批处理版本`
3. **输入仓库地址**：粘贴您在GitHub创建的仓库地址
4. **等待完成**：脚本会自动完成所有部署步骤

### 🔧 Windows 11闪退解决方案
如果遇到脚本闪退问题，请尝试以下方法：

#### 方法1：使用PowerShell版本（推荐）
1. 右键点击 `deploy-to-github.ps1`
2. 选择"使用PowerShell运行"
3. 如果提示执行策略错误，输入 `Y` 允许执行

#### 方法2：以管理员身份运行
1. 右键点击 `启动GitHub部署.cmd`
2. 选择"以管理员身份运行"
3. 选择合适的部署方式

#### 方法3：手动执行（最稳定）
1. 按 `Win + R`，输入 `cmd`，按回车
2. 使用 `cd` 命令进入项目目录
3. 执行：`启动GitHub部署.cmd`

### 示例操作
```
请输入您的GitHub仓库地址: https://github.com/username/lottery-system.git
```

## 🐧 Linux/Mac用户

### 使用方法
1. **打开终端**，进入项目目录
2. **添加执行权限**：
   ```bash
   chmod +x deploy-to-github.sh
   ```
3. **运行脚本**：
   ```bash
   ./deploy-to-github.sh
   ```
4. **输入仓库地址**：粘贴您在GitHub创建的仓库地址

### 示例操作
```bash
cd /path/to/lottery-system
chmod +x deploy-to-github.sh
./deploy-to-github.sh
```

## 🔐 GitHub认证配置

### 方法1：Personal Access Token（推荐）
1. 访问：https://github.com/settings/tokens
2. 点击"Generate new token (classic)"
3. 选择权限：勾选"repo"
4. 复制生成的token
5. 在推送时使用token作为密码

### 方法2：SSH密钥
1. 生成SSH密钥：
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```
2. 添加到GitHub：https://github.com/settings/ssh
3. 使用SSH地址：`git@github.com:username/lottery-system.git`

## 🌐 启用GitHub Pages

### 配置步骤
1. 进入您的GitHub仓库页面
2. 点击"Settings"标签
3. 滚动到"Pages"部分
4. 在"Source"下选择"Deploy from a branch"
5. 选择"main"分支和"/ (root)"目录
6. 点击"Save"

### 访问地址
配置完成后，您的网站将在以下地址可用：
```
https://[您的用户名].github.io/[仓库名]/
```

例如：`https://username.github.io/lottery-system/`

## 📱 访问方式

### 管理员端
```
https://[您的用户名].github.io/[仓库名]/index.html
```

### 观众端
```
https://[您的用户名].github.io/[仓库名]/viewer.html
```

### 登录信息
- **管理员密码**：`admin123`

## 🔧 脚本功能说明

### 自动化步骤
1. ✅ **检查Git安装**：确保Git已正确安装
2. ✅ **初始化仓库**：如果需要，初始化Git仓库
3. ✅ **创建.gitignore**：自动创建忽略文件配置
4. ✅ **添加文件**：将所有项目文件添加到Git
5. ✅ **提交更改**：使用详细的提交信息
6. ✅ **配置远程仓库**：连接到您的GitHub仓库
7. ✅ **推送代码**：上传所有文件到GitHub

### 提交信息
脚本会自动生成详细的提交信息，包括：
- 🎲 项目标题和版本
- ✨ 功能特性列表
- 🏗️ 技术栈说明
- 📊 数据完整性
- 🎯 用户体验特色

## ❗ 常见问题

### Q1: 推送失败怎么办？
**A**: 可能的原因和解决方案：
- **网络问题**：检查网络连接
- **认证问题**：配置Personal Access Token或SSH密钥
- **权限问题**：确保仓库存在且有写入权限

### Q2: GitHub Pages不显示怎么办？
**A**: 检查以下设置：
- 确保仓库是Public
- 确保Pages设置正确（main分支，root目录）
- 等待几分钟让GitHub处理

### Q3: 文件没有上传完整怎么办？
**A**: 
- 检查.gitignore文件是否误排除了重要文件
- 重新运行部署脚本
- 手动检查GitHub仓库页面

### Q4: 如何更新代码？
**A**: 
- 修改代码后重新运行部署脚本
- 或者使用Git命令：
  ```bash
  git add .
  git commit -m "更新说明"
  git push
  ```

## 🎉 部署成功后

### 功能测试
1. **访问管理员端**：测试登录和抽奖功能
2. **访问观众端**：测试实时同步功能
3. **移动端测试**：在手机上测试响应式设计

### 分享项目
- **项目地址**：分享GitHub仓库链接
- **在线演示**：分享GitHub Pages链接
- **功能介绍**：使用README.md中的功能说明

## 📞 技术支持

如果在部署过程中遇到问题，可以：
1. 检查脚本输出的错误信息
2. 查看GitHub官方文档
3. 检查Git和GitHub的配置

---

**🎲 祝您部署成功，享受智能城市抽奖系统的乐趣！**

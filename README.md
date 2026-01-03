# Bubble Card 汉化版

这是 [Bubble Card](https://github.com/Clooos/Bubble-Card) 的中文汉化版本，基于 `v3.1.0-rc.2` 版本进行全量汉化。

## ✨ 汉化亮点

本版本对 Bubble Card 进行了**全面深度汉化**，覆盖了所有前端可见的英文文本：

### 卡片类型
- 按钮（开关、滑块等）、弹出窗口、分隔符
- 窗帘、空调、媒体播放器、日历
- 选择器、空列、水平按钮栏、仅子按钮

### 编辑器界面
- 所有配置选项、设置面板、信息提示
- 布局选项（普通、大尺寸、网格布局等）
- 动作面板（点击动作、长按动作、双击动作）

### 子按钮设置
- 子按钮类型（开关、滑块、状态、名称/文本）
- 显示选项（图标、名称、状态、属性等）
- 样式和布局选项

### 滑块设置
- 亮度、颜色（色相）、饱和度、色温
- 最小值、最大值、步长

## 📦 安装方法

### HACS 安装（推荐）
1. 在 HACS 中，点击右上角菜单 → 自定义仓库
2. 添加此仓库 URL: `https://github.com/buynow2010/bubble-card-zh`
3. 类别选择 **Lovelace**
4. 点击安装并重启 Home Assistant

### 手动安装
1. 下载 `bubble-card.js` 文件
2. 将文件复制到 `/config/www/` 目录
3. 在 Lovelace 资源中添加:
   ```yaml
   url: /local/bubble-card.js
   type: module
   ```

## 📌 版本信息

| 项目 | 版本 |
|------|------|
| 基于上游版本 | [Clooos/Bubble-Card v3.1.0-rc.2](https://github.com/Clooos/Bubble-Card/releases/tag/v3.1.0-rc.2) |
| 汉化版本 | v3.1.0-rc.2-zh |

## 🙏 致谢

- 原项目作者: [Clooos](https://github.com/Clooos)
- 汉化: [buynow2010](https://github.com/buynow2010)

## 📄 许可证

本项目遵循原 Bubble Card 的 MIT 许可证。

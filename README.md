# Bubble Card 汉化版

这是 [Bubble Card](https://github.com/Clooos/Bubble-Card) 的中文汉化版本，基于 `v3.1.0-rc.2` 版本进行汉化。

## 安装方法

### HACS 安装
1. 在 HACS 中，点击自定义仓库
2. 添加此仓库 URL: `https://github.com/buynow2010/bubble-card-zh`
3. 类别选择 "Lovelace"
4. 安装并重启 Home Assistant

### 手动安装
1. 下载 `bubble-card.js` 文件
2. 将文件复制到 `/config/www/` 目录
3. 在 Lovelace 资源中添加:
   ```yaml
   url: /local/bubble-card.js
   type: module
   ```

## 汉化内容

本汉化版本覆盖了所有前端可见的英文文本，包括：

- **卡片类型**: 按钮、弹窗、分隔符、窗帘、空调、媒体播放器、日历、选择、子按钮、空列、水平按钮栏
- **编辑器界面**: 所有配置选项、设置面板、信息提示
- **布局选项**: 卡片布局、开关标签、样式选项
- **动作面板**: 点击动作、双击动作、长按动作
- **滑块设置**: 灯光选项、布局选项、数值位置

## 基于版本

- 原始版本: [Clooos/Bubble-Card v3.1.0-rc.2](https://github.com/Clooos/Bubble-Card/releases/tag/v3.1.0-rc.2)

## 致谢

- 原项目作者: [Clooos](https://github.com/Clooos)
- 汉化: [buynow2010](https://github.com/buynow2010)

## 许可证

本项目遵循原 Bubble Card 的 MIT 许可证。

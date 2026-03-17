# Bubble Card 🫧 中文版 - 极致美感的简约卡片

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Version](https://img.shields.io/badge/version-3.1.4--zh-blue.svg)](https://github.com/ha-china/bubble-card-zh)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2023.9.0%2B-green.svg)](https://www.home-assistant.io/)

一个极简主义的 Home Assistant 卡片系列，具有出色的移动端触控和弹出窗体验。完整中文汉化版。

**原版仓库**: [Clooos/Bubble-Card](https://github.com/Clooos/Bubble-Card)

---

## 🚀 快速开始

<table>
<tr>
<td align="center">
<a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=ha-china&repository=bubble-card-zh&category=plugin">
<img src="https://my.home-assistant.io/badges/hacs_repository.svg" alt="添加HACS仓库" />
</a>
<br />
<strong>添加到 HACS</strong>
</td>
<td align="center">
<img src="https://img.shields.io/badge/点击上方-快速安装-brightgreen?style=flat-square" alt="快速安装" />
<br />
<strong>一键安装</strong>
</td>
</tr>
</table>

---

## ✨ 主要特性

### 🫧 极致美感
专为移动端设计的极简主义 UI，支持磨砂玻璃效果和动态渐变，让你的仪表板瞬间提升格调。

### 📱 移动优先
完美的触控交互体验，所有的滑块、按钮和弹出窗都经过精心优化，适配各种尺寸的智能手机。

### 🎭 弹出窗口 (Pop-up)
强大的 Pop-up 功能，可以将复杂的控制项隐藏在弹出窗口中，让主界面保持洁净高效。

### 🛠️ 高度可定制
- **子按钮系统**: 在一个卡片内集成多个控制点。
- **自定义样式**: 支持 CSS 深层定制和 JS 模板。
- **多种卡片类型**: 开关、滑块、媒体播放、空调控制等。

---

## 📦 安装

### 方法 1：通过 HACS 安装（推荐）
1. 打开 **HACS** -> **Lovelace** (仪表板)。
2. 点击右上角三个点 -> **自定义存储库 (Custom repositories)**。
3. 输入 `https://github.com/ha-china/bubble-card-zh`，类别选择 **Lovelace**。
4. 点击 **添加**，然后在 HACS 中找到 "Bubble Card" 并点击 **安装**。
5. 安装完成后，根据提示重新加载资源或刷新页面。

### 方法 2：手动安装
1. 在 [Releases](https://github.com/ha-china/bubble-card-zh/releases) 页面下载最新的 `bubble-card.js`。
2. 将该文件上传到你的 Home Assistant 配置目录下的 `www` 文件夹中。
3. 在 Home Assistant 中进入 **配置** -> **仪表板** -> **资源**，添加新资源：
   - URL: `/local/bubble-card.js`
   - 资源类型: `JavaScript 模块`

---

## 📖 使用示例

### 创建弹出窗口
1. 添加一个常用的 `vertical-stack` 或直接在仪表板点击 **添加卡片**。
2. 搜索 **Bubble Card - Pop-up**。
3. 为其设置一个唯一的 **哈希值 (Hash)**，例如 `#living-room`。
4. 在任意支持 `navigate` 动作的卡片中，将目标设置为该哈希值。

### 自定义样式
你可以在编辑器的 `Styles` 部分直接编写 CSS，无需添加 `styles: |` 前缀。

---

## 🤝 贡献与反馈
如果你发现了汉化遗漏或翻译不当的地方，欢迎提交 **Issue** 或 **Pull Request**。

## 📄 许可证
本项目遵循 [MIT 许可证](LICENSE).

## 🔗 相关链接
- [官方文档 (英文)](https://github.com/Clooos/Bubble-Card)
- [官方讨论区](https://github.com/Clooos/Bubble-Card/discussions)
- [Home Assistant 中文网](https://hass-china.com/)

---

## ⚠️ 注意事项
- 本仓库仅用于汉化维护，核心功能请以原作者更新为准。
- 如果你是从原版切换到汉化版，建议先在 HACS 中卸载原版，或确保资源路径已更新。

# Bubble Card 汉化版

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![Version](https://img.shields.io/badge/version-3.1.0--beta.7--zh-blue.svg)](https://github.com/buynow2010/bubble-card-zh/releases)

这是 [Bubble Card](https://github.com/Clooos/Bubble-Card) 的中文汉化版本，基于 v3.1.0-beta.7 版本。

## 安装

### HACS 安装（推荐）

1. 打开 HACS
2. 点击右上角菜单 → "Custom repositories"
3. 添加仓库 URL: `https://github.com/buynow2010/bubble-card-zh`
4. 类型选择 "Lovelace"
5. 点击 "Add" → 搜索 "Bubble Card 汉化版" → 安装

### 手动安装

1. 下载最新版本的 `bubble-card.js` 和 `bubble-pop-up-fix.js`
2. 将文件复制到 `config/www/` 目录
3. 在 Lovelace 资源中添加：
   ```yaml
   url: /local/bubble-card.js
   type: module
   ```

## 功能

- 完整的中文界面翻译
- 与原版保持同步更新
- 支持所有 Bubble Card 功能

## 鸣谢

- 原项目作者：[Clooos](https://github.com/Clooos)
- 原版仓库：[Clooos/Bubble-Card](https://github.com/Clooos/Bubble-Card)

## 许可

MIT License - 详见 [LICENSE](LICENSE)

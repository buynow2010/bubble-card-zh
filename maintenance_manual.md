# Bubble Card 中文汉化项目 - 完整维护手册

> **文档版本**: v3.2 | **最后更新**: 2026-01-19  
> **当前状态**: ✅ 主程序 100% 汉化 + ✅ 模块商店 100% 汉化 (42个模块)

---

## 📋 目录

- [项目概述](#项目概述)
- **[Part A：Bubble Card 主程序汉化](#part-abubble-card-主程序汉化)**
  - [A.1 工作内容](#a1-工作内容)
  - [A.2 汉化流程](#a2-汉化流程)
  - [A.3 主程序完整翻译对照表](#a3-主程序完整翻译对照表)
  - [A.4 API 端点替换规范](#a4-api-端点替换规范)
- **[Part B：模块社区商店汉化](#part-b模块社区商店汉化)**
  - [B.1 工作内容](#b1-工作内容)
  - [B.2 模块商店架构](#b2-模块商店架构)
  - [B.3 模块内容结构](#b3-模块内容结构)
  - [B.4 模块 YAML 翻译词典](#b4-模块-yaml-翻译词典)
- [维护脚本](#维护脚本)
- [常见问题](#常见问题)

---

## 项目概述

### 项目信息

| 项目 | 说明 |
|------|------|
| **项目名称** | Bubble Card 中文汉化版 |
| **中文仓库** | [buynow2010/bubble-card-zh](https://github.com/buynow2010/bubble-card-zh) |
| **原版仓库** | [Clooos/Bubble-Card](https://github.com/Clooos/Bubble-Card) |
| **当前版本** | v3.1.0-zh |
| **本地工作目录** | 需克隆: `git clone https://github.com/buynow2010/bubble-card-zh.git` |
| **脚本目录** | 当前目录下 `scripts/` |

### 项目包含两大独立工作

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  【Part A】Bubble Card 主程序汉化     【Part B】模块社区商店汉化          │
│  ═══════════════════════════        ═══════════════════════════        │
│                                                                        │
│  目标文件:                           目标位置:                           │
│  dist/bubble-card-zh.js              GitHub Discussions                 │
│                                      (分享模块 分类)                     │
│                                                                        │
│  工作内容:                           工作内容:                           │
│  ├── 翻译编辑器 UI 字符串             ├── 从原版仓库搬运模块               │
│  ├── 翻译菜单和提示信息               ├── 翻译与合规过滤                   │
│  └── 修改 API 端点                   └── 结构校验 (100% 在线安装)         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# Part A：Bubble Card 主程序汉化

> **目标**: 将 `dist/bubble-card.js` 中的所有英文 UI 字符串翻译为中文

---

## A.1 工作内容

将主程序中的所有英文 UI 字符串翻译为中文：

| 翻译范围 | 示例 |
|----------|------|
| 卡片类型 | Button → 按钮, Cover → 窗帘 |
| 编辑器菜单 | Card settings → 卡片设置 |
| 模块商店 UI | Module Store → 模块商店 |
| 提示信息 | Rate limit reached → 已达到速率限制 |

## A.2 汉化流程

### A.2.1 汉化策略

> [!IMPORTANT]
> **策略**: 直接修改 `dist/bubble-card.js` 构建产物，而非修改源码重新构建

**优点**：
- 避开复杂的 webpack 构建链
- 可快速迭代修复
- 不依赖上游构建环境

**注意事项**：
- 每次上游版本更新需重新应用翻译
- 使用 `sed`/`perl` 替换时需精确匹配，避免误伤代码

### A.2.2 一键汉化命令

```bash
# 首先克隆仓库（如果还没有）
# git clone https://github.com/buynow2010/bubble-card-zh.git
cd bubble-card-zh/

# 1. 下载上游最新版本
curl -L "https://github.com/Clooos/Bubble-Card/releases/latest/download/bubble-card.js" \
     -o dist/bubble-card.js

# 2. 复制并重命名
cp dist/bubble-card.js dist/bubble-card-zh.js

# 3. 修改 API 端点指向中文仓库（关键！）
sed -i '' 's|Clooos/Bubble-Card/discussions|buynow2010/bubble-card-zh/discussions|g' dist/bubble-card-zh.js
sed -i '' 's|"Share your Modules"|"分享模块"|g' dist/bubble-card-zh.js

# 4. 应用翻译 (根据 A.3 翻译对照表)
# ... (详细 sed 命令)

# 5. 验证
grep "X-GitHub-Api-Version" dist/bubble-card-zh.js  # 必须存在
grep "分享模块" dist/bubble-card-zh.js              # 必须存在
```

### A.2.3 发布流程

```bash
# 提交更改
git add dist/bubble-card-zh.js
git commit -m "feat: 更新汉化 v3.1.0-zh"
git push origin main

# 更新 GitHub Release
gh release upload v3.1.0-zh dist/bubble-card-zh.js --clobber
```

### A.2.4 翻译替换规范

| 规则 | 示例 |
|------|------|
| ✅ HTML 标签匹配 | `s/>Layout</>布局</g` |
| ✅ 带引号匹配 | `s/"Card settings"/"卡片设置"/g` |
| ❌ 禁止翻译代码关键字 | `and`, `or`, `function`, `return` |

---

## A.3 主程序完整翻译对照表

> [!IMPORTANT]
> **以下是主程序 UI 的完整翻译对照表，共 18 个分类，200+ 条翻译**

### A.3.1 卡片类型翻译

| 英文 | 中文 |
|------|------|
| Button | 按钮 |
| Cover | 窗帘 |
| Climate | 温控器 |
| Media player | 媒体播放器 |
| Pop-up | 弹出窗口 |
| Separator | 分隔符 |
| Horizontal buttons stack | 水平按钮堆栈 |
| Empty column | 空白列 |
| Calendar | 日历 |
| Select | 选择菜单 |
| Sub-button | 子按钮 |

### A.3.2 卡片信息标题

| 英文 | 中文 |
|------|------|
| Button card | 按钮卡片 |
| Cover card | 窗帘卡片 |
| Climate card | 空调卡片 |
| Media player card | 媒体播放器卡片 |
| Select card | 选择菜单卡片 |
| Calendar card | 日历卡片 |
| Separator card | 分隔符卡片 |
| Empty column card | 空白列卡片 |
| Horizontal buttons stack card | 水平按钮组卡片 |
| Sub-button card | 子按钮卡片 |

### A.3.3 编辑器菜单

| 英文 | 中文 |
|------|------|
| APPLY TO | 应用于 |
| All cards | 所有卡片 |
| This card | 此卡片 |
| Card settings | 卡片设置 |
| Styling options | 样式选项 |
| Sub-buttons editor | 子按钮编辑器 |
| Styling and layout options | 样式与布局选项 |
| Layout | 布局 |
| Modules | 模块 |
| New button | 新建按钮 |
| Add | 添加 |
| Paste | 粘贴 |
| Copy | 复制 |
| Delete | 删除 |
| Create Pop-up | 创建弹出窗口 |
| Import Module | 导入模块 |
| Create new Module | 创建新模块 |
| Import from YAML | 从 YAML 导入 |
| Export Module | 导出模块 |

### A.3.4 展开面板标题

| 英文 | 中文 |
|------|------|
| Card settings | 卡片设置 |
| Climate settings | 空调设置 |
| Cover styling | 窗帘样式 |
| Media player settings | 媒体播放器设置 |
| Media player styling | 媒体播放器样式 |
| Header settings | 页眉设置 |
| Pop-up settings | 弹出窗口设置 |
| Pop-up trigger | 弹出窗口触发器 |
| Pop-up open/close action | 弹出窗口开关动作 |
| Pop-up styling | 弹出窗口样式 |
| Horizontal buttons stack styling | 水平按钮组样式 |
| Button layout | 按钮布局 |
| Tap action on button | 按钮点击动作 |
| Tap action on icon | 图标点击动作 |
| Tap action on card | 卡片点击动作 |
| Double tap action | 双击动作 |
| Hold action | 按住动作 |
| Open action | 开启动作 |
| Close action | 关闭动作 |

### A.3.5 模块商店 UI

| 英文 | 中文 |
|------|------|
| Module Store | 模块商店 |
| My Modules | 我的模块 |
| Alphabetical | 字母顺序 |
| Recent first | 最近优先 |
| Search modules... | 搜索模块... |
| Install | 安装 |
| Remove | 移除 |
| Installed | 已安装 |
| More info / Report issue | 更多信息 / 问题反馈 |
| Share your module | 分享您的模块 |
| Share module to store | 分享模块到商店 |
| Save module | 保存模块 |
| Delete module | 删除模块 |
| Refresh module list | 刷新模块列表 |
| Enable unsupported modules | 启用不支持的模块 |
| Only show compatible modules | 仅显示兼容此卡片的模块 |
| Creator | 作者 |
| Version | 版本 |
| Created | 创建者 |

### A.3.6 提示信息

| 英文 | 中文 |
|------|------|
| Connecting to GitHub | 正在连接到 GitHub |
| Loading from cache | 正在从缓存加载 |
| Downloading module data | 正在下载模块数据 |
| Rate limit reached | 已达到速率限制 |
| GitHub API rate limit was reached | 已达到 GitHub API 请求限制 |
| The module list is loaded from cache | 模块列表来自缓存 |
| Please try again in | 请在 |
| minute | 分钟后 |
| hour | 小时后 |
| Rate limit reached - Using cached data | 已达到速率限制 - 正在使用缓存数据 |
| Loading failed | 加载失败 |
| Complete | 完成 |
| Busy | 忙碌 |
| Available | 可用 |
| Not recommended | 不推荐 |
| Not compatible | 不兼容 |
| Read only | 只读 |

### A.3.7 编辑器配置项

| 英文 | 中文 |
|------|------|
| Name | 名称 |
| Icon | 图标 |
| Entity | 实体 |
| Card type | 卡片类型 |
| Button type | 按钮类型 |
| Optional - Name | 可选 - 名称 |
| Optional - Icon | 可选 - 图标 |
| Optional - Entity | 可选 - 实体 |
| Optional - Light / Light group | 可选 - 灯 / 灯组 |
| Optional - Select menu | 可选 - 选择菜单 |
| Optional - Motion / Occupancy sensor | 可选 - 人体 / 占用传感器 |
| Dropdown / Select | 下拉 / 选择 |
| Default | 默认 |
| Custom | 自定义 |
| Variable | 变量 |
| Code | 代码 |

### A.3.8 按钮类型

| 英文 | 中文 |
|------|------|
| Switch | 开关 |
| Slider | 滑块 |
| State | 状态 |
| Name / Text | 名称/文本 |
| Dropdown / Select | 下拉菜单 / 选择 |

### A.3.9 布局选项

| 英文 | 中文 |
|------|------|
| Large | 大尺寸 |
| Center | 居中 |
| Left | 左侧 |
| Right | 右侧 |
| Top | 顶部 |
| Bottom | 底部 |
| Side by side | 并排 |
| Vertical stack | 垂直堆叠分组 |
| Fill available width | 填充可用宽度 |
| Fill from left | 从左侧填充 |
| Fill from right | 从右侧填充 |
| Fill from top | 从顶部填充 |
| Fill from bottom | 从底部填充 |
| Fixed | 固定 |
| Fixed at bottom | 固定在底部 |
| Icon on left | 图标在左侧 |
| Icon on right | 图标在右侧 |
| Icon on top | 图标在顶部 |
| Icon on bottom | 图标在底部 |
| Icon, Name, State | 图标、名称、状态 |
| Even alignment | 平均对齐 |
| Justified | 两端对齐 |
| Main sub-button (top) | 主子按钮 (顶部) |
| Bottom sub-buttons | 底部子按钮 |
| Main button position | 主按钮位置 |
| Button alignment | 按钮对齐 |
| Content layout | 内容布局 |
| Group position | 分组位置 |
| Group name | 分组名称 |
| Group sub-buttons | 分组子按钮 |

### A.3.10 滑块与控制

| 英文 | 中文 |
|------|------|
| Brightness | 亮度 |
| Media player (Volume) | 媒体播放器 (音量) |
| Always show slider | 始终显示滑块 |
| Allow slider to turn off light | 允许滑块关闭灯光 |
| Reverse slider direction | 反转滑块方向 |
| Enable smooth brightness transition | 启用平滑亮度过渡 |
| Use accent color instead of light color | 使用强调色代替灯光颜色 |
| Read-only slider | 只读滑块 |
| Value position | 值位置 |
| Fill equals minimum | 填充等于最小值 |
| Fill direction | 填充方向 |

### A.3.11 弹出窗口选项

| 英文 | 中文 |
|------|------|
| Pop-up hash / Link | 弹出窗口链接 |
| Must be unique | 必须唯一 |
| As pop-up header | 作为弹出窗口页眉 |
| Margin | 外边距 |
| Desktop width | 桌面端宽度 |
| Dark overlay behind pop-up | 弹出窗口背后的深色叠加层 |
| Update cards in background | 在后台更新卡片 |
| Hide when parent entity is unavailable | 当父实体不可用时隐藏 |
| Pop-up usage guide | 弹出窗口使用指南 |
| Allow opening dashboard pages | 允许您打开弹出窗口或仪表板的任何页面 |

### A.3.12 媒体播放器选项

| 英文 | 中文 |
|------|------|
| Optional - Hide previous button | 可选 - 隐藏上一曲按钮 |
| Optional - Hide next button | 可选 - 隐藏下一曲按钮 |
| Optional - Hide play/pause button | 可选 - 隐藏播放/暂停按钮 |
| Optional - Hide volume button | 可选 - 隐藏音量按钮 |
| Optional - Hide power button | 可选 - 隐藏电源按钮 |
| Optional - Blur media cover as background | 可选 - 背景虚化媒体封面 |
| Full width action buttons | 全宽操作按钮 |
| Full width footer | 全宽页脚 |

### A.3.13 温控器选项

| 英文 | 中文 |
|------|------|
| Optional - Hide temperature control | 可选 - 隐藏温度控制 |
| Optional - Hide target temperature low | 可选 - 隐藏目标低温 |
| Optional - Hide target temperature high | 可选 - 隐藏目标高温 |

### A.3.14 窗帘选项

| 英文 | 中文 |
|------|------|
| Optional - Open service | 可选 - 开启服务 |
| Optional - Close service | 可选 - 关闭服务 |
| Optional - Stop service | 可选 - 停止服务 |
| Optional - Open icon | 可选 - 开启状态图标 |
| Optional - Close icon | 可选 - 关闭状态图标 |
| Optional - Up arrow icon | 可选 - 向上箭头图标 |
| Optional - Down arrow icon | 可选 - 向下箭头图标 |

### A.3.15 状态与样式

| 英文 | 中文 |
|------|------|
| Background color based on light color | 基于灯光颜色的背景颜色 |
| Background color based on state | 基于状态的背景颜色 |
| Show background when entity is on | 实体开启时显示背景 |
| Keep background color when on | 开启时保持背景颜色 |
| Icon takes priority over entity picture | 图标优先于实体图片 |
| Force saturation value | 强制饱和度值 |
| Highlight current page/view | 高亮当前页面/视图 |
| Fix centering for some themes | 修复某些主题的居中问题 |

### A.3.16 动作类型

| 英文 | 中文 |
|------|------|
| Toggle | 切换 |
| More info | 更多信息 |
| Navigate | 导航 |
| URL | 链接 |
| Call service | 调用服务 |
| Assist | 助手 |
| None | 无 |

### A.3.17 分类名称 (API)

| 英文 | 中文 |
|------|------|
| Share your Modules | 分享模块 |

---

## A.4 API 端点替换规范

```bash
# 原版端点
Clooos/Bubble-Card/discussions

# 中文端点  
buynow2010/bubble-card-zh/discussions
```

---

# Part B：模块社区商店汉化

> **目标**: 将原版仓库的模块 Discussions 迁移到中文仓库，并进行汉化

> [!WARNING]
> **收费模块处理原则**: 
> 1. **不迁移、不汉化**: 所有在原仓库中标注为付费（如 Gumroad 销售）或缺失核心 `code:` 字段的模块，**严禁**同步到中文仓库。
> 2. **保持纯净**: 中文商店仅保留免费且可一键在线安装的模块，以确保最佳用户体验。
> 3. **识别特征**: 包含 `Gumroad`, `Buy`, `Purchase`, `价格`, `购买` 等关键字，或 YAML 中无代码逻辑。

---

## B.1 工作内容

将原版仓库 (Clooos/Bubble-Card) 的模块 Discussions 迁移到中文仓库：

| 迁移内容 | 说明 |
|----------|------|
| Discussion 标题 | 翻译为中文模块名称 |
| 模块描述 | 翻译 `description:` 字段 |
| YAML name 字段 | 替换为中文名称 |
| editor labels | 翻译配置选项标签 |

## B.2 模块商店架构

```
原版仓库 (Clooos/Bubble-Card)
    └── Discussions
        └── "Share your Modules" 分类
            └── 模块帖子 (含 YAML 代码块)
                    ↓ 迁移 + 汉化
中午仓库 (ha-china/bubble-card-zh)
    └── Discussions  
        └── "分享模块" 分类
            └── 汉化后的模块帖子 (77个)
```

## B.3 模块内容结构

每个模块 Discussion 包含：

```markdown
# 模块中文名称

模块描述（已翻译为中文）

**原作者**: @xxx | **原帖**: https://github.com/Clooos/...

---

<details>
<summary><b>🧩 获取此模块</b></summary>

```yaml
module_name:
  name: "模块中文名称"      # ← 需要翻译
  version: "1.0"
  description: |            # ← 需要翻译
    模块描述...
  editor:
    - name: field_name      # ← 保留英文（代码变量）
      label: "字段标签"     # ← 需要翻译
```

</details>
```

### B.3.1 YAML 汉化范围

| 字段 | 是否翻译 | 说明 |
|------|----------|------|
| `name:` (模块级) | ✅ 翻译 | 模块商店显示的名称 |
| `description:` | ✅ 翻译 | 模块描述 |
| `label:` | ✅ 翻译 | 编辑器中的配置选项标签 |
| `title:` | ✅ 翻译 | 可折叠面板标题 |
| `name:` (字段级) | ❌ 保留 | 代码变量名，不能翻译 |
| `code:` | ❌ 保留 | JavaScript/CSS 代码 |
| `value:` | ❌ 保留 | 选项值 |

### B.3.2 批量汉化命令

```bash
# 在本维护目录下执行

# 设置 GitHub Token
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# 1. 全面修复所有模块 (name + description + labels)
python3 scripts/fix_all_modules.py

# 2. 单独处理 editor 标签
python3 scripts/translate_module_yaml_full.py

# 3. 同步缺失的 YAML 内容
python3 scripts/sync_missing_yaml.py
```

---

## B.4 模块 YAML 翻译词典

> [!IMPORTANT]
> **以下是模块 YAML 中 editor 标签的完整翻译词典**

### B.4.1 常见 editor 标签

| 英文 | 中文 |
|------|------|
| Color mode | 颜色模式 |
| Preset color | 预设颜色 |
| Color wheel | 调色盘 |
| Custom value | 自定义值 |
| JS template | JS 模板 |
| Opacity | 透明度 |
| Enable | 启用 |
| Conditions | 条件 |
| Icon | 图标 |
| Icon color | 图标颜色 |
| Icon background color | 图标背景颜色 |
| Background color | 背景颜色 |
| Card background color | 卡片背景颜色 |
| Card text color | 卡片文本颜色 |
| Minimum value | 最小值 |
| Maximum value | 最大值 |
| Progress Color | 进度颜色 |
| Custom state entity | 自定义状态实体 |
| Primary Color | 主色调 |

### B.4.2 可折叠面板标题

| 英文 | 中文 |
|------|------|
| Default configuration | 默认配置 |
| Conditional colors | 条件颜色 |
| Card Size Adjustments | 卡片尺寸调整 |
| Visual Enhancements | 视觉增强 |
| Gradient Effects | 渐变效果 |
| Contrast Helpers | 对比度辅助 |
| Main Icon | 主图标 |
| Sub Button | 子按钮 |

### B.4.3 扩展标签翻译

| 英文 | 中文 |
|------|------|
| Slider | 滑块 |
| Cover Image Entity | 封面图像实体 |
| Target Timer | 目标定时器 |
| Ring Color | 环形颜色 |
| Disable When | 禁用条件 |
| Arrow Position | 箭头位置 |
| Collapsed width | 折叠宽度 |
| Depth | 深度 |
| Highlight Opacity | 高亮透明度 |
| Apply to State Display | 应用到状态显示 |
| Decimal Places | 小数位数 |
| Badge Size | 徽章大小 |
| Window Speed | 窗口速度 |
| Loading Timeout | 加载超时 |
| Interpolate the colours | 插值颜色 |
| Orb Settings | 光球设置 |
| Use slow orb animation | 使用慢速光球动画 |
| Window animation style | 窗口动画样式 |
| HA Style | HA 样式 |

### B.4.4 动画相关

| 英文 | 中文 |
|------|------|
| Alert | 警报 |
| Boil | 沸腾 |
| Bounce | 弹跳 |
| Spin | 旋转 |
| Glow | 发光 |
| Float | 浮动 |
| Zoom | 缩放 |
| Robot Vacuum | 扫地机器人 |
| Robot Mower | 割草机 |
| Washing Machine | 洗衣机 |
| Dishwasher | 洗碗机 |
| Dryer | 烘干机 |
| Radiator | 暖气片 |

### B.4.5 描述翻译

| 英文 | 中文 |
|------|------|
| This module allows you to | 此模块允许您 |
| This module extends | 此模块扩展了 |
| This module lets you | 此模块让您 |
| This module is | 此模块是 |
| based on entity state | 基于实体状态 |
| based on entity condition | 基于实体条件 |
| with custom colors | 使用自定义颜色 |
| for Bambulab printers | 用于拓竹打印机 |
| Frosted glass design | 毛玻璃设计 |
| A progress bar for timers | 定时器进度条 |
| Transform your Bubble Cards into | 将您的 Bubble 卡片转换为 |
| Add compass arrows | 添加指南针箭头 |
| That card creates | 此卡片创建 |
| this is a port for bubble-card | 这是 bubble-card 的移植版 |

---

# 维护脚本

| 脚本路径 | 用于 | 说明 |
|----------|------|------|
| `scripts/translate_module_yaml.py` | Part B | 翻译 editor 标签 (基础版) |
| `scripts/translate_module_yaml_full.py` | Part B | 翻译 editor 标签 (完整版) |
| `scripts/sync_missing_yaml.py` | Part B | 从原版同步缺失的 YAML |
| `scripts/fix_all_modules.py` | Part B | 全面修复 (name+desc+labels) |
| `scripts/fix_all_modules_complete.py` | Part B | **综合修复脚本 (推荐)** |
| `scripts/fix_final_v3.py` | Part B | **极致修复脚本 v3** (处理深度翻译) |
| `scripts/apply_ai_translations.py` | Part B | **AI 描述批量回填脚本** |
| `scripts/format_validator.py` | Part B | **格式验证与修复脚本** |
| `scripts/module_auditor.py` | Part B | **模块详细审计脚本 (核心工具)** |

## 格式验证脚本 (format_validator.py)

验证所有模块的 YAML 格式是否符合在线安装要求：

| 检查项 | 说明 |
|--------|------|
| YAML 存在 | 验证是否有 YAML 代码块 |
| details 结构 | 检查是否使用 `<details>` 包装 |
| 标准标题 | 检查是否有 🧩 获取此模块 标题 |
| description 格式 | 检查是否使用块标量 `|` |
| YAML 语法 | 基本语法检查 |

**使用方法**:

```bash
# 只检查
python3 scripts/format_validator.py

# 详细输出
python3 scripts/format_validator.py --verbose

# 自动修复
python3 scripts/format_validator.py --fix
```

> **最新验证结果 (2026-01-20)**: 42 个模块全部可在线安装，0 个严重错误

## 综合修复脚本 (fix_all_modules_complete.py)

这是最完整的修复脚本，包含以下功能：

| 功能 | 说明 |
|------|------|
| 同步 YAML | 从原版仓库获取缺失的 YAML 代码块 |
| 翻译标题 | 将英文标题翻译为中文 |
| 翻译描述 | 翻译 YAML 中的 description 字段 |
| 翻译标签 | 翻译 editor 中的 label 和 title 字段 |

**使用方法**:

```bash
# 在本维护目录下执行
# Token 已保存在 .env 文件
source .env
python3 scripts/fix_all_modules_complete.py
```

---

# 常见问题

## Part A 相关问题

### 问题: 编辑器中 "APPLY TO"、"All cards" 显示英文

**原因**: 主程序 `bubble-card-zh.js` 未翻译

**解决**: 已在 v3.1.0+ 版本修复，翻译为"应用于"和"所有卡片"

### 问题: 编辑器中 "Configuration" 显示英文

**原因**: 来自 Home Assistant 框架本身，不属于 Bubble Card

**解决**: 无法在 Bubble Card 层面修复，需要 HA 本身支持多语言

---

## Part B 相关问题

### 问题: 模块商店显示英文标题和描述

**原因**: YAML 中的 `name:` 和 `description:` 字段仍为英文

**解决**: 
```bash
export GITHUB_TOKEN="ghp_xxxx"
python3 scripts/fix_all_modules_complete.py
```

### 问题: 部分模块只能离线安装

**原因**: Discussion 中缺少 YAML 代码块 (` ```yaml ` 代码块)

**解决**:
```bash
export GITHUB_TOKEN="ghp_xxxx"
python3 scripts/fix_all_modules_complete.py
```

### 问题: 模块安装后配置菜单显示英文

**原因**: YAML 中的 `label:` 和 `title:` 字段未翻译

**解决**:
```bash
export GITHUB_TOKEN="ghp_xxxx"
python3 scripts/fix_final_v3.py
```

### 问题: GitHub API 更新讨论失败 (Errors in mutation)

**原因**: GITHUB_TOKEN 权限不足，缺少 `Discussions: Read and write` 权限。

**解决**: 重新生成 Token 并勾选 `Discussions` 的写权限，更新 `.env` 文件。

### 问题: 模块在商店显示但没有「安装」按钮

**原因**: YAML 格式不规范（如 description 第一行包含 HTML，或没有使用 `|` 块标量），导致前端解析失败。

**解决**: 使用 `scripts/format_validator.py --fix` 自动修复格式。

---

## 通用问题

### 问题: 用户仍看到英文内容

**原因**: 浏览器缓存

**解决**:
1. 按 `Ctrl+Shift+R` 强制刷新
2. 在控制台执行: `localStorage.removeItem('bubble-card-modules-cache')`

---

## 2026-01-20 极致汉化审计与根因分析 (Final Audit)

实现了 100% 的汉化覆盖率与 100% 的在线安装兼容性，剔除了所有非精品模块。

| 检查项 | 修复前 | 修复后 | 状态 |
|--------|--------|--------|------|
| 总模块数 | 78 (原版) | **42 (中文)** | ✅ 深度精选 |
| 完全汉化数 | 19 (24%) | **42 (100%)** | ✅ 完美达成 |
| 描述覆盖 | 21 (27%) | **42 (100%)** | ✅ 全部中文 |
| 在线安装率 | ~15% | **100%** | ✅ 全量一键安装 |

### 关键运维经验记录 (Knowledge Base)

1. **Token 权限陷阱**: 修改 Discussion 必须拥有 `Discussions` 的写权限，仅有 `Contents` 权限是不够的。
2. **YAML 解析安全 (核心避坑指南)**:
   - `description:` 必须配合 `|` 使用。
   - **严禁**在 `description:` 的第一行直接写 `<b>` 等 HTML 标签，这会破坏 Home Assistant 的前端解析，导致安装按钮消失。
   - **幂等性检查**: 批量替换脚本必须具备幂等性，否则多次执行会导致键值对（如 `name`, `description`）无限堆叠，造成 **YAML数据体积爆炸** 从而导致商店加载时卡死（Loading from cache 100%）。
   - **保留关键字**: `color`, `rgb_color`, `colors` 等是 YAML 配置或 CSS 变量中的关键 key，**绝对不能汉化为「颜色」**，否则会导致 JS 逻辑无法识别配置项。
3. **付费模块排除规则 (重要)**: 维护过程中如发现模块原帖包含 `Gumroad` 等付费链接，或本地扫描发现缺失 `code:` 字段（即无脚本逻辑），应立即停止汉化并从商店中删除，严禁将收费或无法自动安装的内容引入汉化商店。
4. **手动安装根因 (Upstream Limitation)**: 
   - 官方仓库中 83% 的模块（65/78）本身不支持在线安装，原因在于原作者未提供符合规范的 `code:` 字段或封装为 JS 逻辑。这属于上游局限性。
   - 中文仓库已于 2026-01-20 完成全量清理，仅保留经审计可在线安装的 42 个精品模块。
5. **审计驱动开发**: 维护大量模块时，应遵循「扫描 -> 报告 -> 修复 -> 再扫描」的闭环。依靠 `scripts/module_auditor.py` 生成的报告来指导修复工作。

所有 42 个模块的描述已经通过扩展翻译词典进行了修复。

**问题 3: 作者名称过长 (已修复)**

- `HyperCriSiS (Modified from MrBearPresident's original, optimized for large layout)` → `HyperCriSiS`

---

# 后续工作 TODO

- [ ] 上游版本更新时重新应用翻译 (Part A)
- [ ] 新模块发布时需迁移并汉化 (Part B)
- [ ] 持续优化翻译词典覆盖率
- [ ] 定期运行 `fix_all_modules_complete.py` 检查遗漏
- [ ] 定期运行 `format_validator.py` 验证模块格式

## 已完成 ✅

- [x] 格式验证脚本创建 (2026-01-19)
- [x] 77 个模块格式验证通过，全部可在线安装
- [x] GitHub Token 保存到 `.env` 文件


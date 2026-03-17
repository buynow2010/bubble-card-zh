import re
import os

target_file = 'dist/bubble-card.js'

# Load the file
with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. API Endpoints and Core Categorization
# Using the NEW repository ha-china/bubble-card-zh
replacements = [
    (r'Clooos/Bubble-Card/discussions', 'ha-china/bubble-card-zh/discussions'),
    (r'"Share your Modules"', '"分享模块"'),
]

# Helper to add dictionary to r_list with quoting and tags
def add_to_replacements(dictionary, r_list):
    # Sort by length descending to avoid partial matches
    sorted_keys = sorted(dictionary.keys(), key=len, reverse=True)
    for k in sorted_keys:
        v = dictionary[k]
        # Quoted strings
        r_list.append((r'"' + re.escape(k) + r'"', r'"' + v + r'"'))
        r_list.append((r"'" + re.escape(k) + r"'", r"'" + v + r"'"))
        r_list.append((r"`" + re.escape(k) + r"`", r"`" + v + r"`"))
        # lit-html text nodes (surrounded by tags or newlines)
        r_list.append((r'(>\s*)' + re.escape(k) + r'(\s*<)', r'\g<1>' + v + r'\g<2>'))
        r_list.append((r'(\n\s*)' + re.escape(k) + r'(\s*\n)', r'\g<1>' + v + r'\g<2>'))
        r_list.append((r'(\n\s*)' + re.escape(k) + r'(\s*<)', r'\g<1>' + v + r'\g<2>'))
        r_list.append((r'(>\s*)' + re.escape(k) + r'(\s*\n)', r'\g<1>' + v + r'\g<2>'))

# Data from maintenance_manual.md A.3.1 - A.3.16
data = {
    # A.3.1 Card type
    "Button": "按钮", "Cover": "窗帘", "Climate": "温控器", "Media player": "媒体播放器",
    "Pop-up": "弹出窗口", "Separator": "分隔符", "Horizontal buttons stack": "水平按钮堆栈",
    "Empty column": "空白列", "Calendar": "日历", "Select": "选择菜单", "Sub-button": "子按钮",

    # A.3.2 Card info titles
    "Button card": "按钮卡片", "Cover card": "窗帘卡片", "Climate card": "空调卡片",
    "Media player card": "媒体播放器卡片", "Select card": "选择菜单卡片", "Calendar card": "日历卡片",
    "Separator card": "分隔符卡片", "Empty column card": "空白列卡片",
    "Horizontal buttons stack card": "水平按钮组卡片", "Sub-button card": "子按钮卡片",

    # A.3.3 Editor menu
    "APPLY TO": "应用于", "All cards": "所有卡片", "This card": "此卡片", "Card settings": "卡片设置",
    "Styling options": "样式选项", "Sub-buttons editor": "子按钮编辑器",
    "Styling and layout options": "样式与布局选项", "Layout": "布局", "Modules": "模块",
    "New button": "新建按钮", "Add": "添加", "Paste": "粘贴", "Copy": "复制", "Delete": "删除",
    "Create Pop-up": "创建弹出窗口", "Import Module": "导入模块", "Create new Module": "创建新模块",
    "Import from YAML": "从 YAML 导入", "Export Module": "导出模块",

    # A.3.4 Expand panel titles
    # Card settings is already in A.3.3
    "Climate settings": "空调设置", "Cover styling": "窗帘样式", "Media player settings": "媒体播放器设置",
    "Media player styling": "媒体播放器样式", "Header settings": "页眉设置", "Pop-up settings": "弹出窗口设置",
    "Pop-up trigger": "弹出窗口触发器", "Pop-up open/close action": "弹出窗口开关动作",
    "Pop-up styling": "弹出窗口样式", "Horizontal buttons stack styling": "水平按钮组样式",
    "Button layout": "按钮布局", "Tap action on button": "按钮点击动作", "Tap action on icon": "图标点击动作",
    "Tap action on card": "卡片点击动作", "Double tap action": "双击动作", "Hold action": "按住动作",
    "Open action": "开启动作", "Close action": "关闭动作",

    # A.3.5 Module store UI
    "Module Store": "模块商店", "My Modules": "我的模块", "Alphabetical": "字母顺序",
    "Recent first": "最近优先", "Search modules...": "搜索模块...", "Install": "安装",
    "Remove": "移除", "Installed": "已安装", "More info / Report issue": "更多信息 / 问题反馈",
    "Share your module": "分享您的模块", "Share module to store": "分享模块到商店",
    "Save module": "保存模块", "Delete module": "删除模块", "Refresh module list": "刷新模块列表",
    "Enable unsupported modules": "启用不支持的模块", "Only show compatible modules": "仅显示兼容此卡片的模块",
    "Creator": "作者", "Version": "版本", "Created": "创建者",

    # A.3.6 Tips / Status messages
    "Connecting to GitHub": "正在连接到 GitHub", "Loading from cache": "正在从缓存加载",
    "Downloading module data": "正在下载模块数据", "Rate limit reached": "已达到速率限制",
    "GitHub API rate limit was reached": "已达到 GitHub API 请求限制",
    "The module list is loaded from cache": "模块列表来自缓存", "Please try again in": "请在",
    "minute": "分钟后", "hour": "小时后", "Rate limit reached - Using cached data": "已达到速率限制 - 正在使用缓存数据",
    "Loading failed": "加载失败", "Complete": "完成", "Busy": "忙碌", "Available": "可用",
    "Not recommended": "不推荐", "Not compatible": "不兼容", "Read only": "只读",

    # A.3.7 Editor config items
    "Name": "名称", "Icon": "图标", "Entity": "实体", "Card type": "卡片类型", "Button type": "按钮类型",
    "Optional - Name": "可选 - 名称", "Optional - Icon": "可选 - 图标", "Optional - Entity": "可选 - 实体",
    "Optional - Light / Light group": "可选 - 灯 / 灯组", "Optional - Select menu": "可选 - 选择菜单",
    "Optional - Motion / Occupancy sensor": "可选 - 人体 / 占用传感器", "Dropdown / Select": "下拉 / 选择",
    "Default": "默认", "Custom": "自定义", "Variable": "变量", "Code": "代码",

    # A.3.8 Button types
    "Switch": "开关", "Slider": "滑块", "State": "状态", "Name / Text": "名称/文本",
    # Dropdown / Select already in A.3.7

    # A.3.9 Layout options
    "Large": "大尺寸", "Center": "居中", "Left": "左侧", "Right": "右侧", "Top": "顶部", "Bottom": "底部",
    "Side by side": "并排", "Vertical stack": "垂直堆叠分组", "Fill available width": "填充可用宽度",
    "Fill from left": "从左侧填充", "Fill from right": "从右侧填充", "Fill from top": "从顶部填充",
    "Fill from bottom": "从底部填充", "Fixed": "固定", "Fixed at bottom": "固定在底部",
    "Icon on left": "图标在左侧", "Icon on right": "图标在右侧", "Icon on top": "图标在顶部",
    "Icon on bottom": "图标在底部", "Icon, Name, State": "图标、名称、状态", "Even alignment": "平均对齐",
    "Justified": "两端对齐", "Main sub-button (top)": "主子按钮 (顶部)", "Bottom sub-buttons": "底部子按钮",
    "Main button position": "主按钮位置", "Button alignment": "按钮对齐", "Content layout": "内容布局",
    "Group position": "分组位置", "Group name": "分组名称", "Group sub-buttons": "分组子按钮",

    # A.3.10 Sliders and Control
    "Brightness": "亮度", "Media player (Volume)": "媒体播放器 (音量)", "Always show slider": "始终显示滑块",
    "Allow slider to turn off light": "允许滑块关闭灯光", "Reverse slider direction": "反转滑块方向",
    "Enable smooth brightness transition": "启用平滑亮度过渡",
    "Use accent color instead of light color": "使用强调色代替灯光颜色", "Read-only slider": "只读滑块",
    "Value position": "值位置", "Fill equals minimum": "填充等于最小值", "Fill direction": "填充方向",

    # A.3.11 Pop-up options
    "Pop-up hash / Link": "弹出窗口链接", "Must be unique": "必须唯一", "As pop-up header": "作为弹出窗口页眉",
    "Margin": "外边距", "Desktop width": "桌面端宽度", "Dark overlay behind pop-up": "弹出窗口背后的深色叠加层",
    "Update cards in background": "在后台更新卡片", "Hide when parent entity is unavailable": "当父实体不可用时隐藏",
    "Pop-up usage guide": "弹出窗口使用指南", "Allow opening dashboard pages": "允许您打开弹出窗口或仪表板的任何页面",

    # A.3.12 Media player options
    "Optional - Hide previous button": "可选 - 隐藏上一曲按钮", "Optional - Hide next button": "可选 - 隐藏下一曲按钮",
    "Optional - Hide play/pause button": "可选 - 隐藏播放/暂停按钮", "Optional - Hide volume button": "可选 - 隐藏音量按钮",
    "Optional - Hide power button": "可选 - 隐藏电源按钮", "Optional - Blur media cover as background": "可选 - 背景虚化媒体封面",
    "Full width action buttons": "全宽操作按钮", "Full width footer": "全宽页脚",

    # A.3.13 Climate options
    "Optional - Hide temperature control": "可选 - 隐藏温度控制", "Optional - Hide target temperature low": "可选 - 隐藏目标低温",
    "Optional - Hide target temperature high": "可选 - 隐藏目标高温",

    # A.3.14 Cover options
    "Optional - Open service": "可选 - 开启服务", "Optional - Close service": "可选 - 关闭服务",
    "Optional - Stop service": "可选 - 停止服务", "Optional - Open icon": "可选 - 开启状态图标",
    "Optional - Close icon": "可选 - 关闭状态图标", "Optional - Up arrow icon": "可选 - 向上箭头图标",
    "Optional - Down arrow icon": "可选 - 向下箭头图标",

    # A.3.15 State and style
    "Background color based on light color": "基于灯光颜色的背景颜色", "Background color based on state": "基于状态的背景颜色",
    "Show background when entity is on": "实体开启时显示背景", "Keep background color when on": "开启时保持背景颜色",
    "Icon takes priority over entity picture": "图标优先于实体图片", "Force saturation value": "强制饱和度值",
    "Highlight current page/view": "高亮当前页面/视图", "Fix centering for some themes": "修复某些主题的居中问题",

    # A.3.16 Action types
    "Toggle": "切换", "More info": "更多信息", "Navigate": "导航", "URL": "链接",
    "Call service": "调用服务", "Assist": "助手", "None": "无",

    # B.4.1 常见 editor 标签
    "Color mode": "颜色模式", "Preset color": "预设颜色", "Color wheel": "调色盘",
    "Custom value": "自定义值", "JS template": "JS 模板", "Opacity": "透明度",
    "Enable": "启用", "Conditions": "条件", "Icon color": "图标颜色",
    "Icon background color": "图标背景颜色", "Background color": "背景颜色",
    "Card background color": "卡片背景颜色", "Card text color": "卡片文本颜色",
    "Minimum value": "最小值", "Maximum value": "最大值", "Progress Color": "进度颜色",
    "Custom state entity": "自定义状态实体", "Primary Color": "主色调",

    # B.4.2 可折叠面板标题
    "Default configuration": "默认配置", "Conditional colors": "条件颜色",
    "Card Size Adjustments": "卡片尺寸调整", "Visual Enhancements": "视觉增强",
    "Gradient Effects": "渐变效果", "Contrast Helpers": "对比度辅助",
    "Main Icon": "主图标", "Sub Button": "子按钮",

    # B.4.3 扩展标签翻译
    "Cover Image Entity": "封面图像实体", "Target Timer": "目标定时器",
    "Ring Color": "环形颜色", "Disable When": "禁用条件", "Arrow Position": "箭头位置",
    "Collapsed width": "折叠宽度", "Depth": "深度", "Highlight Opacity": "高亮透明度",
    "Apply to State Display": "应用到状态显示", "Decimal Places": "小数位数",
    "Badge Size": "徽章大小", "Window Speed": "窗口速度", "Loading Timeout": "加载超时",
    "Interpolate the colours": "插值颜色", "Orb Settings": "光球设置",
    "Use slow orb animation": "使用慢速光球动画", "Window animation style": "窗口动画样式",
    "HA Style": "HA 样式",

    # B.4.4 动画相关
    "Alert": "警报", "Boil": "沸腾", "Bounce": "弹跳", "Spin": "旋转", "Glow": "发光",
    "Float": "浮动", "Zoom": "缩放", "Robot Vacuum": "扫地机器人", "Robot Mower": "割草机",
    "Washing Machine": "洗衣机", "Dishwasher": "洗碗机", "Dryer": "烘干机", "Radiator": "暖气片",

    # B.4.5 描述翻译
    "This module allows you to": "此模块允许您", "This module extends": "此模块扩展了",
    "This module lets you": "此模块让您", "This module is": "此模块是",
    "based on entity state": "基于实体状态", "based on entity condition": "基于实体条件",
    "with custom colors": "使用自定义颜色", "for Bambulab printers": "用于拓竹打印机",
    "Frosted glass design": "毛玻璃设计", "A progress bar for timers": "定时器进度条",
    "Transform your Bubble Cards into": "将您的 Bubble 卡片转换为",
    "Add compass arrows": "添加指南针箭头", "That card creates": "此卡片创建",
    "this is a port for bubble-card": "这是 bubble-card 的移植版"
}

# Special handling for A.3.17 already handled in 'replacements' initialized above.

add_to_replacements(data, replacements)

# Apply all replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open(target_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully applied 100% localization from manual to {target_file}")

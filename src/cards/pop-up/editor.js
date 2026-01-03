import { html } from 'lit';
import { fireEvent } from '../../tools/utils.js';
import { makeButtonSliderPanel } from '../../components/slider/editor.js';
import { renderButtonEditor } from '../button/editor.js';

// 按钮类型列表
function getButtonList() {
    return [
        { 'label': '开关', 'value': 'switch' },
        { 'label': '滑块', 'value': 'slider' },
        { 'label': '状态', 'value': 'state' },
        { 'label': '名称/文本', 'value': 'name' }
    ];
}

function findSuitableEntities(hass, entityType = 'light', limit = 2) {
    const entities = [];

    if (!hass || !hass.states) return entities;

    Object.keys(hass.states).forEach(entityId => {
        if (entities.length >= limit) return;

        if (entityId.startsWith(entityType + '.')) {
            const entity = hass.states[entityId];
            let supportsBrightness = false;

            if ('brightness' in entity.attributes) {
                supportsBrightness = true;
            }

            entities.push({
                entity: entityId,
                supportsBrightness: supportsBrightness
            });
        }
    });

    return entities;
}

function updateUIForVerticalStack(editor, isInVerticalStack) {
    if (!editor.shadowRoot) return;

    // 更新警告容器
    const alertContainer = editor.shadowRoot.querySelector('#vertical-stack-alert-container');
    if (alertContainer) {
        alertContainer.style.display = isInVerticalStack ? 'block' : 'none';
    }

    // 更新按钮图标和文本
    const buttonIcon = editor.shadowRoot.querySelector('.icon-button ha-icon');
    if (buttonIcon) {
        buttonIcon.icon = isInVerticalStack ? 'mdi:content-save' : 'mdi:plus';
    }

    const buttonText = editor.shadowRoot.querySelector('#button-text');
    if (buttonText) {
        buttonText.textContent = isInVerticalStack ? '更新哈希值' : '创建弹窗';
    }

    // 更新开关及其标签
    const exampleSwitch = editor.shadowRoot.querySelector('#include-example');
    if (exampleSwitch) {
        exampleSwitch.disabled = isInVerticalStack;
    }

    const exampleLabel = editor.shadowRoot.querySelector('.mdc-form-field .mdc-label');
    if (exampleLabel) {
        exampleLabel.textContent = '包含示例配置' +
            (isInVerticalStack ? '（已禁用，因为弹窗已在垂直堆栈中）' : '');
    }
}

function createPopUpConfig(editor, originalConfig) {
    try {
        // 检查是否已在垂直堆栈中
        const isInVerticalStack = window.popUpError === false;

        // 获取表单值
        const includeExample = editor.shadowRoot.querySelector("#include-example")?.checked || false;
        let hashValue = '#pop-up-name';
        const hashInput = editor.shadowRoot.querySelector('#hash-input');
        if (hashInput && hashInput.value) {
            hashValue = hashInput.value;
        }

        if (isInVerticalStack) {
            editor._config.hash = hashValue;
            fireEvent(editor, "config-changed", { config: editor._config });
            console.info("弹窗已在垂直堆栈中。哈希值已更新。注意：手动创建垂直堆栈已不再需要。");
            return;
        }

        if (includeExample) {
            const suitableEntities = findSuitableEntities(editor.hass);

            editor._config = {
                type: 'vertical-stack',
                cards: [
                    {
                        type: 'custom:bubble-card',
                        card_type: 'pop-up',
                        name: '客厅',
                        icon: 'mdi:sofa-outline',
                        hash: hashValue
                    },
                    {
                        type: 'custom:bubble-card',
                        card_type: 'separator',
                        name: '灯光（示例）',
                        icon: 'mdi:lightbulb-outline',
                    },
                    {
                        type: 'horizontal-stack',
                        cards: suitableEntities.length > 0 ? suitableEntities.map(entity => ({
                            type: 'custom:bubble-card',
                            card_type: 'button',
                            button_type: entity.supportsBrightness ? 'slider' : 'switch',
                            entity: entity.entity,
                            show_state: true,
                        })) : [
                            {
                                type: 'custom:bubble-card',
                                card_type: 'button',
                                button_type: 'name',
                                name: '落地灯',
                                icon: 'mdi:floor-lamp-outline',
                            }
                        ]
                    }
                ]
            };
        } else {
            // 只创建基本弹窗，不包含示例
            editor._config = {
                type: 'vertical-stack',
                cards: [
                    {
                        type: 'custom:bubble-card',
                        card_type: 'pop-up',
                        hash: hashValue
                    }
                ]
            };

            // 标记为新创建，以便在编辑期间保持预览可见
            window.bubbleNewlyCreatedHashes = window.bubbleNewlyCreatedHashes || new Set();
            window.bubbleNewlyCreatedHashes.add(hashValue);
        }

        fireEvent(editor, "config-changed", { config: editor._config });
    } catch (error) {
        console.error("创建弹窗时出错:", error);
        // 如果出错，恢复原始配置
        editor._config = originalConfig;
        editor._config.hash = editor.shadowRoot.querySelector('#hash-input')?.value || '#pop-up-name';
        fireEvent(editor, "config-changed", { config: editor._config });
    }
}

export function renderPopUpEditor(editor) {
    const conditions = editor._config?.trigger ?? [];
    let button_action = editor._config.button_action || '';

    // 弹窗创建的初始配置界面
    // 当 card_type 为 'pop-up' 且 hash 未定义时，检测为新弹窗
    const isNewPopUp = editor._config.card_type === 'pop-up' && !editor._config.hash;
    if (isNewPopUp) {

        const originalConfig = { ...editor._config };

        let isInVerticalStack = false;

        // 使用 setTimeout 正确检查是否在垂直堆栈中
        setTimeout(() => {
            isInVerticalStack = window.popUpError === false;
            updateUIForVerticalStack(editor, isInVerticalStack);
        }, 0);

        editor.createPopUpConfig = () => createPopUpConfig(editor, originalConfig);

        return html`
            <div class="card-config">
                ${editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList)}
                <div id="vertical-stack-alert-container" style="display: none;">
                    <div class="bubble-info warning">
                        <h4 class="bubble-section-title">
                            <ha-icon icon="mdi:alert-outline"></ha-icon>
                            检测到旧配置
                        </h4>
                        <div class="content">
                            <p>此弹窗已在垂直堆栈中（旧方法）。这不再需要，但仍可正常工作。您只需在下方更新哈希值即可。</p>
                        </div>
                    </div>
                </div>
                <ha-textfield
                    label="哈希值（例如 #kitchen）"
                    .value="${editor._config?.hash || '#pop-up-name'}"
                    id="hash-input"
                ></ha-textfield>
                <ha-formfield .label="包含示例配置">
                    <ha-switch
                        aria-label="包含示例配置"
                        .checked=${false}
                        id="include-example"
                    ></ha-switch>
                    <div class="mdc-form-field">
                        <label class="mdc-label">包含示例配置</label>
                    </div>
                </ha-formfield>
                
                <button class="icon-button" @click="${() => editor.createPopUpConfig()}">
                    <ha-icon icon="mdi:plus"></ha-icon>
                    <span id="button-text">创建弹窗</span>
                </button>

                <hr />

                <div class="bubble-info">
                    <h4 class="bubble-section-title">
                        <ha-icon icon="mdi:information-outline"></ha-icon>
                        弹出窗口
                    </h4>
                    <div class="content">
                        <p>弹窗是整理仪表盘的好方法，可以在需要时快速显示更多信息。</p>
                        <p>如果这是您第一次创建弹窗，可以使用示例配置来开始。</p>
                    </div>
                </div>
                
                ${editor.makeVersion()}
            </div>
        `;
    }

    // 现有弹窗的完整配置界面
    return html`
        <div class="card-config">
            ${editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList)}
            <ha-textfield
                label="哈希值（例如 #kitchen）"
                .value="${editor._config?.hash || '#pop-up-name'}"
                .configValue="${"hash"}"
                @input="${editor._valueChanged}"
            ></ha-textfield>
            <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:dock-top"></ha-icon>
                  标题设置
                </h4>
                <div class="content">
                    <ha-formfield .label="显示标题">
                        <ha-switch
                            aria-label="显示标题"
                            .checked=${editor._config.show_header ?? true}
                            .configValue="${"show_header"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">显示标题</label> 
                        </div>
                    </ha-formfield>
                    <div class="bubble-info">
                        <h4 class="bubble-section-title">
                            <ha-icon icon="mdi:information-outline"></ha-icon>
                            隐藏标题
                        </h4>
                        <div class="content">
                            <p>您可以完全隐藏弹窗标题，包括关闭按钮。隐藏后要关闭弹窗，可以在弹窗内长滑动或点击弹窗外部。</p>
                        </div>
                    </div>
                    <div style="${!(editor._config?.show_header ?? true) ? 'display: none;' : ''}">
                        <hr />
                        ${renderButtonEditor(editor)}
                    </div>
                </div>
            </ha-expansion-panel>
            <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:cog"></ha-icon>
                  弹窗设置
                </h4>
                <div class="content">
                    <ha-textfield
                        label="自动关闭时间（毫秒，例如 15000）"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1000"
                        .value="${editor._config?.auto_close || ''}"
                        .configValue="${"auto_close"}"
                        @input="${editor._valueChanged}"
                    ></ha-textfield>
                    <ha-textfield
                        label="滑动关闭距离（默认400）"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="10"
                        .value="${editor._config.slide_to_close_distance ?? 400}"
                        .configValue="${"slide_to_close_distance"}"
                        @input="${editor._valueChanged}"
                    ></ha-textfield>
                    <ha-formfield .label="点击外部关闭弹窗（需要刷新）">
                        <ha-switch
                            aria-label="点击外部关闭弹窗（需要刷新）"
                            .checked=${editor._config?.close_by_clicking_outside ?? true}
                            .configValue="${"close_by_clicking_outside"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">点击外部关闭弹窗（需要刷新）</label> 
                        </div>
                    </ha-formfield>
                    <ha-formfield .label="任意点击后关闭弹窗">
                        <ha-switch
                            aria-label="任意点击后关闭弹窗"
                            .checked=${editor._config?.close_on_click || false}
                            .configValue="${"close_on_click"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">任意点击后关闭弹窗</label> 
                        </div>
                    </ha-formfield>
                    <ha-formfield .label="后台更新卡片（不推荐）">
                        <ha-switch
                            aria-label="后台更新卡片（不推荐）"
                            .checked=${editor._config?.background_update || false}
                            .configValue="${"background_update"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">后台更新卡片（不推荐）</label> 
                        </div>
                    </ha-formfield>
                    <div class="bubble-info">
                        <h4 class="bubble-section-title">
                            <ha-icon icon="mdi:information-outline"></ha-icon>
                            后台更新
                        </h4>
                        <div class="content">
                            <p>仅当您在弹窗内的某些卡片遇到问题时，才建议启用后台更新。</p>
                        </div>
                    </div>
                </div>
            </ha-expansion-panel>
            <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:bell"></ha-icon>
                  弹窗触发器
                </h4>
                <div class="content">
                    <ha-formfield>
                        <ha-switch
                            .checked=${editor._config.trigger_close ?? true}
                            .configValue="${"trigger_close"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">条件不满足时关闭弹窗</label> 
                        </div>
                    </ha-formfield>
                    <ha-card-conditions-editor
                        .hass=${editor.hass}
                        .conditions=${conditions}
                        @value-changed=${(ev) => editor._conditionChanged(ev)}
                    >
                    </ha-card-conditions-editor>
                    <div class="bubble-info">
                        <h4 class="bubble-section-title">
                            <ha-icon icon="mdi:information-outline"></ha-icon>
                            关于条件
                        </h4>
                        <div class="content">
                            <p>当所有条件都满足时，弹窗将被打开。例如，当有人在您家门前时，您可以打开带有摄像头的"安全"弹窗。</p>
                            <p>您也可以创建一个开关辅助工具（<code>input_boolean</code>），并在自动化中触发其打开/关闭。</p>
                        </div>
                    </div>
                </div>
            </ha-expansion-panel>
            <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:gesture-tap"></ha-icon>
                  弹窗打开/关闭动作
                </h4>
                <div class="content">
                    ${editor.makeActionPanel("打开动作", editor._config, 'none')}
                    ${editor.makeActionPanel("关闭动作", editor._config, 'none')}
                    <div class="bubble-info">
                        <h4 class="bubble-section-title">
                            <ha-icon icon="mdi:information-outline"></ha-icon>
                            关于动作
                        </h4>
                        <div class="content">
                            <p>这允许您在弹窗打开/关闭时触发一个动作。</p>
                        </div>
                    </div>
                </div>
            </ha-expansion-panel>
            <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:palette"></ha-icon>
                  样式和布局选项
                </h4>
                <div class="content">
                    ${editor.makeLayoutPanel()}
                    <ha-expansion-panel outlined>
                        <h4 slot="header">
                          <ha-icon icon="mdi:palette"></ha-icon>
                          弹窗样式
                        </h4>
                        <div class="content"> 
                            <ha-textfield
                                label="边距（修复某些主题居中问题，例如 13px）"
                                .value="${editor._config?.margin || '7px'}"
                                .configValue="${"margin"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="移动端顶部边距（例如 -56px 如果标题被隐藏）"
                                .value="${editor._config?.margin_top_mobile || '0px'}"
                                .configValue="${"margin_top_mobile"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="桌面端顶部边距（例如 50vh 表示半屏弹窗）"
                                .value="${editor._config?.margin_top_desktop || '0px'}"
                                .configValue="${"margin_top_desktop"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="桌面端宽度（移动端默认100%）"
                                .value="${editor._config?.width_desktop || '540px'}"
                                .configValue="${"width_desktop"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="背景颜色（任意变量、十六进制、rgb或rgba值）"
                                .value="${editor._config?.bg_color || ''}"
                                .configValue="${"bg_color"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="背景不透明度（0-100范围）"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="100"
                                .value="${editor._config?.bg_opacity !== undefined ? editor._config?.bg_opacity : '88'}"
                                .configValue="${"bg_opacity"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="背景模糊度（0-100范围）"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="100"
                                .value="${editor._config?.bg_blur !== undefined ? editor._config?.bg_blur : '10'}"
                                .configValue="${"bg_blur"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="遮罩模糊度（0-100范围）"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="100"
                                .value="${editor._config?.backdrop_blur !== undefined ? editor._config?.backdrop_blur : '0'}"
                                .configValue="${"backdrop_blur"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="阴影不透明度（0-100范围）"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="100"
                                .configValue="${"shadow_opacity"}"
                                .value="${editor._config?.shadow_opacity !== undefined ? editor._config?.shadow_opacity : '0'}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-formfield .label="隐藏弹窗背景遮罩（需要刷新）">
                                <ha-switch
                                    aria-label="隐藏弹窗背景遮罩（需要刷新）"
                                    .checked=${editor._config.hide_backdrop ?? false}
                                    .configValue="${"hide_backdrop"}"
                                    @change=${editor._valueChanged}
                                ></ha-switch>
                                <div class="mdc-form-field">
                                    <label class="mdc-label">隐藏弹窗背景遮罩（需要刷新）</label> 
                                </div>
                            </ha-formfield>
                            <div class="bubble-info">
                                <h4 class="bubble-section-title">
                                    <ha-icon icon="mdi:information-outline"></ha-icon>
                                    隐藏弹窗遮罩
                                </h4>
                                <div class="content">
                                    <p>这将隐藏弹窗背景遮罩，即出现在弹窗后面的深色覆盖层。</p>
                                    <p>您可以通过在仪表盘的第一个弹窗中启用此设置，一次性为所有弹窗启用此设置。</p>
                                    <p><b>如果您在打开/关闭弹窗时遇到性能问题，建议隐藏遮罩。</b></p>
                                </div>
                            </div>
                        </div>
                    </ha-expansion-panel>
                    ${editor.makeStyleEditor()}
                </div>
            </ha-expansion-panel>
            ${editor.makeModulesEditor()}
            <div class="bubble-info-container">
                <div class="bubble-info">
                    <h4 class="bubble-section-title">
                        <ha-icon icon="mdi:information-outline"></ha-icon>
                        如何使用弹窗
                    </h4>
                    <div class="content">
                        <p>每个弹窗<b>默认隐藏</b>，<b>可以通过目标哈希值打开</b>（例如 '#pop-up-name'），使用<a href="https://github.com/Clooos/Bubble-Card#example" target="_blank" rel="noopener noreferrer">任何支持</a> <code>navigate</code> <a href="https://github.com/Clooos/Bubble-Card?tab=readme-ov-file#tap-double-tap-and-hold-actions" target="_blank" rel="noopener noreferrer">动作</a>的卡片。</p>
                        <p><b>您也可以观看这个<a href="https://www.youtube.com/watch?v=7mOV7BfWoFc" target="_blank" rel="noopener noreferrer">视频</a>，它解释了如何创建您的第一个弹窗</b>（此视频已过时，您不再需要添加垂直堆栈）。</p>
                    </div>
                </div>
                
                <div class="bubble-info warning">
                    <h4 class="bubble-section-title">
                        <ha-icon icon="mdi:alert-outline"></ha-icon>
                        重要提示
                    </h4>
                    <div class="content">
                        <p>为避免与您的视图不对齐，请将此卡片放在所有其他仪表盘卡片之后。您无法从其他视图触发它。</p>
                        <p>如果您的弹窗内容在页面加载期间出现在屏幕上，<a href="https://github.com/Clooos/Bubble-Card#pop-up-initialization-fix" target="_blank" rel="noopener noreferrer">您可以安装此修复程序</a>（推荐）。</p>
                    </div>
                </div>
            </div>
            ${editor.makeVersion()}
      </div>
    `;
}


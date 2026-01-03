import { html } from 'lit';
import { isEntityType } from "../../tools/utils.js";
import { makeButtonSliderPanel } from '../../components/slider/editor.js';

// 按钮类型列表
function getButtonList() {
    return [{
        'label': '开关',
        'value': 'switch'
    },
    {
        'label': '滑块',
        'value': 'slider'
    },
    {
        'label': '状态',
        'value': 'state'
    },
    {
        'label': '名称/文本（无需实体）',
        'value': 'name'
    }
    ];
}

export function renderButtonEditor(editor) {
    let entityList = {};
    if (editor._config.button_type === 'slider' && !editor._disableEntityFilter) {
        entityList = {
            filter: [
                { domain: ["light", "media_player", "cover", "input_number", "number", "climate", "fan"] },
                { domain: "sensor", device_class: "battery" },
            ],
        }
    }

    const isPopUp = editor._config.card_type === 'pop-up';

    let button_action = editor._config.button_action || '';

    if (!editor._config.button_type) {
        editor._config.button_type = isPopUp ? 'name' : 'switch';
    }
    let button_type = editor._config.button_type;

    return html`
        <div class="card-config">
            ${!isPopUp ? editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList) : ''}
            ${editor.makeDropdown("按钮类型", "button_type", getButtonList())}
            <ha-form
                .hass=${editor.hass}
                .data=${editor._config}
                .schema=${[
            {
                name: "entity",
                label: button_type !== 'slider' ? "实体（切换）" : "实体（请参阅下文支持的实体）",
                selector: { entity: entityList },
            },
        ]}   
                .computeLabel=${editor._computeLabelCallback}
                .disabled="${editor._config.button_type === 'name'}"
                @value-changed=${editor._valueChanged}
            ></ha-form>
            <ha-expansion-panel outlined>
                <h4 slot="header">
                <ha-icon icon="mdi:cog"></ha-icon>
                ${isPopUp ? '标题卡片设置' : '卡片设置'}
                </h4>
                <div class="content">     
                    <ha-textfield
                        label="可选 - 名称"
                        .value="${editor._config?.name || ''}"
                        .configValue="${"name"}"
                        @input="${editor._valueChanged}"
                    ></ha-textfield>
                    ${editor.makeDropdown("可选 - 图标", "icon")}
                    ${editor.makeShowState()}
                </div>
            </ha-expansion-panel>
            ${makeButtonSliderPanel(editor)}
            <ha-expansion-panel outlined>
                <h4 slot="header">
                <ha-icon icon="mdi:gesture-tap"></ha-icon>
                图标点击动作
                </h4>
                <div class="content">
                    ${editor.makeActionPanel("点击动作")}
                    ${editor.makeActionPanel("双击动作")}
                    ${editor.makeActionPanel("长按动作")}
                </div>
            </ha-expansion-panel>
            <ha-expansion-panel outlined style="display: ${editor._config.button_type === 'slider' && editor._config.tap_to_slide ? 'none' : ''}">
                <h4 slot="header">
                <ha-icon icon="mdi:gesture-tap-button"></ha-icon>
                卡片点击动作
                </h4>
                <div class="content">
                    <!-- 
                      默认按钮动作映射，与 create.js 默认值匹配：
                      - name: tap="none", double="none", hold="none"
                      - state: tap="more-info", double="none", hold="more-info" 
                      - slider: tap="more-info"(sensor)/"toggle"(others), double="none", hold="none"
                      - switch: tap="toggle", double="none", hold="more-info"
                    -->
                    ${editor.makeActionPanel("点击动作", button_action,
            editor._config.button_type === 'name' ? 'none' :
                editor._config.button_type === 'state' ? 'more-info' :
                    editor._config.button_type === 'slider' ?
                        (isEntityType(editor, "sensor", editor._config.entity) ? 'more-info' : 'toggle') :
                        'toggle',
            'button_action')}
                    ${editor.makeActionPanel("双击动作", button_action, 'none', 'button_action')}
                    ${editor.makeActionPanel("长按动作", button_action,
                editor._config.button_type === 'name' ? 'none' :
                    editor._config.button_type === 'slider' ? 'none' :
                        'more-info',
                'button_action')}
                </div>
            </ha-expansion-panel>
            ${editor.makeSubButtonPanel()}
            <ha-expansion-panel outlined>
                <h4 slot="header">
                <ha-icon icon="mdi:palette"></ha-icon>
                样式和布局选项
                </h4>
                <div class="content">
                    ${editor.makeLayoutPanel()}
                    ${!isPopUp ? editor.makeStyleEditor() : ''}
                </div>
            </ha-expansion-panel>
            ${!isPopUp ? editor.makeModulesEditor() : ''}
            <div class="bubble-info">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    按钮卡片 ${isPopUp ? '（作为弹窗标题）' : ''}
                </h4>
                <div class="content">
                    <p>这是一个非常灵活的卡片。它可以用作<b>开关</b>、<b>滑块</b>、<b>状态</b>或<b>名称/文本</b>按钮。选择您想要的按钮类型以获取更多信息。</p>
                    
                    ${editor._config.button_type === 'switch' || !editor._config.button_type ? html`
                        <p><strong>开关按钮：</strong>这是默认的按钮类型。默认情况下，它会切换一个实体，其背景颜色会根据实体的状态或灯光的颜色而变化。您可以在<b>卡片点击动作</b>部分更改其动作。</p>
                    ` : ''}
                    
                    ${editor._config.button_type === 'slider' ? html`
                        <p><strong>滑块按钮：</strong>这种按钮类型可以让您控制具有可调范围的实体。它非常适合调节灯光亮度，其填充颜色会适应灯光的颜色。您还可以使用它来显示数值，例如电池电量。</p>
                        <p>滑块支持的实体：</p>
                        <ul class="icon-list">
                            <li><ha-icon icon="mdi:lightbulb-outline"></ha-icon>灯光（亮度）</li>
                            <li><ha-icon icon="mdi:speaker"></ha-icon>媒体播放器（音量）</li>
                            <li><ha-icon icon="mdi:window-shutter"></ha-icon>窗帘（位置）</li>
                            <li><ha-icon icon="mdi:fan"></ha-icon>风扇（百分比）</li>
                            <li><ha-icon icon="mdi:thermometer"></ha-icon>空调（温度）</li>
                            <li><ha-icon icon="mdi:numeric"></ha-icon>输入数字和数字（值）</li>
                            <li><ha-icon icon="mdi:battery-50"></ha-icon>电池传感器（百分比，只读）</li>
                        </ul>
                        <p>您也可以通过在<b>滑块设置</b>中禁用实体过滤器来使用任何具有<b>数值状态</b>的实体，然后定义<b>最小值</b>和<b>最大值</b>。此选项为只读。</p>
                    ` : ''}
                    
                    ${editor._config.button_type === 'state' ? html`
                        <p><strong>状态按钮：</strong>非常适合显示传感器或任何实体的信息。按下时，它会显示实体的"更多信息"面板。其背景颜色不会改变。</p>
                    ` : ''}
                    
                    ${editor._config.button_type === 'name' ? html`
                        <p><strong>名称/文本按钮：</strong>唯一不需要实体的按钮类型。它允许您显示短文本、名称或标题。您还可以为其添加动作。其背景颜色不会改变。</p>
                    ` : ''}
                </div>
            </div>
            ${!isPopUp ? editor.makeVersion() : ''}
        </div>
    `;
}
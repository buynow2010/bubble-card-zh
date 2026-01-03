import { html } from "lit";
import { fireEvent } from '../../tools/utils.js';

export function renderHorButtonStackEditor(editor) {
    if (!editor.buttonAdded) {
        editor.buttonAdded = true;
        editor.buttonIndex = 0;

        while (editor._config[(editor.buttonIndex + 1) + '_link']) {
            editor.buttonIndex++;
        }
    }

    function addButton() {
        editor.buttonIndex++;
        editor.requestUpdate();
    }

    return html`
        <div class="card-config">
            ${editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList)}
            <div id="buttons-container">
                ${makeButton(editor)}
            </div>
            <button class="icon-button" @click="${addButton}">
                <ha-icon icon="mdi:plus"></ha-icon>
                新建按钮
            </button>
            <hr>
            <ha-formfield .label="自动排序">
                <ha-switch
                    aria-label="切换自动排序"
                    .checked=${editor._config?.auto_order || false}
                    .configValue="${"auto_order"}"
                    @change=${editor._valueChanged}
                ></ha-switch>
                <div class="mdc-form-field">
                    <label class="mdc-label">可选 - 自动排序（需要存在/占用传感器）</label> 
                </div>
            </ha-formfield>
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
                          水平按钮栏样式
                        </h4>
                        <div class="content"> 
                            <ha-textfield
                                label="可选 - 边距（修复某些主题居中问题，例如 13px）"
                                .value="${editor._config?.margin || '7px'}"
                                .configValue="${"margin"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-textfield
                                label="可选 - 桌面端宽度（移动端默认100%）"
                                .value="${editor._config?.width_desktop || '540px'}"
                                .configValue="${"width_desktop"}"
                                @input="${editor._valueChanged}"
                            ></ha-textfield>
                            <ha-formfield .label="可选 - 上升动画（页面加载后显示动画）">
                                <ha-switch
                                    aria-label="可选 - 上升动画（页面加载后显示动画）"
                                    .checked=${editor._config?.rise_animation !== undefined ? editor._config?.rise_animation : true}
                                    .configValue="${"rise_animation"}"
                                    @change=${editor._valueChanged}
                                ></ha-switch>
                                <div class="mdc-form-field">
                                    <label class="mdc-label">可选 - 上升动画（页面加载后显示动画）</label> 
                                </div>
                            </ha-formfield>
                            <ha-formfield .label="可选 - 高亮当前哈希/视图">
                                <ha-switch
                                    aria-label="可选 - 高亮当前哈希/视图"
                                    .checked=${editor._config?.highlight_current_view || false}
                                    .configValue="${"highlight_current_view"}"
                                    @change=${editor._valueChanged}
                                ></ha-switch>
                                <div class="mdc-form-field">
                                    <label class="mdc-label">可选 - 高亮当前哈希/视图</label> 
                                </div>
                            </ha-formfield>
                            <ha-formfield .label="可选 - 隐藏渐变">
                                <ha-switch
                                    aria-label="可选 - 隐藏渐变"
                                    .checked=${editor._config.hide_gradient || false}
                                    .configValue="${"hide_gradient"}"
                                    @change=${editor._valueChanged}
                                ></ha-switch>
                                <div class="mdc-form-field">
                                    <label class="mdc-label">可选 - 隐藏渐变</label> 
                                </div>
                            </ha-formfield>
                        </div>
                    </ha-expansion-panel>
                    ${editor.makeStyleEditor()}
                </div>
            </ha-expansion-panel>
            ${editor.makeModulesEditor()}
            <div class="bubble-info">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    水平按钮栏卡片
                </h4>
                <div class="content">
                    <p>此卡片是弹窗卡片的好伴侣，允许您打开弹窗或仪表盘的任何页面。此外，您可以添加运动传感器，以便按钮顺序根据您刚刚进入的房间进行调整。此卡片可滚动，始终可见，并作为页脚。</p>
                </div>
            </div>
            ${editor.makeVersion()}
        </div>
    `;
}

function makeButton(editor) {
    let buttons = [];
    for (let i = 1; i <= editor.buttonIndex; i++) {
        buttons.push(html`
            <div class="${i}_button">
                <ha-expansion-panel outlined>
                    <h4 slot="header">
                        <ha-icon icon="mdi:border-radius"></ha-icon>
                        按钮 ${i} ${editor._config[i + '_name'] ? ("- " + editor._config[i + '_name']) : ""}
                        <div class="button-container">
                            <button class="icon-button header" @click="${() => removeButton(editor, i)}">
                              <ha-icon icon="mdi:delete"></ha-icon>
                            </button>
                        </div>
                    </h4>
                    <div class="content">
                        <ha-textfield
                            label="链接/弹窗哈希值（例如 #kitchen）"
                            .value="${editor._config[i + '_link'] || ''}"
                            .configValue="${i}_link"
                            @input="${editor._valueChanged}"
                        ></ha-textfield>
                        <ha-textfield
                            label="可选 - 名称"
                            .value="${editor._config[i + '_name'] || ''}"
                            .configValue="${i}_name"
                            @input="${editor._valueChanged}"
                        ></ha-textfield>
                        <ha-icon-picker
                            label="可选 - 图标"
                            .value="${editor._config[i + '_icon'] || ''}"
                            .configValue="${i}_icon"
                            item-label-path="label"
                            item-value-path="value"
                            @value-changed="${editor._valueChanged}"
                        ></ha-icon-picker>
                        <ha-form
                            .hass=${editor.hass}
                            .data=${editor._config}
                            .schema=${[
                {
                    name: i + "_entity",
                    label: "可选 - 灯光/灯光组（用于背景颜色）",
                    selector: { entity: {} },
                },
            ]}   
                            .computeLabel=${editor._computeLabelCallback}
                            @value-changed=${editor._valueChanged}
                        ></ha-form>
                        <ha-form
                            .hass=${editor.hass}
                            .data=${editor._config}
                            .schema=${[
                {
                    name: i + "_pir_sensor",
                    label: "可选 - 存在/占用传感器（用于按钮自动排序）",
                    selector: { entity: {} },
                },
            ]}   
                            .computeLabel=${editor._computeLabelCallback}
                            @value-changed=${editor._valueChanged}
                        ></ha-form>
                        <ha-alert alert-type="info">实际上，您也可以使用任何实体类型来实现自动排序，例如您可以将灯光组添加到这些字段，顺序将根据最后更改的状态而变化。</ha-alert>
                    </div>
                </ha-expansion-panel>
            </div>
        `);
    }
    return buttons;
}

function removeButton(editor, index) {
    // 删除按钮字段
    delete editor._config[index + '_name'];
    delete editor._config[index + '_icon'];
    delete editor._config[index + '_link'];
    delete editor._config[index + '_entity'];
    delete editor._config[index + '_pir_sensor'];

    // 更新后续按钮的索引
    for (let i = index; i < editor.buttonIndex; i++) {
        editor._config[i + '_name'] = editor._config[(i + 1) + '_name'];
        editor._config[i + '_icon'] = editor._config[(i + 1) + '_icon'];
        editor._config[i + '_link'] = editor._config[(i + 1) + '_link'];
        editor._config[i + '_entity'] = editor._config[(i + 1) + '_entity'];
        editor._config[i + '_pir_sensor'] = editor._config[(i + 1) + '_pir_sensor'];
    }

    // 删除最后一个按钮的字段
    delete editor._config[editor.buttonIndex + '_name'];
    delete editor._config[editor.buttonIndex + '_icon'];
    delete editor._config[editor.buttonIndex + '_link'];
    delete editor._config[editor.buttonIndex + '_entity'];
    delete editor._config[editor.buttonIndex + '_pir_sensor'];

    // 更新最后一个按钮的索引
    editor.buttonIndex--;

    fireEvent(editor, "config-changed", {
        config: editor._config
    });
}
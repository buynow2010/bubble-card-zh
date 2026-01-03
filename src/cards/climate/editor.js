import { html } from "lit";
import { ensureNewSubButtonsSchemaObject } from "../../components/sub-button/utils.js";


export function renderClimateEditor(editor) {
    let button_action = editor._config.button_action || '';

    if (
        editor._config.card_type === "climate" &&
        !editor.climateSubButtonsAdded &&
        editor._config.entity
    ) {
        const shouldAddHVACModes = editor.hass.states[editor._config.entity]?.attributes?.hvac_modes;

        if (shouldAddHVACModes) {
            const sectioned = ensureNewSubButtonsSchemaObject(editor._config);
            const hasMainButtons = Array.isArray(sectioned.main) && sectioned.main.length > 0;

            if (!hasMainButtons) {
                const newSubButton = {
                    name: 'HVAC 模式菜单',
                    select_attribute: 'hvac_modes',
                    state_background: false,
                    show_arrow: false
                };

                sectioned.main.push(newSubButton);
                editor._config.sub_button = sectioned;
                editor._firstRowsComputation = true;
            }
        }

        editor.climateSubButtonsAdded = true;
    }

    return html`
        <div class="card-config">
        ${editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList)}
        <ha-form
            .hass=${editor.hass}
            .data=${editor._config}
            .schema=${[
            {
                name: "entity",
                label: "实体",
                selector: { entity: { domain: ["climate"] } },
            },
        ]}   
            .computeLabel=${editor._computeLabelCallback}
            @value-changed=${editor._valueChanged}
        ></ha-form>
                                <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:cog"></ha-icon>
                  卡片设置
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
            <ha-expansion-panel outlined>
                <h4 slot="header">
                <ha-icon icon="mdi:tune-variant"></ha-icon>
                空调设置
                </h4>
                <div class="content">
                    <ha-form
                        .hass=${editor.hass}
                        .data=${editor._config}
                        .schema=${[
            {
                type: "grid",
                flatten: true,
                schema: [
                    {
                        name: "min_temp",
                        label: "最低温度",
                        selector: {
                            number: {
                                step: "any"
                            }
                        },
                    },
                    {
                        name: "max_temp",
                        label: "最高温度",
                        selector: {
                            number: {
                                step: "any"
                            }
                        },
                    },
                    {
                        name: "step",
                        label: "步长",
                        selector: {
                            number: {
                                step: "any"
                            }
                        },
                    },
                ],
            },
        ]}   
                        .computeLabel=${editor._computeLabelCallback}
                        .disabled="${editor._config.button_type === 'name'}"
                        @value-changed=${editor._valueChanged}
                    ></ha-form>
                    ${editor.hass.states[editor._config.entity]?.attributes?.target_temp_low ? html`
                        <ha-formfield .label="可选 - 隐藏目标低温">
                            <ha-switch
                                aria-label="可选 - 隐藏目标低温"
                                .checked=${editor._config.hide_target_temp_low}
                                .configValue="${"hide_target_temp_low"}"
                                @change=${editor._valueChanged}
                            ></ha-switch>
                            <div class="mdc-form-field">
                                <label class="mdc-label">可选 - 隐藏目标低温</label> 
                            </div>
                        </ha-formfield>
                    ` : ''}
                    ${editor.hass.states[editor._config.entity]?.attributes?.target_temp_high ? html`
                        <ha-formfield .label="可选 - 隐藏目标高温">
                            <ha-switch
                                aria-label="可选 - 隐藏目标高温"
                                .checked=${editor._config.hide_target_temp_high}
                                .configValue="${"hide_target_temp_high"}"
                                @change=${editor._valueChanged}
                            ></ha-switch>
                            <div class="mdc-form-field">
                                <label class="mdc-label">可选 - 隐藏目标高温</label> 
                            </div>
                        </ha-formfield>
                    ` : ''}
                    <ha-formfield .label="可选 - 隐藏温度控制">
                        <ha-switch
                            aria-label="可选 - 隐藏温度控制"
                            .checked=${editor._config.hide_temperature}
                            .configValue="${"hide_temperature"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">可选 - 隐藏温度控制</label> 
                        </div>
                    </ha-formfield>
                    <ha-formfield .label="可选 - 开启时使用固定背景颜色">
                        <ha-switch
                            aria-label="可选 - 开启时使用固定背景颜色"
                            .checked=${editor._config.state_color === true}
                            .configValue="${"state_color"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">可选 - 开启时使用固定背景颜色</label> 
                        </div>
                    </ha-formfield>
                </div>
            </ha-expansion-panel>
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
            <ha-expansion-panel outlined>
                <h4 slot="header">
                <ha-icon icon="mdi:gesture-tap-button"></ha-icon>
                卡片点击动作
                </h4>
                <div class="content">
                    ${editor.makeActionPanel("点击动作", button_action, 'none', 'button_action')}
                    ${editor.makeActionPanel("双击动作", button_action, 'none', 'button_action')}
                    ${editor.makeActionPanel("长按动作", button_action, 'none', 'button_action')}
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
                    ${editor.makeStyleEditor()}
                </div>
            </ha-expansion-panel>
            ${editor.makeModulesEditor()}
            <div class="bubble-info">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    空调卡片
                </h4>
                <div class="content">
                    <p>此卡片允许您控制空调实体。您还可以添加一个子按钮来显示空调模式的下拉菜单（创建新子按钮时检查是否有"选择菜单"可用）。</p>
                </div>
            </div>
            ${editor.makeVersion()}
        </div>
    `;
}
import { html } from "lit";


export function renderSelectEditor(editor) {
    const entity = editor._config.entity;
    const isSelect = entity?.startsWith("input_select") || entity?.startsWith("select") || editor._config.select_attribute;
    const entityAttribute = editor.hass.states[entity]?.attributes;
    const hasSelectAttributeList = editor._selectable_attributes.some(attr => entityAttribute?.[attr]);
    const selectableAttributeList = Object.keys(editor.hass.states[entity]?.attributes || {}).map((attributeName) => {
        let state = editor.hass.states[entity];
        let formattedName = editor.hass.formatEntityAttributeName(state, attributeName);
        return { label: formattedName, value: attributeName };
    }).filter(attribute => editor._selectable_attributes.includes(attribute.value));

    let button_action = editor._config.button_action || '';

    return html`
        <div class="card-config">
            ${editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList)}
            <ha-form
                .hass=${editor.inputSelectList}
                .data=${editor._config}
                .schema=${[
            {
                name: "entity",
                label: "实体",
                selector: { entity: {} },
            },
        ]}   
                .computeLabel=${editor._computeLabelCallback}
                @value-changed=${editor._valueChanged}
            ></ha-form>
            ${hasSelectAttributeList ? html`
                <ha-form
                    .hass=${editor.hass}
                    .data=${{ select_attribute: editor._config.select_attribute }}
                    .schema=${[{
                name: 'select_attribute',
                selector: {
                    select: {
                        options: selectableAttributeList,
                        mode: 'dropdown'
                    }
                }
            }]}
                    .computeLabel=${() => '选择菜单（来自属性）'}
                    @value-changed=${(ev) => {
                editor._valueChanged({
                    target: { configValue: 'select_attribute' },
                    detail: { value: ev.detail.value.select_attribute }
                });
            }}
                ></ha-form>
            ` : ''}
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
                  按钮点击动作
                </h4>
                <div class="content">
                    <div style="${isSelect ? 'opacity: 0.5; pointer-events: none;' : ''}">
                        ${editor.makeActionPanel("点击动作", button_action, 'none', 'button_action')}
                    </div>
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
                    选择器卡片
                </h4>
                <div class="content">
                    <p>此卡片允许您为具有可选选项的实体创建选择菜单：</p>
                    <ul class="icon-list">
                        <li><ha-icon icon="mdi:format-list-bulleted"></ha-icon>输入选择实体</li>
                        <li><ha-icon icon="mdi:form-dropdown"></ha-icon>选择实体</li>
                        <li><ha-icon icon="mdi:playlist-music"></ha-icon>带<b>源列表</b>的媒体播放器</li>
                        <li><ha-icon icon="mdi:speaker"></ha-icon>带<b>音效模式列表</b>的媒体播放器</li>
                        <li><ha-icon icon="mdi:thermostat"></ha-icon>带<b>HVAC模式</b>的空调实体</li>
                        <li><ha-icon icon="mdi:fan"></ha-icon>带<b>风扇模式</b>的空调/风扇实体</li>
                        <li><ha-icon icon="mdi:air-conditioner"></ha-icon>带<b>摆动模式</b>的空调实体</li>
                        <li><ha-icon icon="mdi:thermostat-auto"></ha-icon>带<b>预设模式</b>的空调实体</li>
                        <li><ha-icon icon="mdi:lightbulb-group"></ha-icon>带<b>效果列表</b>的灯光实体</li>
                    </ul>
                </div>
            </div>
            ${editor.makeVersion()}
        </div>
    `;
}
import { html } from "lit";

export function renderCoverEditor(editor) {

    let button_action = editor._config.button_action || '';
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
                selector: { entity: { domain: ["cover"] } },
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
                    ${editor.makeDropdown("可选 - 打开时图标", "icon_open")}
                    ${editor.makeDropdown("可选 - 关闭时图标", "icon_close")}
                    ${editor.makeShowState()}
                </div>
            </ha-expansion-panel>
            <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:window-shutter-cog"></ha-icon>
                  自定义服务
                </h4>
                <div class="content"> 
                    <ha-textfield
                        label="可选 - 打开服务（默认 cover.open_cover）"
                        .value="${editor._config?.open_service || 'cover.open_cover'}"
                        .configValue="${"open_service"}"
                        @input="${editor._valueChanged}"
                    ></ha-textfield>
                    <ha-textfield
                        label="可选 - 停止服务（默认 cover.stop_cover）"
                        .value="${editor._config?.stop_service || 'cover.stop_cover'}"
                        .configValue="${"stop_service"}"
                        @input="${editor._valueChanged}"
                    ></ha-textfield>
                    <ha-textfield
                        label="可选 - 关闭服务（默认 cover.close_cover）"
                        .value="${editor._config?.close_service || 'cover.close_cover'}"
                        .configValue="${"close_service"}"
                        @input="${editor._valueChanged}"
                    ></ha-textfield>
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
                    <ha-expansion-panel outlined>
                        <h4 slot="header">
                          <ha-icon icon="mdi:palette"></ha-icon>
                          窗帘样式
                        </h4>
                        <div class="content"> 
                            ${editor.makeDropdown("可选 - 向下箭头图标", "icon_down")}
                            ${editor.makeDropdown("可选 - 向上箭头图标", "icon_up")}
                        </div>
                    </ha-expansion-panel>
                    ${editor.makeStyleEditor()}
                </div>
            </ha-expansion-panel>
            ${editor.makeModulesEditor()}
            <div class="bubble-info">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    窗帘卡片
                </h4>
                <div class="content">
                    <p>此卡片允许您控制窗帘/遮阳设备。</p>
                </div>
            </div>
            ${editor.makeVersion()}
        </div>
    `;
}
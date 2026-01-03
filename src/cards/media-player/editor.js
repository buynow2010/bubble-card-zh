import { html } from "lit";


export function renderMediaPlayerEditor(editor) {

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
                selector: { entity: { domain: ["media_player"] } },
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
                媒体播放器设置
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
                        name: "min_volume",
                        label: "最小音量",
                        selector: {
                            number: {
                                step: "any"
                            }
                        },
                    },
                    {
                        name: "max_volume",
                        label: "最大音量",
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
                        @value-changed=${editor._valueChanged}
                    ></ha-form>
                    <ha-formfield .label="可选 - 隐藏播放/暂停按钮">
                        <ha-switch
                            aria-label="可选 - 隐藏播放/暂停按钮"
                            .checked=${editor._config.hide?.play_pause_button || false}
                            .configValue="${"hide.play_pause_button"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">可选 - 隐藏播放/暂停按钮</label> 
                        </div>
                    </ha-formfield>
                    <ha-formfield .label="可选 - 隐藏音量按钮">
                        <ha-switch
                            aria-label="可选 - 隐藏音量按钮"
                            .checked=${editor._config.hide?.volume_button || false}
                            .configValue="${"hide.volume_button"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">可选 - 隐藏音量按钮</label>
                        </div>
                    </ha-formfield>
                    <ha-formfield .label="可选 - 隐藏下一曲按钮">
                        <ha-switch
                            aria-label="可选 - 隐藏下一曲按钮"
                            .checked=${editor._config.hide?.next_button || false}
                            .configValue="${"hide.next_button"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">可选 - 隐藏下一曲按钮</label>
                        </div>
                    </ha-formfield>
                    <ha-formfield .label="可选 - 隐藏上一曲按钮">
                        <ha-switch
                            aria-label="可选 - 隐藏上一曲按钮"
                            .checked=${editor._config.hide?.previous_button || false}
                            .configValue="${"hide.previous_button"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">可选 - 隐藏上一曲按钮</label>
                        </div>
                    </ha-formfield>
                    <ha-formfield .label="可选 - 隐藏电源按钮">
                        <ha-switch
                            aria-label="可选 - 隐藏电源按钮"
                            .checked=${editor._config.hide?.power_button}
                            .configValue="${"hide.power_button"}"
                            @change=${editor._valueChanged}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">可选 - 隐藏电源按钮</label>
                        </div>
                    </ha-formfield>
                    <div class="bubble-info">
                        <h4 class="bubble-section-title">
                            <ha-icon icon="mdi:information-outline"></ha-icon>
                            按钮默认行为
                        </h4>
                        <div class="content">
                            <p>在编辑器之外，除电源按钮外的其他按钮只有在媒体播放器开启时才会显示。</p>
                        </div>
                    </div>
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
                          媒体播放器样式
                        </h4>
                        <div class="content"> 
                            <ha-formfield .label="可选 - 背景模糊媒体封面">
                                <ha-switch
                                    aria-label="可选 - 背景模糊媒体封面"
                                    .checked=${editor._config.cover_background ?? false}
                                    .configValue="${"cover_background"}"
                                    @change=${editor._valueChanged}
                                ></ha-switch>
                                <div class="mdc-form-field">
                                    <label class="mdc-label">可选 - 背景模糊媒体封面</label> 
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
                    媒体播放器卡片
                </h4>
                <div class="content">
                    <p>此卡片允许您控制媒体播放器实体。</p>
                </div>
            </div>
            ${editor.makeVersion()}
        </div>
    `;
}
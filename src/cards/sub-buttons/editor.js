import { html } from 'lit';

export function renderSubButtonsEditor(editor) {
    const isPopUp = editor._config.card_type === 'pop-up';

    return html`
        <div class="card-config">
            ${!isPopUp ? editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList) : ''}

            <ha-expansion-panel outlined>
                <h4 slot="header">
                    <ha-icon icon="mdi:cog"></ha-icon>
                    卡片设置
                </h4>
                <div class="content">
                    <ha-formfield>
                        <ha-switch
                            label="隐藏主背景"
                            .checked="${editor._config?.hide_main_background || false}"
                            .configValue="${"hide_main_background"}"
                            @change="${editor._valueChanged}"
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">隐藏主背景</label> 
                        </div>
                    </ha-formfield>

                    <ha-formfield>
                        <ha-switch
                            label="页脚模式（固定在底部）"
                            .checked="${editor._config?.footer_mode || false}"
                            .configValue="${"footer_mode"}"
                            @change="${editor._valueChanged}"
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">页脚模式（固定在底部）</label> 
                        </div>
                    </ha-formfield>

                    ${editor._config?.footer_mode ? html`
                        <div style="margin-top: 16px; padding-left: 16px; border-left: 2px solid var(--divider-color);">
                            <ha-formfield>
                                <ha-switch
                                    label="全宽页脚"
                                    .checked="${editor._config?.footer_full_width || false}"
                                    .configValue="${"footer_full_width"}"
                                    @change="${editor._valueChanged}"
                                ></ha-switch>
                                <div class="mdc-form-field">
                                    <label class="mdc-label">全宽页脚（100%宽度）</label> 
                                </div>
                            </ha-formfield>

                            ${!editor._config?.footer_full_width ? html`
                                <ha-textfield
                                    label="自定义页脚宽度（px）"
                                    type="number"
                                    value="${editor._config?.footer_width || 500}"
                                    .configValue="${"footer_width"}"
                                    @input="${editor._valueChanged}"
                                    min="200"
                                    max="1200"
                                    step="10"
                                    style="margin-top: 8px;"
                                ></ha-textfield>
                                <div style="font-size: 0.8em; color: var(--secondary-text-color); margin-top: 4px;">
                                    页脚将在页面上居中显示
                                </div>
                            ` : ''}

                            <ha-textfield
                                label="页脚底部距离（px）"
                                type="number"
                                value="${editor._config?.footer_bottom_offset || 16}"
                                .configValue="${"footer_bottom_offset"}"
                                @input="${editor._valueChanged}"
                                min="0"
                                max="100"
                                step="1"
                                style="margin-top: 16px;"
                            ></ha-textfield>
                            <div style="font-size: 0.8em; color: var(--secondary-text-color); margin-top: 4px;">
                                距离页面底部的距离（默认：16px）
                            </div>
                        </div>
                    ` : ''}
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

            ${editor.makeModulesEditor()}

            <div class="bubble-info">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    子按钮卡片
                </h4>
                <div class="content">
                    <p>此卡片只能包含子按钮，非常适合显示信息、创建菜单，甚至可以在页面底部创建固定的页脚菜单。</p>
                </div>
            </div>

            ${!isPopUp ? editor.makeVersion() : ''}
        </div>
    `;
}


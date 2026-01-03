import { html } from 'lit';
import { isReadOnlyEntityId } from './helpers.js';

const FILL_ORIENTATION_OPTIONS = [
    { label: '从左填充（默认）', value: 'left' },
    { label: '从右填充', value: 'right' },
    { label: '从上填充', value: 'top' },
    { label: '从下填充', value: 'bottom' },
];

const VALUE_POSITION_OPTIONS = [
    { label: '右侧（默认）', value: 'right' },
    { label: '左侧', value: 'left' },
    { label: '居中', value: 'center' },
    { label: '隐藏', value: 'hidden' }
];

export function isReadOnlyEntity(editor) {
    const entity = editor._config.entity;
    return isReadOnlyEntityId(entity);
}

export function makeButtonSliderPanel(editor) {
    if (editor._disableEntityFilter === undefined) {
        editor._disableEntityFilter = false;
    }

    const forwardToggleChange = (key, value, meta = {}) => {
        if (!key) {
            return;
        }
        const control = (meta.control || '').toUpperCase();
        const eventType = meta.eventType || (control === 'HA-TEXTFIELD'
            ? 'input'
            : control === 'HA-COMBO-BOX'
                ? 'value-changed'
                : 'change');

        const target = {
            configValue: key,
            tagName: control || 'INPUT'
        };

        if (control === 'HA-SWITCH') {
            target.checked = value;
        } else {
            target.value = value;
        }

        const syntheticEvent = {
            type: eventType,
            target,
            detail: eventType === 'value-changed' ? { value } : undefined
        };

        editor._valueChanged(syntheticEvent);
    };

    const sliderVisible = editor._config.button_type === 'slider';

    return html`
        <ha-expansion-panel outlined style="display: ${sliderVisible ? '' : 'none'}">
            <h4 slot="header">
            <ha-icon icon="mdi:tune-variant"></ha-icon>
            滑块设置
            </h4>
            <div class="content">
                ${makeGenericSliderSettings({
        hass: editor.hass,
        data: editor._config,
        entity: editor._config.entity,
        computeLabel: editor._computeLabelCallback,
        onFormChange: editor._valueChanged,
        onToggleChange: forwardToggleChange,
        isReadOnly: isReadOnlyEntity(editor),
        showEntityFilterToggle: true,
        entityFilterValue: editor._disableEntityFilter,
        onEntityFilterToggle: (checked) => {
            editor._disableEntityFilter = checked;
            editor.requestUpdate();
        },
        showEntityFilterInfo: editor._disableEntityFilter,
        rangeFormDisabled: editor._config.button_type === 'name'
    })}
            </div>
        </ha-expansion-panel>
    `;
}

// 通用滑块设置构建器，可在按钮和子按钮编辑器中复用
export function makeGenericSliderSettings({
    hass,
    data = {},
    entity,
    computeLabel,
    onFormChange,
    onToggleChange,
    isReadOnly,
    showEntityFilterToggle = false,
    entityFilterValue = false,
    onEntityFilterToggle,
    showEntityFilterInfo = entityFilterValue,
    rangeFormDisabled = false
}) {
    const isLightColorMode = entity?.startsWith("light") && ['hue', 'saturation', 'white_temp'].includes(data.light_slider_type);
    const hideInvertSliderToggle = isLightColorMode;
    const callToggleChange = (key, value, meta = {}) => {
        if (typeof onToggleChange === 'function') {
            onToggleChange(key, value, meta);
        }
    };
    const meta = (control, eventType) => ({ control, eventType });
    const handleEntityFilterToggle = (checked) => {
        if (typeof onEntityFilterToggle === 'function') {
            onEntityFilterToggle(checked);
        }
    };

    return html`
        ${showEntityFilterToggle ? html`
            <div class="checkbox-wrapper">
                <ha-formfield label="禁用实体过滤器（用于自定义滑块）">
                    <ha-switch
                        .checked=${entityFilterValue}
                        @change=${(ev) => handleEntityFilterToggle(ev.target.checked)}
                    ></ha-switch>
                </ha-formfield>
            </div>
            <div class="bubble-info" style="display: ${showEntityFilterInfo ? '' : 'none'}">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    自定义滑块
                </h4>
                <div class="content">
                    <p>要创建自定义滑块（只读），请在上方选择一个<b>具有数值状态的实体</b>，然后在下方定义<b>最小值</b>和<b>最大值</b>。</p>
                    <p>例如，这可以让您在特定范围内显示太阳能发电量。</p>
                </div>
            </div>
        ` : ''}
        <ha-form
            .hass=${hass}
            .data=${data}
            .schema=${[
            {
                type: "grid",
                flatten: true,
                schema: [
                    {
                        name: "min_value",
                        label: "最小值",
                        selector: { number: { step: "any" } },
                    },
                    {
                        name: "max_value",
                        label: "最大值",
                        selector: { number: { step: "any" } },
                    },
                    {
                        name: "step",
                        label: "步长",
                        selector: { number: { step: "any" } },
                    },
                ],
            },
        ]}
            .computeLabel=${computeLabel}
            .disabled=${rangeFormDisabled}
            @value-changed=${onFormChange}
        ></ha-form>
        <hr>
        <ha-formfield>
            <ha-switch
                .checked=${data.tap_to_slide && !data.relative_slide}
                @change=${(ev) => callToggleChange('tap_to_slide', ev.target.checked, meta('ha-switch', 'change'))}
                .disabled=${data.relative_slide || isReadOnly}
            ></ha-switch>
            <div class="mdc-form-field">
                <label class="mdc-label">点击滑动（旧版行为）</label>
            </div>
        </ha-formfield>
        <ha-formfield>
            <ha-switch
                .checked=${!data.tap_to_slide && data.relative_slide}
                @change=${(ev) => callToggleChange('relative_slide', ev.target.checked, meta('ha-switch', 'change'))}
                .disabled=${data.tap_to_slide || isReadOnly}
            ></ha-switch>
            <div class="mdc-form-field">
                <label class="mdc-label">相对滑动（与点击滑动不兼容）</label>
            </div>
        </ha-formfield>
        <ha-formfield>
            <ha-switch
                .checked=${data.read_only_slider ?? isReadOnly}
                @change=${(ev) => callToggleChange('read_only_slider', ev.target.checked, meta('ha-switch', 'change'))}
                .disabled=${isReadOnly}
            ></ha-switch>
            <div class="mdc-form-field">
                <label class="mdc-label">只读滑块</label>
            </div>
        </ha-formfield>
        <ha-formfield>
            <ha-switch
                .checked=${data.slider_live_update ?? false}
                @change=${(ev) => callToggleChange('slider_live_update', ev.target.checked, meta('ha-switch', 'change'))}
                .disabled=${isReadOnly}
            ></ha-switch>
            <div class="mdc-form-field">
                <label class="mdc-label">滑块实时更新</label>
            </div>
        </ha-formfield>
        <div class="bubble-info" style="display: ${(data.slider_live_update ?? false) ? '' : 'none'}">
            <h4 class="bubble-section-title">
                <ha-icon icon="mdi:information-outline"></ha-icon>
                滑块实时更新
            </h4>
            <div class="content">
                <p>默认情况下，滑块仅在释放时更新。启用此选项后，滑块将在滑动过程中更新实体状态。<b>此功能不推荐用于所有实体，如果遇到问题请禁用它。</b></p>
            </div>
        </div>
        <ha-expansion-panel outlined>
            <h4 slot="header">
                <ha-icon icon="mdi:view-grid"></ha-icon>
                滑块布局
            </h4>
            <div class="content">
                <ha-form
                    .hass=${hass}
                    .data=${{ slider_fill_orientation: data.slider_fill_orientation || 'left' }}
                    .schema=${[{
            name: 'slider_fill_orientation',
            selector: {
                select: {
                    options: FILL_ORIENTATION_OPTIONS,
                    mode: 'dropdown'
                }
            }
        }]}
                    .computeLabel=${() => '填充方向'}
                    @value-changed=${(ev) => callToggleChange('slider_fill_orientation', ev.detail.value.slider_fill_orientation, meta('ha-form', 'value-changed'))}
                ></ha-form>
                <div class="bubble-info" style="display: ${['top', 'bottom'].includes(data.slider_fill_orientation) ? '' : 'none'}">
                    <h4 class="bubble-section-title">
                        <ha-icon icon="mdi:information-outline"></ha-icon>
                        垂直滑块行为
                    </h4>
                    <div class="content">
                        <p>使用垂直填充方向（从上或从下）时，在移动设备上滑动卡片将激活滑块。这是因为无法区分滚动和滑块交互。</p>
                    </div>
                </div>
                ${isLightColorMode ? '' : html`
                    <ha-form
                        .hass=${hass}
                        .data=${{ slider_value_position: data.slider_value_position || 'right' }}
                        .schema=${[{
                name: 'slider_value_position',
                selector: {
                    select: {
                        options: VALUE_POSITION_OPTIONS,
                        mode: 'dropdown'
                    }
                }
            }]}
                        .computeLabel=${() => '数值位置'}
                        @value-changed=${(ev) => callToggleChange('slider_value_position', ev.detail.value.slider_value_position, meta('ha-form', 'value-changed'))}
                    ></ha-form>
                `}
                <ha-formfield style="display: ${hideInvertSliderToggle ? 'none' : ''}">
                    <ha-switch
                        .checked=${data.invert_slider_value ?? false}
                        @change=${(ev) => callToggleChange('invert_slider_value', ev.target.checked, meta('ha-switch', 'change'))}
                    ></ha-switch>
                    <div class="mdc-form-field">
                        <label class="mdc-label">反转滑块方向（100%填充等于最小值）</label>
                    </div>
                </ha-formfield>
            </div>
        </ha-expansion-panel>
        ${entity?.startsWith("light") ? html`
            <ha-expansion-panel outlined>
                <h4 slot="header">
                    <ha-icon icon="mdi:lightbulb-outline"></ha-icon>
                    灯光选项
                </h4>
                <div class="content">
                    <ha-form
                        .hass=${hass}
                        .data=${{ light_slider_type: data.light_slider_type || 'brightness' }}
                        .schema=${[{
                name: 'light_slider_type',
                selector: {
                    select: {
                        options: [
                            { label: '亮度（默认）', value: 'brightness' },
                            { label: '色相', value: 'hue' },
                            { label: '饱和度', value: 'saturation' },
                            { label: '色温', value: 'white_temp' }
                        ],
                        mode: 'dropdown'
                    }
                }
            }]}
                        .computeLabel=${() => '灯光滑块模式'}
                        @value-changed=${(ev) => callToggleChange('light_slider_type', ev.detail.value.light_slider_type, meta('ha-form', 'value-changed'))}
                    ></ha-form>
                    ${data.light_slider_type === 'hue' ? html`
                        <ha-formfield>
                            <ha-switch
                                .checked=${data.hue_force_saturation ?? false}
                                @change=${(ev) => callToggleChange('hue_force_saturation', ev.target.checked, meta('ha-switch', 'change'))}
                            ></ha-switch>
                            <div class="mdc-form-field">
                                <label class="mdc-label">调整色相时强制饱和度</label>
                            </div>
                        </ha-formfield>
                        ${(data.hue_force_saturation ?? false) ? html`
                            <ha-textfield
                                label="强制饱和度值（0-100）"
                                type="number"
                                min="0"
                                max="100"
                                .value=${String(data.hue_force_saturation_value ?? 100)}
                                @input=${(ev) => callToggleChange('hue_force_saturation_value', ev.target.value, meta('ha-textfield', 'input'))}
                            ></ha-textfield>
                        ` : ''}
                    ` : ''}
                    ${['hue', 'saturation', 'white_temp'].includes(data.light_slider_type) ? html`` : html`
                        <ha-formfield>
                            <ha-switch
                                .checked=${data.use_accent_color ?? false}
                                @change=${(ev) => callToggleChange('use_accent_color', ev.target.checked, meta('ha-switch', 'change'))}
                            ></ha-switch>
                            <div class="mdc-form-field">
                                <label class="mdc-label">使用强调色代替灯光颜色</label>
                            </div>
                        </ha-formfield>
                    `}
                    ${!data.tap_to_slide ? html`
                        <ha-formfield>
                            <ha-switch
                                .checked=${data.allow_light_slider_to_0 ?? false}
                                @change=${(ev) => callToggleChange('allow_light_slider_to_0', ev.target.checked, meta('ha-switch', 'change'))}
                            ></ha-switch>
                            <div class="mdc-form-field">
                                <label class="mdc-label">允许滑块关闭灯光（达到0%）</label>
                            </div>
                        </ha-formfield>
                    ` : ''}
                    <ha-formfield>
                        <ha-switch
                            .checked=${data.light_transition ?? false}
                            @change=${(ev) => callToggleChange('light_transition', ev.target.checked, meta('ha-switch', 'change'))}
                        ></ha-switch>
                        <div class="mdc-form-field">
                            <label class="mdc-label">启用平滑亮度过渡</label>
                        </div>
                    </ha-formfield>
                    ${(data.light_transition ?? false) ? html`
                        <div class="bubble-info">
                            <h4 class="bubble-section-title">
                                <ha-icon icon="mdi:information-outline"></ha-icon>
                                灯光过渡
                            </h4>
                            <div class="content">
                                <p><b>重要：</b>此功能仅适用于支持 
                                <a target="_blank" rel="noopener noreferrer" href="https://www.home-assistant.io/integrations/light/#action-lightturn_on">light.turn_on</a> 过渡属性的灯光。</p>
                                <p>为不支持过渡的灯光启用此功能不会有任何效果。除非在下方覆盖，否则默认为500毫秒。</p>
                            </div>
                        </div>
                        <ha-textfield
                            label="过渡时间（毫秒）"
                            type="number"
                            min="1"
                            max="100000"
                            .value=${data.light_transition_time}
                            @input=${(ev) => callToggleChange('light_transition_time', ev.target.value, meta('ha-textfield', 'input'))}
                        ></ha-textfield>
                    ` : ''}
                </div>
            </ha-expansion-panel>
        ` : ''}
    `;
}
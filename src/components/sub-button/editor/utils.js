// Common sub-button editor utilities to be used in both individual sub-buttons and grouped buttons
// 通用子按钮编辑器工具，用于单个子按钮和分组按钮
import { html } from 'lit';
import { isReadOnlyEntityId } from '../../slider/helpers.js';
import { makeGenericSliderSettings } from '../../slider/editor.js';
import { getLazyLoadedPanelContent } from '../../../editor/utils.js';
import { loadSubButtonClipboard } from './clipboard.js';

export function makeUnifiedSubButtonEditor(editor, button, index, path, updateValueFn, deleteFn, moveFn, copyFn, cutFn, options = {}) {
  const {
    panelKeyPrefix = 'sub_button',
    buttonTitle = `按钮 ${index + 1}${button.name ? ` - ${button.name}` : ''}`,
    arrayLength = null
  } = options;

  // Initialize expanded panel states if needed
  // 初始化展开面板状态（如果需要）
  if (typeof editor._expandedPanelStates === 'undefined') {
    editor._expandedPanelStates = {};
  }

  const entity = button.entity ?? editor._config.entity;
  const isReadOnly = isReadOnlyEntityId(entity);
  const isSelect = entity?.startsWith("input_select") || entity?.startsWith("select") || button.select_attribute;

  // Auto-upgrade implicit select to explicit type for better control in editor
  // 自动将隐式选择升级为显式类型，以便在编辑器中更好地控制
  if (!button.sub_button_type && isSelect) {
    try { setTimeout(() => updateValueFn({ sub_button_type: 'select' })); } catch (_) { }
  }

  const entityAttribute = editor.hass.states[entity]?.attributes;
  const hasSelectAttributeList = editor._selectable_attributes.some(attr => entityAttribute?.[attr]);
  const selectableAttributeList = Object.keys(editor.hass.states[entity]?.attributes || {}).map((attributeName) => {
    let state = editor.hass.states[entity];
    let formattedName = editor.hass.formatEntityAttributeName(state, attributeName);
    return { label: formattedName, value: attributeName };
  }).filter(attribute => editor._selectable_attributes.includes(attribute.value));
  const conditions = button.visibility ?? [];

  // Supported types based on entity capabilities
  // 根据实体功能支持的类型
  const sliderSupported = !isReadOnly;
  const selectSupported = isSelect || hasSelectAttributeList;
  const typeItems = [
    { label: '默认（按钮）', value: 'default' },
    ...(sliderSupported ? [{ label: '滑块', value: 'slider' }] : []),
    ...(selectSupported ? [{ label: '下拉/选择', value: 'select' }] : [])
  ];

  const mainPanelKey = `${panelKeyPrefix}_main_${index}`;
  const settingsPanelKey = `${panelKeyPrefix}_settings_${index}`;
  const actionsPanelKey = `${panelKeyPrefix}_actions_${index}`;
  const visibilityPanelKey = `${panelKeyPrefix}_visibility_${index}`;
  const layoutPanelKey = `${panelKeyPrefix}_layout_${index}`;
  const sliderTypePanelKey = `${panelKeyPrefix}_type_slider_${index}`;

  const disableActions = (button.sub_button_type === 'select' || (!button.sub_button_type && isSelect)) || button.sub_button_type === 'slider';

  const isBottomSection = typeof path === 'string' && path.startsWith('sub_button.bottom');
  const effectiveFillWidth = (button.fill_width == null) ? (isBottomSection ? true : false) : button.fill_width;

  const canMoveLeft = arrayLength !== null ? index > 0 : true;
  const canMoveRight = arrayLength !== null ? index < arrayLength - 1 : true;

  return html`
    <ha-expansion-panel 
      outlined
      @expanded-changed=${(e) => {
      editor._expandedPanelStates[mainPanelKey] = e.target.expanded;
      editor.requestUpdate();
    }}
    >
      <h4 slot="header">
        <ha-icon icon="mdi:border-radius"></ha-icon>
        ${buttonTitle}
        <div class="button-container" @click=${(e) => e.stopPropagation()} @mousedown=${(e) => e.stopPropagation()} @touchstart=${(e) => e.stopPropagation()}>
          <ha-button-menu corner="BOTTOM_START" menuCorner="START" fixed @closed=${(e) => e.stopPropagation()} @click=${(e) => e.stopPropagation()}>
            <mwc-icon-button slot="trigger" class="icon-button header" title="选项">
              <ha-icon style="display: flex" icon="mdi:dots-vertical"></ha-icon>
            </mwc-icon-button>
            <mwc-list-item graphic="icon" ?disabled=${!canMoveLeft} @click=${(e) => { e.stopPropagation(); if (canMoveLeft) moveFn(-1); }}>
              <ha-icon icon="mdi:arrow-left" slot="graphic"></ha-icon>
              左移
            </mwc-list-item>
            <mwc-list-item graphic="icon" ?disabled=${!canMoveRight} @click=${(e) => { e.stopPropagation(); if (canMoveRight) moveFn(1); }}>
              <ha-icon icon="mdi:arrow-right" slot="graphic"></ha-icon>
              右移
            </mwc-list-item>
            <li divider role="separator"></li>
            <mwc-list-item graphic="icon" @click=${(e) => { e.stopPropagation(); copyFn(e); }}>
              <ha-icon icon="mdi:content-copy" slot="graphic"></ha-icon>
              复制
            </mwc-list-item>
            <mwc-list-item graphic="icon" @click=${(e) => { e.stopPropagation(); cutFn(e); }}>
              <ha-icon icon="mdi:content-cut" slot="graphic"></ha-icon>
              剪切
            </mwc-list-item>
            <li divider role="separator"></li>
            <mwc-list-item graphic="icon" class="warning" @click=${(e) => { e.stopPropagation(); deleteFn(e); }}>
              <ha-icon icon="mdi:delete" slot="graphic"></ha-icon>
              删除
            </mwc-list-item>
          </ha-button-menu>
        </div>
      </h4>
      <div class="content">
        ${getLazyLoadedPanelContent(editor, mainPanelKey, !!editor._expandedPanelStates[mainPanelKey], () => html`
          <ha-expansion-panel 
            outlined
            @expanded-changed=${(e) => {
        editor._expandedPanelStates[settingsPanelKey] = e.target.expanded;
        editor.requestUpdate();
      }}
          >
            <h4 slot="header">
              <ha-icon icon="mdi:cog"></ha-icon>
              按钮设置
            </h4>
            <div class="content">
              ${getLazyLoadedPanelContent(editor, settingsPanelKey, !!editor._expandedPanelStates[settingsPanelKey], () => html` 
                <ha-form
                  .hass=${editor.hass}
                  .data=${button}
                  .schema=${[
          {
            name: "entity",
            label: "可选 - 实体（默认使用卡片实体）",
            selector: { entity: {} }
          }
        ]}   
                  .computeLabel=${editor._computeLabelCallback}
                  @value-changed=${(ev) => updateValueFn(ev.detail.value)}
                ></ha-form>
                <ha-form
                  .hass=${editor.hass}
                  .data=${{ sub_button_type: button.sub_button_type ?? 'default' }}
                  .schema=${[{
          name: 'sub_button_type',
          selector: {
            select: {
              options: typeItems,
              mode: 'dropdown'
            }
          }
        }]}
                  .computeLabel=${() => '子按钮类型'}
                  @value-changed=${(ev) => updateValueFn({ sub_button_type: ev.detail.value.sub_button_type })}
                ></ha-form>
                ${button.sub_button_type === 'slider' ? html`
                  <div class="bubble-info">
                    <h4 class="bubble-section-title">
                      <ha-icon icon="mdi:information-outline"></ha-icon>
                      滑块行为
                    </h4>
                    <div class="content">
                      <p>默认情况下，您需要点击子按钮来显示滑块。要使滑块始终可见，请在下方的布局部分启用"始终显示滑块"选项。</p>
                    </div>
                  </div>
                ` : ''}
                ${(button.sub_button_type === 'select' || (!button.sub_button_type && isSelect)) && hasSelectAttributeList ? html`
                  <ha-form
                    .hass=${editor.hass}
                    .data=${{ select_attribute: button.select_attribute }}
                    .schema=${[{
            name: 'select_attribute',
            selector: {
              select: {
                options: selectableAttributeList,
                mode: 'dropdown'
              }
            }
          }]}
                    .computeLabel=${() => '可选 - 选择菜单（来自属性）'}
                    @value-changed=${(ev) => updateValueFn({ select_attribute: ev.detail.value.select_attribute })}
                  ></ha-form>
                ` : ''}
                <div class="ha-textfield">
                  <ha-textfield
                    label="可选 - 名称"
                    .value="${button.name ?? ''}"
                    @input="${(ev) => updateValueFn({ name: ev.target.value })}"
                  ></ha-textfield>
                </div>
                <div class="ha-icon-picker">
                  <ha-icon-picker
                    label="可选 - 图标"
                    .value="${button.icon}"
                    item-label-path="label"
                    item-value-path="value"
                    @value-changed="${(ev) => updateValueFn({ icon: ev.detail.value })}"
                  ></ha-icon-picker>
                </div>
              `)}
              ${editor.makeShowState(button, `${path}.${index}.`, path, index)}
            </div>
          </ha-expansion-panel>

          ${button.sub_button_type === 'slider' ? html`
            <ha-expansion-panel 
              outlined
              @expanded-changed=${(e) => {
          editor._expandedPanelStates[sliderTypePanelKey] = e.target.expanded;
          editor.requestUpdate();
        }}
            >
              <h4 slot="header">
                <ha-icon icon="mdi:tune-variant"></ha-icon>
                滑块设置
              </h4>
              <div class="content">
                ${getLazyLoadedPanelContent(editor, sliderTypePanelKey, !!editor._expandedPanelStates[sliderTypePanelKey], () => html`
                  ${makeGenericSliderSettings({
          hass: editor.hass,
          data: button,
          entity,
          computeLabel: editor._computeLabelCallback,
          onFormChange: (ev) => updateValueFn(ev.detail.value),
          onToggleChange: (key, value) => updateValueFn({ [key]: value }),
          isReadOnly
        })}
                `)}
              </div>
            </ha-expansion-panel>
          ` : ''}

          <ha-expansion-panel 
            outlined 
            @expanded-changed=${(e) => {
        editor._expandedPanelStates[actionsPanelKey] = e.target.expanded;
        editor.requestUpdate();
      }}
          >
            <h4 slot="header">
              <ha-icon icon="mdi:gesture-tap"></ha-icon>
              按钮点击动作
            </h4>
            <div class="content">
              ${getLazyLoadedPanelContent(editor, actionsPanelKey, !!editor._expandedPanelStates[actionsPanelKey], () => html`
                <div style="${disableActions ? 'opacity: 0.5; pointer-events: none;' : ''}">
                  ${editor.makeActionPanel("点击动作", button, 'more-info', path, index)}
                </div>
                ${editor.makeActionPanel("双击动作", button, 'none', path, index)}
                ${editor.makeActionPanel("长按动作", button, 'none', path, index)}
              `)}
            </div>
          </ha-expansion-panel>

          <ha-expansion-panel 
            outlined
            @expanded-changed=${(e) => {
        editor._expandedPanelStates[visibilityPanelKey] = e.target.expanded;
        editor.requestUpdate();
      }}
          >
            <h4 slot="header">
              <ha-icon icon="mdi:eye"></ha-icon>
              可见性
            </h4>
            <div class="content">
              ${getLazyLoadedPanelContent(editor, visibilityPanelKey, !!editor._expandedPanelStates[visibilityPanelKey], () => html`
                <ha-formfield label="父实体不可用时隐藏">
                  <ha-switch
                    .checked=${button.hide_when_parent_unavailable ?? false}
                    @change=${(ev) => updateValueFn({ hide_when_parent_unavailable: ev.target.checked })}
                  ></ha-switch>
                </ha-formfield>
                <ha-card-conditions-editor
                  .hass=${editor.hass}
                  .conditions=${conditions}
                  @value-changed=${(ev) => updateValueFn({ visibility: ev.detail.value })}
                >
                </ha-card-conditions-editor>
                <ha-alert alert-type="info">
                  当所有条件都满足时，子按钮将显示。如果未设置条件，子按钮将始终显示。
                </ha-alert>
              `)}
            </div>
          </ha-expansion-panel>

          <ha-expansion-panel 
            outlined
            @expanded-changed=${(e) => {
        editor._expandedPanelStates[layoutPanelKey] = e.target.expanded;
        editor.requestUpdate();
      }}
          >
            <h4 slot="header">
              <ha-icon icon="mdi:view-grid"></ha-icon>
              布局
            </h4>
            <div class="content">
              ${getLazyLoadedPanelContent(editor, layoutPanelKey, !!editor._expandedPanelStates[layoutPanelKey], () => html`
                <ha-form
                  .hass=${editor.hass}
                  .data=${{ ...button, ...(isBottomSection ? { fill_width: effectiveFillWidth } : {}) }}
                  .schema=${[
          ...(isBottomSection
            ? [{
              name: "fill_width",
              label: "填充可用宽度",
              selector: { boolean: {} }
            }]
            : []
          ),
          ...(button.sub_button_type === 'slider' ? [{
            name: "always_visible",
            label: "始终显示滑块",
            selector: { boolean: {} }
          }] : []),
          {
            name: "width",
            label: isBottomSection ? "自定义按钮宽度 (%)" : "自定义按钮宽度 (px)",
            selector: {
              number: {
                min: isBottomSection
                  ? 0
                  : (button.sub_button_type === 'slider' && button.always_visible ? 68 : 36),
                max: isBottomSection ? 100 : 600,
                mode: "box"
              }
            },
            disabled: effectiveFillWidth === true
          },
          {
            name: "custom_height",
            label: "自定义按钮高度 (px)",
            selector: { number: { min: 20, max: 600, mode: "box" } }
          },
          ...(button.sub_button_type !== 'slider' || !button.always_visible ? [{
            name: "content_layout",
            label: "内容布局",
            selector: {
              select: {
                options: [
                  { value: "icon-left", label: "图标在左（默认）" },
                  { value: "icon-top", label: "图标在上" },
                  { value: "icon-bottom", label: "图标在下" },
                  { value: "icon-right", label: "图标在右" }
                ],
                mode: "dropdown"
              }
            }
          }] : [])
        ]}   
                  .computeLabel=${editor._computeLabelCallback}
                  @value-changed=${(ev) => updateValueFn(ev.detail.value)}
                ></ha-form>
              `)}
            </div>
          </ha-expansion-panel>
        `)}
      </div>
    </ha-expansion-panel>
  `;
}

// Common clipboard operations
// 通用剪贴板操作
export function createCopyHandler(editor, itemToCopy, saveFn) {
  return (event) => {
    event?.stopPropagation();
    if (!itemToCopy) return;
    try {
      editor._clipboardButton = JSON.parse(JSON.stringify(itemToCopy));
    } catch (_) {
      editor._clipboardButton = itemToCopy;
    }
    if (saveFn) saveFn(editor._clipboardButton);
    editor.requestUpdate();
  };
}

export function createCutHandler(editor, itemToCopy, removeFn, saveFn) {
  return (event) => {
    event?.stopPropagation();
    createCopyHandler(editor, itemToCopy, saveFn)(event);
    if (removeFn) removeFn(event);
  };
}

// Helper to find section key from array reference
// 从数组引用中查找分区键的辅助函数
function findSectionKey(editor, targetArray) {
  if (targetArray === editor._config.sub_button?.main) return 'main';
  if (targetArray === editor._config.sub_button?.bottom) return 'bottom';
  return null;
}

// Helper to safely update sub_button property
// 安全更新 sub_button 属性的辅助函数
function updateSubButtonProperty(editor, sectionKey, updater) {
  try {
    editor._config.sub_button[sectionKey] = updater(editor._config.sub_button[sectionKey]);
  } catch (_) {
    // If sub_button is frozen, clone it
    // 如果 sub_button 被冻结，则克隆它
    try {
      editor._config.sub_button = { ...editor._config.sub_button, [sectionKey]: updater(editor._config.sub_button[sectionKey]) };
    } catch (__) {
      // If config itself is frozen, clone the entire config
      // 如果配置本身被冻结，则克隆整个配置
      editor._config = { ...editor._config, sub_button: { ...editor._config.sub_button, [sectionKey]: updater(editor._config.sub_button[sectionKey]) } };
    }
  }
}

// Common remove operation
// 通用删除操作
export function createRemoveHandler(editor, targetArray, index, onValueChanged) {
  return (event) => {
    event?.stopPropagation();
    const sectionKey = findSectionKey(editor, targetArray);
    if (!sectionKey) {
      // Fallback for non-section arrays
      // 非分区数组的后备方案
      const targetArrayCopy = [...targetArray];
      targetArrayCopy.splice(index, 1);
      if (onValueChanged) onValueChanged(editor);
      editor.requestUpdate();
      return;
    }
    // Use section update helper
    // 使用分区更新辅助函数
    const targetArr = editor._config.sub_button[sectionKey];
    const targetArrayCopy = [...targetArr];
    targetArrayCopy.splice(index, 1);
    updateSubButtonProperty(editor, sectionKey, () => targetArrayCopy);
    if (onValueChanged) onValueChanged(editor);
    editor.requestUpdate();
  };
}

// Common move operation
// 通用移动操作
export function createMoveHandler(editor, targetArray, index, onValueChanged) {
  return (direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= targetArray.length) return;
    const sectionKey = findSectionKey(editor, targetArray);
    if (!sectionKey) {
      // Fallback for non-section arrays
      // 非分区数组的后备方案
      const targetArrayCopy = [...targetArray];
      [targetArrayCopy[index], targetArrayCopy[newIndex]] = [targetArrayCopy[newIndex], targetArrayCopy[index]];
      if (onValueChanged) onValueChanged(editor);
      editor.requestUpdate();
      return;
    }
    // Use section update helper
    // 使用分区更新辅助函数
    const targetArr = editor._config.sub_button[sectionKey];
    const targetArrayCopy = [...targetArr];
    [targetArrayCopy[index], targetArrayCopy[newIndex]] = [targetArrayCopy[newIndex], targetArrayCopy[index]];
    updateSubButtonProperty(editor, sectionKey, () => targetArrayCopy);
    if (onValueChanged) onValueChanged(editor);
    editor.requestUpdate();
  };
}

// Convert individual buttons to a group, preserving existing groups
// 将单个按钮转换为组，保留现有组
export function convertIndividualButtonsToGroup(arr) {
  const individuals = arr.filter(item => item && !Array.isArray(item.group));
  if (individuals.length === 0) return [...arr];

  const groups = arr.filter(item => item && Array.isArray(item.group));
  return [
    { name: '自动分组', buttons_layout: 'inline', group: individuals },
    ...groups
  ];
}

// Common paste operation
// 通用粘贴操作
export function createPasteHandler(editor, targetArray, onValueChanged, getClipboardFn) {
  return () => {
    const stored = editor._clipboardButton || (getClipboardFn ? getClipboardFn() : null);
    if (!stored) return;

    editor._clipboardButton = stored;
    const clone = JSON.parse(JSON.stringify(stored));
    const sectionKey = findSectionKey(editor, targetArray);
    const isPastingGroup = Array.isArray(clone.buttons) || Array.isArray(clone.group);

    const sourceArr = sectionKey ? editor._config.sub_button[sectionKey] : targetArray;
    let result = isPastingGroup ? convertIndividualButtonsToGroup(sourceArr) : [...sourceArr];

    if (isPastingGroup) {
      result.push({
        name: clone.name,
        buttons_layout: clone.display || clone.buttons_layout || 'inline',
        justify_content: clone.justify_content,
        group: clone.buttons || clone.group || []
      });
    } else {
      result.push(clone);
    }

    if (sectionKey) {
      updateSubButtonProperty(editor, sectionKey, () => result);
    }
    if (onValueChanged) onValueChanged(editor);
    editor.requestUpdate();
  };
}

// Paste handler for buttons within a group
// 组内按钮的粘贴处理程序
export function createGroupButtonPasteHandler(editor, targetArray, groupIndex, onValueChanged, getClipboardFn) {
  return () => {
    const stored = editor._clipboardButton || (getClipboardFn ? getClipboardFn() : null);
    if (!stored) return;
    editor._clipboardButton = stored;
    const sectionKey = findSectionKey(editor, targetArray);
    if (!sectionKey) return;
    // Use section update helper
    // 使用分区更新辅助函数
    const targetArr = editor._config.sub_button[sectionKey];
    const targetArrayCopy = [...targetArr];
    const groupCopy = { ...targetArrayCopy[groupIndex] };
    if (!Array.isArray(groupCopy.group)) groupCopy.group = [];

    // Check if group has non-fill alignment in bottom section
    // 检查组在底部分区是否具有非填充对齐
    const hasNonFillAlignment = sectionKey === 'bottom' && groupCopy.justify_content && groupCopy.justify_content !== 'fill';

    const isGroup = Array.isArray(stored?.buttons) || Array.isArray(stored?.group);
    if (isGroup) {
      let copy = JSON.parse(JSON.stringify(stored.buttons || stored.group || []));
      // Apply fill_width: false to pasted buttons if group has non-fill alignment
      // 如果组具有非填充对齐，则将 fill_width: false 应用于粘贴的按钮
      if (hasNonFillAlignment) {
        copy = copy.map(btn => btn ? { ...btn, fill_width: false } : btn);
      }
      groupCopy.group = [...groupCopy.group, ...copy];
    } else {
      let copy = JSON.parse(JSON.stringify(stored));
      // Apply fill_width: false to pasted button if group has non-fill alignment
      // 如果组具有非填充对齐，则将 fill_width: false 应用于粘贴的按钮
      if (hasNonFillAlignment && copy) {
        copy.fill_width = false;
      }
      groupCopy.group = [...groupCopy.group, copy];
    }
    targetArrayCopy[groupIndex] = groupCopy;
    updateSubButtonProperty(editor, sectionKey, () => targetArrayCopy);
    if (onValueChanged) onValueChanged(editor);
    editor.requestUpdate();
  };
}

// Get paste button text
// 获取粘贴按钮文本
export function getPasteButtonText(editor, getClipboardFn) {
  const c = editor._clipboardButton || (getClipboardFn ? getClipboardFn() : null);
  return c ? `粘贴 "${c.name || '子按钮'}"` : '粘贴';
}


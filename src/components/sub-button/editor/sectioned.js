import { html } from 'lit';
import { getLazyLoadedPanelContent } from '../../../editor/utils.js';
import {
  makeUnifiedSubButtonEditor,
  createCopyHandler,
  createCutHandler,
  createRemoveHandler,
  createMoveHandler,
  createPasteHandler,
  createGroupButtonPasteHandler,
  getPasteButtonText,
  convertIndividualButtonsToGroup
} from './utils.js';
import { loadSubButtonClipboard, saveSubButtonClipboard } from './clipboard.js';
import { ensureNewSubButtonsSchemaObject, convertOldToNewSubButtons, isNewSubButtonsSchema } from '../utils.js';

// Ensure sub_button object/section arrays exist only when needed
function getOrInitSectionArray(editor, sectionKey) {
  // Block main section for sub-buttons card
  if (editor._config.card_type === 'sub-buttons' && sectionKey === 'main') {
    return [];
  }
  // If legacy array, migrate to sectioned shape on first write
  if (Array.isArray(editor._config.sub_button)) {
    const converted = convertOldToNewSubButtons(editor._config.sub_button);
    const minimal = {};
    if (Array.isArray(converted.main) && converted.main.length) minimal.main = converted.main.slice();
    if (Array.isArray(converted.bottom) && converted.bottom.length) minimal.bottom = converted.bottom.slice();
    try {
      editor._config.sub_button = minimal;
    } catch (_) {
      // If config is frozen/non-extensible, replace it with a cloned one
      editor._config = { ...editor._config, sub_button: minimal };
    }
  }
  if (!editor._config.sub_button) {
    try {
      editor._config.sub_button = {};
    } catch (_) {
      editor._config = { ...editor._config, sub_button: {} };
    }
  }
  if (!Array.isArray(editor._config.sub_button[sectionKey])) {
    try {
      editor._config.sub_button[sectionKey] = [];
    } catch (_) {
      // If sub_button is frozen, clone it
      try {
        editor._config.sub_button = { ...editor._config.sub_button, [sectionKey]: [] };
      } catch (__) {
        // If config itself is frozen, clone the entire config
        editor._config = { ...editor._config, sub_button: { ...editor._config.sub_button, [sectionKey]: [] } };
      }
    }
  }
  return editor._config.sub_button[sectionKey];
}

// Helper to safely update section array (clones to ensure extensibility)
function updateSectionArray(editor, sectionKey, updater, onValueChanged) {
  const targetArr = getOrInitSectionArray(editor, sectionKey);
  const targetArrCopy = updater([...targetArr]);
  // Clone sub_button object to ensure it is extensible
  try {
    editor._config.sub_button[sectionKey] = targetArrCopy;
  } catch (_) {
    // If sub_button is frozen, clone it
    try {
      editor._config.sub_button = { ...editor._config.sub_button, [sectionKey]: targetArrCopy };
    } catch (__) {
      // If config itself is frozen, clone the entire config
      editor._config = { ...editor._config, sub_button: { ...editor._config.sub_button, [sectionKey]: targetArrCopy } };
    }
  }
  if (onValueChanged) onValueChanged(editor);
  editor.requestUpdate();
}

// Helper to safely update a group within a section array
function updateGroupInSection(editor, sectionKey, groupIndex, updater, onValueChanged) {
  const targetArr = getOrInitSectionArray(editor, sectionKey);
  const targetArrCopy = [...targetArr];
  const groupCopy = { ...targetArrCopy[groupIndex] };
  const updatedGroup = updater(groupCopy);
  targetArrCopy[groupIndex] = updatedGroup;
  // Clone sub_button object to ensure it is extensible
  try {
    editor._config.sub_button[sectionKey] = targetArrCopy;
  } catch (_) {
    // If sub_button is frozen, clone it
    try {
      editor._config.sub_button = { ...editor._config.sub_button, [sectionKey]: targetArrCopy };
    } catch (__) {
      // If config itself is frozen, clone the entire config
      editor._config = { ...editor._config, sub_button: { ...editor._config.sub_button, [sectionKey]: targetArrCopy } };
    }
  }
  if (onValueChanged) onValueChanged(editor);
  editor.requestUpdate();
}

// Commit minimal sub_button to config: remove empty sections and drop the property when empty
function subButtonsValueChanged(editor) {
  const sb = editor._config.sub_button;
  const isSubButtonsCard = editor._config.card_type === 'sub-buttons';
  const hasAnyButtons = (arr) => Array.isArray(arr) && arr.some((item) => {
    if (!item) return false;
    if (Array.isArray(item.group)) {
      // Consider an empty group as a valid element so that newly added
      // groups are not discarded before the user adds buttons to them
      return true;
    }
    return true;
  });
  const hasMain = !isSubButtonsCard && hasAnyButtons(sb?.main);
  const hasBottom = hasAnyButtons(sb?.bottom);

  const hasGlobalLayouts = !!(sb && (typeof sb.main_layout !== 'undefined' || typeof sb.bottom_layout !== 'undefined'));
  if (!hasMain && !hasBottom && !hasGlobalLayouts) {
    try { delete editor._config.sub_button; } catch (_) {
      editor._config = { ...editor._config };
      delete editor._config.sub_button;
    }
    editor._valueChanged({ target: { configValue: 'sub_button', value: undefined } });
    return;
  }

  if (hasBottom) {
    editor._firstRowsComputation = true;
    // In section view, if card_layout is explicitly set to 'normal', remove it to use default 'large'
    const isSectionView = Boolean(window.isSectionView);
    const hasCardLayoutExplicitlyDefined = Object.prototype.hasOwnProperty.call(editor._config, 'card_layout');
    if (isSectionView && hasCardLayoutExplicitlyDefined && editor._config.card_layout === 'normal') {
      try {
        delete editor._config.card_layout;
      } catch (_) {
        const configCopy = { ...editor._config };
        delete configCopy.card_layout;
        editor._config = configCopy;
      }
      editor._valueChanged({ target: { configValue: 'card_layout', value: undefined } });
    }
  }

  const value = {};
  if (hasMain) value.main = (sb.main || []).filter(it => !!it);
  if (hasBottom) value.bottom = (sb.bottom || []).filter(it => !!it);
  if (sb && typeof sb.main_layout !== 'undefined' && !isSubButtonsCard) value.main_layout = sb.main_layout;
  if (sb && typeof sb.bottom_layout !== 'undefined') value.bottom_layout = sb.bottom_layout;
  editor._valueChanged({ target: { configValue: 'sub_button', value } });
}

function makeGroupEditor(editor, group, groupIndex, sectionKey) {
  const panelKey = `${sectionKey}_group_${groupIndex}`;
  const targetArr = sectionKey === 'main' ? editor._config.sub_button.main : editor._config.sub_button.bottom;

  const updateGroupValues = (values) => {
    updateGroupInSection(editor, sectionKey, groupIndex, (group) => {
      const next = { ...group };
      const groupButtons = Array.isArray(group.group) ? [...group.group] : [];
      const hasExplicitFill = groupButtons.some((b) => b && b.fill_width === true);
      // Map editor values to schema fields
      if (Object.prototype.hasOwnProperty.call(values, 'name')) next.name = values.name;
      // group_layout removed in favor of global layout controls
      if (Object.prototype.hasOwnProperty.call(values, 'buttons_layout')) next.buttons_layout = values.buttons_layout;
      // Only process justify_content for bottom section (selector is not shown for main)
      if (sectionKey === 'bottom' && Object.prototype.hasOwnProperty.call(values, 'justify_content')) {
        const requested = values.justify_content;
        // Map UI pseudo-value 'fill' to config (remove justify_content), otherwise set real CSS value
        if (requested === 'fill') {
          // Selecting Fill available width does not set a CSS justify; remove to use default
          if (Object.prototype.hasOwnProperty.call(next, 'justify_content')) delete next.justify_content;
          // Restore per-button fill behavior
          if (Array.isArray(groupButtons)) {
            for (let i = 0; i < groupButtons.length; i += 1) {
              const btn = groupButtons[i];
              if (!btn) continue;
              if (sectionKey === 'bottom') {
                // Bottom defaults to fill when undefined: remove explicit false
                if (btn.fill_width === false) {
                  const { fill_width, ...rest } = btn;
                  groupButtons[i] = { ...rest };
                }
              } else {
                // Top does not default to fill: explicitly enable fill_width
                if (btn.fill_width !== true) {
                  groupButtons[i] = { ...btn, fill_width: true };
                }
              }
            }
            next.group = groupButtons;
          }
        } else {
          // If any sub-button explicitly forces fill_width, ignore alignment change and keep UI locked to 'fill'
          if (hasExplicitFill) {
            // No-op: do not update justify_content; UI will recompute to 'fill' and be disabled
          } else {
            next.justify_content = requested;
            // Switching to a non-fill alignment disables fill width on all buttons in the group
            if (Array.isArray(groupButtons)) {
              for (let i = 0; i < groupButtons.length; i += 1) {
                const btn = groupButtons[i];
                if (!btn) continue;
                if (btn.fill_width !== false) {
                  groupButtons[i] = { ...btn, fill_width: false };
                }
              }
              next.group = groupButtons;
            }
          }
        }
      }
      return next;
    }, subButtonsValueChanged);
  };

  const groupToCopy = targetArr[groupIndex];
  const removeGroup = createRemoveHandler(editor, targetArr, groupIndex, subButtonsValueChanged);
  const moveGroup = createMoveHandler(editor, targetArr, groupIndex, subButtonsValueChanged);
  const copyGroup = createCopyHandler(editor, groupToCopy, saveSubButtonClipboard);
  const cutGroup = createCutHandler(editor, groupToCopy, removeGroup, saveSubButtonClipboard);

  const pasteGroupButton = createGroupButtonPasteHandler(editor, targetArr, groupIndex, subButtonsValueChanged, loadSubButtonClipboard);

  const canMoveUp = groupIndex > 0;
  const canMoveDown = groupIndex < targetArr.length - 1;

  return html`
    <ha-expansion-panel 
      outlined
      style="border-style: dashed;"
      @expanded-changed=${(e) => {
      editor._expandedPanelStates[panelKey] = e.target.expanded;
      editor.requestUpdate();
    }}
    >
      <h4 slot="header">
        <ha-icon icon="mdi:format-list-group"></ha-icon>
        ${group.name || `组 ${groupIndex + 1}`}
        <div class="button-container" @click=${(e) => e.stopPropagation()} @mousedown=${(e) => e.stopPropagation()} @touchstart=${(e) => e.stopPropagation()}>
          <ha-button-menu corner="BOTTOM_START" menuCorner="START" fixed @closed=${(e) => e.stopPropagation()} @click=${(e) => e.stopPropagation()}>
            <mwc-icon-button slot="trigger" class="icon-button header" title="选项">
              <ha-icon style="display: flex" icon="mdi:dots-vertical"></ha-icon>
            </mwc-icon-button>
            <mwc-list-item graphic="icon" ?disabled=${!canMoveUp} @click=${(e) => { e.stopPropagation(); if (canMoveUp) moveGroup(-1); }}>
              <ha-icon icon="mdi:arrow-up" slot="graphic"></ha-icon>
              上移
            </mwc-list-item>
            <mwc-list-item graphic="icon" ?disabled=${!canMoveDown} @click=${(e) => { e.stopPropagation(); if (canMoveDown) moveGroup(1); }}>
              <ha-icon icon="mdi:arrow-down" slot="graphic"></ha-icon>
              下移
            </mwc-list-item>
            <li divider role="separator"></li>
            <mwc-list-item graphic="icon" @click=${(e) => { e.stopPropagation(); copyGroup(e); }}>
              <ha-icon icon="mdi:content-copy" slot="graphic"></ha-icon>
              复制组
            </mwc-list-item>
            <mwc-list-item graphic="icon" @click=${(e) => { e.stopPropagation(); cutGroup(e); }}>
              <ha-icon icon="mdi:content-cut" slot="graphic"></ha-icon>
              剪切组
            </mwc-list-item>
            <li divider role="separator"></li>
            <mwc-list-item graphic="icon" class="warning" @click=${(e) => { e.stopPropagation(); removeGroup(e); }}>
              <ha-icon icon="mdi:delete" slot="graphic"></ha-icon>
              删除
            </mwc-list-item>
          </ha-button-menu>
        </div>
      </h4>
      <div class="content">
        ${getLazyLoadedPanelContent(editor, panelKey, !!editor._expandedPanelStates[panelKey], () => html`
          <ha-form
            .hass=${editor.hass}
            .data=${{ name: group.name ?? '' }}
            .schema=${[
        { name: 'name', label: '组名称', selector: { text: {} } }
      ]}
            .computeLabel=${editor._computeLabelCallback}
            @value-changed=${(ev) => updateGroupValues(ev.detail.value)}
          ></ha-form>

          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:view-grid"></ha-icon>
              组布局
            </h4>
            <div class="content">
              <ha-form
                .hass=${editor.hass}
                .data=${(() => {
        const groupButtons = Array.isArray(group.group) ? group.group : [];
        const hasExplicitFill = groupButtons.some((b) => b && b.fill_width === true);
        const computedAlignment = hasExplicitFill ? 'fill' : (group.justify_content ?? 'fill');
        return { buttons_layout: group.buttons_layout ?? 'inline', justify_content: computedAlignment };
      })()}
                .schema=${(() => {
        const groupButtons = Array.isArray(group.group) ? group.group : [];
        const hasExplicitFill = groupButtons.some((b) => b && b.fill_width === true);
        let justifyContentOptions = [
          { value: 'fill', label: '填充可用宽度（默认）' },
          { value: 'end', label: '右侧' },
          { value: 'start', label: '左侧' },
          { value: 'center', label: '居中' },
          { value: 'space-between', label: '两端对齐' },
          { value: 'space-around', label: '分散对齐' },
          { value: 'space-evenly', label: '均匀分布' }
        ];

        if (group.buttons_layout === 'column') {
          justifyContentOptions = justifyContentOptions.filter(option =>
            !['space-between', 'space-around', 'space-evenly'].includes(option.value)
          );
        }

        const schema = [
          {
            name: 'buttons_layout',
            label: '按钮布局',
            selector: {
              select: {
                options: [
                  { value: 'inline', label: '内联' },
                  { value: 'column', label: '列' },
                ],
                mode: 'dropdown'
              }
            }
          }
        ];

        // Show alignment selector only for bottom section groups
        if (sectionKey === 'bottom') {
          schema.push({
            name: 'justify_content',
            label: '按钮对齐',
            selector: {
              select: {
                options: justifyContentOptions,
                mode: 'dropdown'
              }
            },
            disabled: hasExplicitFill
          });
        }

        return schema;
      })()}
                .computeLabel=${editor._computeLabelCallback}
                @value-changed=${(ev) => updateGroupValues(ev.detail.value)}
              ></ha-form>
              ${(() => {
        if (sectionKey !== 'bottom') return '';
        const groupButtons = Array.isArray(group.group) ? group.group : [];
        const hasExplicitFill = groupButtons.some((b) => b && b.fill_width === true);
        return hasExplicitFill ? html`
                  <div class="bubble-info">
                    <h4 class="bubble-section-title">
                      <ha-icon icon="mdi:information-outline"></ha-icon>
                      按钮对齐已被子按钮设置锁定
                    </h4>
                    <div class="content">
                      <p>一个或多个子按钮显式启用了"填充可用宽度"。要更改对齐方式，请先在这些子按钮中禁用"填充可用宽度"。</p>
                    </div>
                  </div>
                ` : '';
      })()}
            </div>
          </ha-expansion-panel>

          <h4 class="group-buttons-header">组子按钮</h4>
          ${Array.isArray(group.group) ? group.group.map((button, buttonIndex) => {
        if (!button) return null;

        const updateButton = (values) => {
          updateGroupInSection(editor, sectionKey, groupIndex, (group) => {
            const groupCopy = { ...group };
            const nextButtons = Array.isArray(groupCopy.group) ? [...groupCopy.group] : [];
            nextButtons[buttonIndex] = { ...(nextButtons[buttonIndex] || {}), ...values };
            groupCopy.group = nextButtons;
            return groupCopy;
          }, subButtonsValueChanged);
        };

        const removeButton = (event) => {
          event?.stopPropagation();
          updateGroupInSection(editor, sectionKey, groupIndex, (group) => {
            const groupCopy = { ...group };
            const nextButtons = Array.isArray(groupCopy.group) ? [...groupCopy.group] : [];
            nextButtons.splice(buttonIndex, 1);
            groupCopy.group = nextButtons;
            return groupCopy;
          }, subButtonsValueChanged);
        };

        const moveButton = (direction) => {
          const targetIndex = buttonIndex + direction;
          const targetArr = getOrInitSectionArray(editor, sectionKey);
          const buttons = Array.isArray(targetArr[groupIndex]?.group) ? targetArr[groupIndex].group : [];
          if (targetIndex < 0 || targetIndex >= buttons.length) return;
          updateGroupInSection(editor, sectionKey, groupIndex, (group) => {
            const groupCopy = { ...group };
            const buttonsCopy = Array.isArray(groupCopy.group) ? [...groupCopy.group] : [];
            [buttonsCopy[buttonIndex], buttonsCopy[targetIndex]] = [buttonsCopy[targetIndex], buttonsCopy[buttonIndex]];
            groupCopy.group = buttonsCopy;
            return groupCopy;
          }, subButtonsValueChanged);
        };

        const btnToCopy = Array.isArray(group.group) ? group.group[buttonIndex] : null;
        const copyButton = createCopyHandler(editor, btnToCopy, saveSubButtonClipboard);
        const cutButton = createCutHandler(editor, btnToCopy, removeButton, saveSubButtonClipboard);

        const buttons = Array.isArray(group.group) ? group.group : [];
        const buttonsLength = buttons.length;

        return makeUnifiedSubButtonEditor(
          editor,
          button,
          buttonIndex,
          `sub_button.${sectionKey}.${groupIndex}.group`,
          updateButton,
          removeButton,
          moveButton,
          copyButton,
          cutButton,
          { panelKeyPrefix: `${sectionKey}_group_${groupIndex}_button`, buttonTitle: button.name || `按钮 ${buttonIndex + 1}`, arrayLength: buttonsLength }
        );
      }) : null}

          <div class="element-actions">
            <button class="icon-button paste-button no-bg ${!(editor._clipboardButton || loadSubButtonClipboard()) ? 'disabled' : ''}" @click=${pasteGroupButton}>
              <ha-icon icon="mdi:content-paste"></ha-icon>
              <span class="paste-button-text">
                ${getPasteButtonText(editor, loadSubButtonClipboard)}
              </span>
            </button>
            <button class="icon-button" @click=${() => {
        updateGroupInSection(editor, sectionKey, groupIndex, (group) => {
          const groupCopy = { ...group };
          if (!Array.isArray(groupCopy.group)) groupCopy.group = [];
          // If group has a non-fill alignment in bottom section, new button should have fill_width: false
          const hasNonFillAlignment = sectionKey === 'bottom' && groupCopy.justify_content && groupCopy.justify_content !== 'fill';
          const newButton = hasNonFillAlignment
            ? { entity: editor._config.entity, fill_width: false }
            : { entity: editor._config.entity };
          groupCopy.group = [...groupCopy.group, newButton];
          return groupCopy;
        }, subButtonsValueChanged);
      }}>
              <ha-icon icon="mdi:shape-square-rounded-plus"></ha-icon>
              添加子按钮
            </button>
          </div>
        `)}
      </div>
    </ha-expansion-panel>
  `;
}

// Helper to check section state
function getSectionState(editor, sectionKey) {
  const sectionedView = ensureNewSubButtonsSchemaObject(editor._config);
  const items = Array.isArray(sectionedView?.[sectionKey]) ? sectionedView[sectionKey] : [];
  return {
    items,
    hasGroups: items.some(item => item && Array.isArray(item.group)),
    hasIndividualButtons: items.some(item => item && !Array.isArray(item.group))
  };
}

// Initialize and get dismiss state for groups info
function getGroupsInfoDismissState(editor, sectionKey) {
  const dismissKey = `bubble-card-groups-info-dismissed-${sectionKey}`;
  if (!editor._groupsInfoDismissed) editor._groupsInfoDismissed = {};
  if (editor._groupsInfoDismissed[sectionKey] === undefined) {
    try { editor._groupsInfoDismissed[sectionKey] = localStorage.getItem(dismissKey) === 'true'; }
    catch (_) { editor._groupsInfoDismissed[sectionKey] = false; }
  }
  return {
    isDismissed: editor._groupsInfoDismissed[sectionKey],
    dismiss: () => {
      editor._groupsInfoDismissed[sectionKey] = true;
      try { localStorage.setItem(dismissKey, 'true'); } catch (_) { }
      editor.requestUpdate();
    }
  };
}

function makeSectionList(editor, sectionKey) {
  let { items, hasGroups, hasIndividualButtons } = getSectionState(editor, sectionKey);

  // Auto-migrate mixed configurations on editor load
  if (hasGroups && hasIndividualButtons) {
    items = convertIndividualButtonsToGroup(items);
    updateSectionArray(editor, sectionKey, () => items, subButtonsValueChanged);
  }

  const { isDismissed, dismiss } = getGroupsInfoDismissState(editor, sectionKey);

  const addButton = () => {
    updateSectionArray(editor, sectionKey, (arr) => [...arr, { entity: editor._config.entity }], subButtonsValueChanged);
  };

  const addGroup = () => {
    updateSectionArray(editor, sectionKey, (arr) => {
      const converted = convertIndividualButtonsToGroup(arr);
      const groupCount = converted.filter(i => i && Array.isArray(i.group)).length;
      return [...converted, { name: `组 ${groupCount + 1}`, buttons_layout: 'inline', group: [] }];
    }, subButtonsValueChanged);
  };

  return html`
    ${hasGroups && !isDismissed ? html`
      <div class="bubble-info">
        <h4 class="bubble-section-title">
          <ha-icon icon="mdi:information-outline"></ha-icon>
          分组模式
          <div class="bubble-info-dismiss bubble-badge" @click=${dismiss} title="关闭" 
            style="display: inline-flex; align-items: center; position: absolute; right: 16px; padding: 0 8px; cursor: pointer;">
            <ha-icon icon="mdi:close" style="margin: 0;"></ha-icon>
            关闭
          </div>
        </h4>
        <div class="content">
          <p>您现在处于<b>分组模式</b>。所有子按钮必须在组内以确保一致的排序。您可以根据需要重命名、重新排序或删除组。</p>
        </div>
      </div>
    ` : ''}
    ${items.map((item, index) => {
    if (!item) return null;
    // Group
    if (Array.isArray(item.group)) {
      return makeGroupEditor(editor, item, index, sectionKey);
    }

    // Single button
    const panelKey = `${sectionKey}_button_${index}`;
    const targetArr = sectionKey === 'main' ? editor._config.sub_button.main : editor._config.sub_button.bottom;

    const updateButton = (values) => {
      updateSectionArray(editor, sectionKey, (arr) => {
        const arrCopy = [...arr];
        arrCopy[index] = { ...(arrCopy[index] || {}), ...values };
        return arrCopy;
      }, subButtonsValueChanged);
    };
    const removeButton = createRemoveHandler(editor, targetArr, index, subButtonsValueChanged);
    const moveButton = createMoveHandler(editor, targetArr, index, subButtonsValueChanged);
    const buttonToCopy = targetArr[index];
    const copyButton = createCopyHandler(editor, buttonToCopy, saveSubButtonClipboard);
    const cutButton = createCutHandler(editor, buttonToCopy, removeButton, saveSubButtonClipboard);
    const targetArrLength = targetArr.length;
    return makeUnifiedSubButtonEditor(
      editor,
      item,
      index,
      `sub_button.${sectionKey}`,
      updateButton,
      removeButton,
      moveButton,
      copyButton,
      cutButton,
      { panelKeyPrefix: `${sectionKey}_button`, buttonTitle: `按钮 ${index + 1}${item.name ? ` - ${item.name}` : ''}`, arrayLength: targetArrLength }
    );
  })}

    <div class="element-actions">
      ${(() => {
      const targetArr = sectionKey === 'main' ? getOrInitSectionArray(editor, 'main') : getOrInitSectionArray(editor, 'bottom');
      const pasteSection = createPasteHandler(editor, targetArr, subButtonsValueChanged, loadSubButtonClipboard);
      return html`
          <button class="icon-button paste-button no-bg ${!(editor._clipboardButton || loadSubButtonClipboard()) ? 'disabled' : ''}" @click=${pasteSection}>
            <ha-icon icon="mdi:content-paste"></ha-icon>
            <span class="paste-button-text">
              ${getPasteButtonText(editor, loadSubButtonClipboard)}
            </span>
          </button>
        `;
    })()}
      ${hasGroups ? html`
        <button class="icon-button" @click=${() => { addGroup(); }}>
          <ha-icon icon="mdi:format-list-group-plus"></ha-icon>
          添加组
        </button>
      ` : html`
        <ha-button-menu corner="BOTTOM_START" menuCorner="START" fixed @closed=${(e) => e.stopPropagation()} @click=${(e) => e.stopPropagation()}>
          <button slot="trigger" class="icon-button add-menu-trigger">
            <ha-icon icon="mdi:plus"></ha-icon>
            添加
          </button>
          <mwc-list-item graphic="icon" @click=${() => { addButton(); }}>
            <ha-icon icon="mdi:shape-square-rounded-plus" slot="graphic"></ha-icon>
            添加子按钮
          </mwc-list-item>
          <mwc-list-item graphic="icon" @click=${() => { addGroup(); }}>
            <ha-icon icon="mdi:format-list-group-plus" slot="graphic"></ha-icon>
            添加组
          </mwc-list-item>
        </ha-button-menu>
      `}
    </div>
  `;
}

function makeLayoutForm(editor, sectionKey) {
  if (!getSectionState(editor, sectionKey).hasGroups) return '';

  const layoutKey = `${sectionKey}_layout`;
  const layoutValue = editor._config?.sub_button?.[layoutKey] ?? 'inline';

  return html`
    <ha-form
      .hass=${editor.hass}
      .data=${{ [layoutKey]: layoutValue }}
      .schema=${[
      {
        name: layoutKey,
        label: '组排列方式',
        selector: {
          select: {
            options: [
              { value: 'inline', label: '内联' },
              { value: 'rows', label: '行（垂直堆叠）' }
            ],
            mode: 'dropdown'
          }
        }
      }
    ]}
      .computeLabel=${editor._computeLabelCallback}
      @value-changed=${(ev) => {
      const val = ev.detail?.value?.[layoutKey];
      if (!editor._config.sub_button) {
        try {
          editor._config.sub_button = {};
        } catch (_) {
          editor._config = { ...editor._config, sub_button: {} };
        }
      }
      // Clone sub_button object to ensure it is extensible
      try {
        editor._config.sub_button[layoutKey] = val;
      } catch (_) {
        // If sub_button is frozen, clone it
        try {
          editor._config.sub_button = { ...editor._config.sub_button, [layoutKey]: val };
        } catch (__) {
          // If config itself is frozen, clone the entire config
          editor._config = { ...editor._config, sub_button: { ...editor._config.sub_button, [layoutKey]: val } };
        }
      }
      subButtonsValueChanged(editor);
      editor.requestUpdate();
    }}
    ></ha-form>
  `;
}

function makeInfoSection() {
  return html`
    <div class="bubble-info">
      <h4 class="bubble-section-title">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        子按钮
      </h4>
      <div class="content">
        <p>此编辑器允许您向卡片添加自定义子按钮。子按钮支持三种类型：</p>
        <ul class="icon-list">
          <li><ha-icon icon="mdi:gesture-tap"></ha-icon><p><b>默认（按钮）</b> - 带点击动作的标准按钮</p></li>
          <li><ha-icon icon="mdi:tune-variant"></ha-icon><p><b>滑块</b> - 控制或显示数值（亮度、音量、温度等）</p></li>
          <li><ha-icon icon="mdi:form-dropdown"></ha-icon><p><b>下拉/选择</b> - 用于可选择实体的下拉菜单</p></li>
        </ul>
        <p>使用<b>滑块</b>子按钮来控制灯光亮度、媒体播放器音量或空调温度。使用<b>下拉</b>子按钮来选择媒体源、HVAC 模式或灯光效果。使用<b>默认</b>按钮进行简单的开/关控制或自定义动作。</p>
        <p>您可以单独组织子按钮或将它们分组。组可以内联排列（并排）或垂直堆叠（行），组内的按钮可以内联显示或列布局。</p>
      </div>
    </div>
  `;
}

export function makeSectionedSubButtonsPanel(editor) {
  // Migrate old config format to new schema format if needed
  // This ensures that editor._config.sub_button is always in the new format
  // before any update functions try to access .main or .bottom properties
  if (Array.isArray(editor._config.sub_button)) {
    const converted = convertOldToNewSubButtons(editor._config.sub_button);
    try {
      editor._config.sub_button = converted;
    } catch (_) {
      // If config is frozen/non-extensible, replace it with a cloned one
      editor._config = { ...editor._config, sub_button: converted };
    }
  } else if (!editor._config.sub_button || !isNewSubButtonsSchema(editor._config.sub_button)) {
    // Ensure sub_button exists and is in the new format
    const sectionedView = ensureNewSubButtonsSchemaObject(editor._config);
    try {
      editor._config.sub_button = sectionedView;
    } catch (_) {
      editor._config = { ...editor._config, sub_button: sectionedView };
    }
  }

  // Ensure we operate on the new schema
  const sectionedView = ensureNewSubButtonsSchemaObject(editor._config);

  if (typeof editor._expandedPanelStates === 'undefined') {
    editor._expandedPanelStates = {};
  }
  if (typeof editor._clipboardButton === 'undefined' || editor._clipboardButton === null) {
    editor._clipboardButton = loadSubButtonClipboard() || null;
  }

  const isSubButtonsCard = editor._config.card_type === 'sub-buttons';
  const isPopUpCard = editor._config.card_type === 'pop-up';
  const cardTypesWithMainButtons = ['cover', 'media-player', 'climate'];
  const hasMainButtons = cardTypesWithMainButtons.includes(editor._config.card_type);
  const mainButtonsPosition = editor._config.main_buttons_position || 'default';
  const mainButtonsAlignment = editor._config.main_buttons_alignment || 'end';
  const isMainButtonsBottom = mainButtonsPosition === 'bottom';
  const mainButtonsFullWidth = editor._config.main_buttons_full_width ?? (isMainButtonsBottom ? true : false);
  const isSectionView = Boolean(window.isSectionView);
  const isLargeConfigured = (editor._config.card_layout || '').includes('large');
  const hasCardLayoutExplicitlyDefined = Object.prototype.hasOwnProperty.call(editor._config, 'card_layout');
  const isNormalLayoutExplicitlySet = hasCardLayoutExplicitlyDefined && editor._config.card_layout === 'normal';
  const hasBottomConfigured = Array.isArray(sectionedView.bottom) && sectionedView.bottom.some(item => !!item);
  const hasRowsDefined = editor._config.rows !== undefined && editor._config.rows !== null && editor._config.rows !== '';
  const hasGridRowsDefined = editor._config.grid_options?.rows !== undefined && editor._config.grid_options?.rows !== null && editor._config.grid_options?.rows !== '';
  // Show warning only if rows are manually set (not auto-calculated)
  // grid_options.rows always blocks auto-calculation, so always show warning
  // rows blocks auto-calculation only if _rowsAutoMode is false (user-managed)
  const isRowsManuallySet = hasRowsDefined && editor._rowsAutoMode === false;
  const shouldShowRowsWarning = hasGridRowsDefined || isRowsManuallySet;

  return html`
    <ha-expansion-panel outlined>
      <h4 slot="header">
        <ha-icon icon="mdi:shape-square-rounded-plus"></ha-icon>
        子按钮编辑器
      </h4>
      <div class="content">
        ${shouldShowRowsWarning ? html`
          <div class="bubble-info warning">
            <h4 class="bubble-section-title">
              <ha-icon icon="mdi:alert-outline"></ha-icon>
              检测到行数配置
            </h4>
            <div class="content">
              <p>卡片高度（行数）已在您的配置中显式设置。这将阻止添加子按钮时自动调整行数（例如，添加底部子按钮时）。点击下方按钮移除覆盖并让 Bubble Card 自动计算行数。</p>
              <button class="icon-button" @click="${editor._removeRowsOverrideAndRecalculate}">
                <ha-icon icon="mdi:autorenew"></ha-icon>
                移除覆盖并自动计算
              </button>
            </div>
          </div>
        ` : ''}
        ${hasMainButtons ? html`
          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:circle-outline"></ha-icon>
              卡片特定按钮
            </h4>
            <div class="content">
              <ha-form
                  .hass=${editor.hass}
                  .data=${{ main_buttons_position: mainButtonsPosition }}
                  .schema=${[{
        name: 'main_buttons_position',
        selector: {
          select: {
            options: [
              { label: '默认', value: 'default' },
              { label: '底部（固定）', value: 'bottom' }
            ],
            mode: 'dropdown'
          }
        }
      }]}
                  .computeLabel=${() => '主按钮位置'}
                  @value-changed=${(ev) => {
        editor._valueChanged({
          target: { configValue: 'main_buttons_position' },
          detail: { value: ev.detail.value.main_buttons_position }
        });
      }}
              ></ha-form>
              ${editor._renderConditionalContent(isMainButtonsBottom, html`
                  <ha-formfield .label="全宽动作按钮">
                      <ha-switch
                          aria-label="全宽动作按钮"
                          .checked="${mainButtonsFullWidth}"
                          .configValue="${"main_buttons_full_width"}"
                          @change="${editor._valueChanged}"
                      ></ha-switch>
                      <div class="mdc-form-field">
                          <label class="mdc-label">全宽动作按钮</label> 
                      </div>
                  </ha-formfield>
                  ${editor._renderConditionalContent(!mainButtonsFullWidth, html`
                      <ha-form
                          .hass=${editor.hass}
                          .data=${{ main_buttons_alignment: mainButtonsAlignment }}
                          .schema=${[{
          name: 'main_buttons_alignment',
          selector: {
            select: {
              options: [
                { label: '右侧（默认）', value: 'end' },
                { label: '居中', value: 'center' },
                { label: '左侧', value: 'start' },
                { label: '两端对齐', value: 'space-between' }
              ],
              mode: 'dropdown'
            }
          }
        }]}
                          .computeLabel=${() => '主按钮对齐'}
                          @value-changed=${(ev) => {
          editor._valueChanged({
            target: { configValue: 'main_buttons_alignment' },
            detail: { value: ev.detail.value.main_buttons_alignment }
          });
        }}
                      ></ha-form>
                  `)}
              `)}
            </div>
          </ha-expansion-panel>
        ` : ''}
        
        ${isPopUpCard ? html`
          ${makeLayoutForm(editor, 'main')}
          ${makeSectionList(editor, 'main')}
        ` : !isSubButtonsCard ? html`
          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:arrow-up-circle-outline"></ha-icon>
              主子按钮（顶部）
            </h4>
            <div class="content">
              ${makeLayoutForm(editor, 'main')}
              ${makeSectionList(editor, 'main')}
            </div>
          </ha-expansion-panel>
        ` : ''}

        ${isSubButtonsCard ? html`
          ${makeLayoutForm(editor, 'bottom')}
          ${makeSectionList(editor, 'bottom')}
        ` : !isPopUpCard ? html`
          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:arrow-down-circle-outline"></ha-icon>
              底部子按钮
            </h4>
            <div class="content">
              ${makeLayoutForm(editor, 'bottom')}
              ${editor._renderConditionalContent(!isLargeConfigured && !hasBottomConfigured && (isNormalLayoutExplicitlySet || (!isSectionView && !hasCardLayoutExplicitlyDefined)), html`
                <div class="bubble-info warning">
                  <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:alert-outline"></ha-icon>
                    底部子按钮和布局
                  </h4>
                  <div class="content">
                    <p>添加底部子按钮将自动将此卡片切换到"大卡片"布局（这是新的推荐布局）。添加底部子按钮后，此通知将消失。</p>
                  </div>
                </div>
              `)}
              ${makeSectionList(editor, 'bottom')}
            </div>
          </ha-expansion-panel>
        ` : ''}

        ${makeInfoSection()}
      </div>
    </ha-expansion-panel>
  `;
}



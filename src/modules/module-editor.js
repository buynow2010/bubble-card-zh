import { html } from 'lit';
import { fireEvent } from '../tools/utils.js';
import { yamlKeysMap, moduleSourceMap } from './registry.js';
import { extractModuleMetadata } from './parser.js';
import jsyaml from 'js-yaml';
import {
  generateYamlExport,
  generateGitHubExport,
  copyToClipboard,
  downloadModuleAsYaml
} from './export.js';
import { ensureBCTProviderAvailable, writeModuleYaml, deleteModuleFile } from './bct-provider.js';
import { _isModuleInstalledViaYaml } from './store.js';
import { scrollToModuleForm } from './utils.js';

// Helper functions
function updateModuleInConfig(context, moduleId, oldId = null) {
  if (!context._config || !context._config.modules) return;

  // Remove old ID if needed
  if (oldId && oldId !== moduleId) {
    context._config.modules = context._config.modules.filter(id => id !== oldId);
  }

  // Add new ID if not already present
  if (!context._config.modules.includes(moduleId)) {
    context._config.modules.push(moduleId);
  }

  // Save current ID for tracking
  context._previousModuleId = moduleId;

  // Ensure the config is properly updated in the editor
  fireEvent(context, "config-changed", { config: context._config });
}

function refreshStyles(context) {
  // Reset style cache
  context.lastEvaluatedStyles = "";
  context.stylesYAML = null;

  if (context.handleCustomStyles && context.card) {
    context.handleCustomStyles(context, context.card);
  }

  context.requestUpdate();
}

function broadcastModuleUpdate(moduleId, moduleData) {
  window.dispatchEvent(new CustomEvent('bubble-card-module-updated', {
    detail: { moduleId, moduleData }
  }));
}

function setHAEditorButtonsDisabled(disabled) {
  try {
    // Path to the HA editor save button
    const saveButton = document.querySelector("body > home-assistant")
      ?.shadowRoot?.querySelector("hui-dialog-edit-card")
      ?.shadowRoot?.querySelector("ha-dialog > div:nth-child(4)");

    if (saveButton) {
      saveButton.style.display = disabled ? 'none' : '';
    }
  } catch (error) {
    //console.error("Error accessing HA editor save button:", error);
  }
}

// Renders the module editor form
export function renderModuleEditorForm(context) {
  if (!context._editingModule) {
    // Ensure the button is enabled if the editor is not shown
    setHAEditorButtonsDisabled(false);
    return html``;
  }

  // Disable HA save button when module editor is active
  setHAEditorButtonsDisabled(true);

  // Check if module is from YAML file
  const isFromYamlFile = _isModuleInstalledViaYaml ? _isModuleInstalledViaYaml(context._editingModule.id) : false;

  // Determine if there are blocking errors (YAML schema parsing or template errors)
  const hasYamlError = !!context._yamlErrorMessage;
  const hasTemplateError = typeof context.errorMessage === 'string' && context.errorMessage.trim().length > 0 && !!context._editingModule;
  const hasBlockingErrors = hasYamlError || hasTemplateError;

  // Apply styles in real-time
  const applyLiveStyles = (newCssCode) => {
    if (!context._editingModule || !context._config || isFromYamlFile) return;

    const moduleId = context._editingModule.id;

    // Call the main editor's method to clear errors for this module
    if (typeof context._clearCurrentModuleError === 'function') {
      context._clearCurrentModuleError(moduleId);
    }

    // Save original module state if not already saved
    if (!context._originalModuleState) {
      const originalModule = yamlKeysMap.get(moduleId);
      if (originalModule) {
        context._originalModuleState = JSON.parse(JSON.stringify(originalModule));
      }
    }

    context._editingModule.code = newCssCode;

    // Debounce heavy updates to avoid thrashing while typing
    try { if (context._moduleCodeDebounce) { clearTimeout(context._moduleCodeDebounce); } } catch (_) { }
    context._moduleCodeDebounce = setTimeout(() => {
      // Reset style cache just-in-time
      if (context.stylesYAML) {
        context.stylesYAML = null;
      }

      // Update yamlKeysMap with the latest code
      const debouncedUpdatedModule = {
        ...yamlKeysMap.get(moduleId) || {},
        code: context._editingModule.code,
        id: moduleId
      };
      yamlKeysMap.set(moduleId, debouncedUpdatedModule);

      // Ensure module is enabled in configuration
      updateModuleInConfig(context, moduleId, context._previousModuleId);

      // Broadcast only once per keystroke burst
      broadcastModuleUpdate(moduleId, debouncedUpdatedModule);
    }, 140);
  };

  // Apply editor schema changes in real-time
  const applyLiveEditorSchema = (newEditorSchema) => {
    if (!context._editingModule || !context._config || isFromYamlFile) return;

    try {
      const moduleId = context._editingModule.id;

      // Save original state if not already saved
      if (!context._originalModuleState) {
        const originalModule = yamlKeysMap.get(moduleId);
        if (originalModule) {
          context._originalModuleState = JSON.parse(JSON.stringify(originalModule));
        }
      }

      // Update schema but don't overwrite the raw value
      const previousRaw = context._editingModule.editor_raw;
      context._editingModule.editor = newEditorSchema;
      if (previousRaw) {
        context._editingModule.editor_raw = previousRaw;
      }

      const originalModule = yamlKeysMap.get(moduleId);

      if (originalModule) {
        // Update module with new schema
        const updatedModule = {
          ...originalModule,
          editor: newEditorSchema
        };

        yamlKeysMap.set(moduleId, updatedModule);

        // Clear schema caches
        if (context._schemaCache) {
          delete context._schemaCache[moduleId];
        }

        if (context._processedSchemas) {
          delete context._processedSchemas[moduleId];
        }

        // Update UI
        context.requestUpdate();

        // Ensure everything is updated
        setTimeout(() => {
          fireEvent(context, "editor-refresh", {});
          context.requestUpdate();
        }, 50);
      }
    } catch (error) {
      console.warn("Error applying live editor schema:", error);
    }
  };

  // Update export preview content
  const updateExportPreview = (content) => {
    const previewContent = context.shadowRoot?.querySelector('#export-preview-content');
    if (previewContent) {
      previewContent.textContent = content;

      // Expand the preview panel if not already expanded
      const previewPanel = context.shadowRoot?.querySelector('.export-preview ha-expansion-panel');
      if (previewPanel && !previewPanel.expanded) {
        previewPanel.expanded = true;
      }

      // Animate the preview
      const previewContainer = context.shadowRoot?.querySelector('.export-preview');
      if (previewContainer) {
        previewContainer.style.animation = 'none';
        setTimeout(() => {
          previewContainer.style.animation = 'highlight 1s ease';
        }, 10);
      }
    }
  };

  return html`
    <div class="module-editor-form">
        <div class="form-content">
          <h3>
            <ha-icon style="margin: 8px;" icon="${context._showNewModuleForm ? 'mdi:puzzle-plus-outline' : 'mdi:puzzle-edit-outline'}"></ha-icon>
            ${context._showNewModuleForm ? '新建模块' : context._editingModule.id === 'default' ? '编辑默认模块' : '编辑模块'}
          </h3>
          
          <div class="module-editor-not-default" style="display: ${context._editingModule.id === 'default' ? 'none' : ''}">
            ${isFromYamlFile ? html`
              <div class="bubble-info warning">
                <h4 class="bubble-section-title">
                  <ha-icon icon="mdi:file-document-alert"></ha-icon>
                  只读模块
                </h4>
                <div class="content">
                  <p>此模块是从 YAML 文件安装的。您需要直接修改 <code>bubble-modules.yaml</code> 文件，或将其从您的 YAML 文件中删除，然后在此处导入。</p>
                </div>
              </div>
            ` : ''}
            
            <ha-textfield
              label="模块 ID"
              .value=${context._editingModule.id || ''}
              @input=${(e) => {
      // Store old ID before changing
      const oldId = context._editingModule.id;

      // Update module ID
      context._editingModule.id = e.target.value;

      // Update config modules list if creating new module
      if (context._showNewModuleForm && context._config.modules) {
        updateModuleInConfig(context, e.target.value, oldId);
        fireEvent(context, "config-changed", { config: context._config });
      }
    }}
              ?disabled=${!context._showNewModuleForm || isFromYamlFile}
            ></ha-textfield>
            <span class="helper-text">
              必须唯一，模块创建后无法更改。
            </span>
            
            <ha-textfield
              label="模块名称"
              .value=${context._editingModule.name || ''}
              @input=${(e) => { context._editingModule.name = e.target.value; }}
              ?disabled=${isFromYamlFile}
            ></ha-textfield>
            
            <ha-textfield
              label="版本"
              .value=${context._editingModule.version || '1.0'}
              @input=${(e) => { context._editingModule.version = e.target.value; }}
              ?disabled=${isFromYamlFile}
            ></ha-textfield>
            
            <ha-textfield
              label="作者"
              .value=${context._editingModule.creator || ''}
              @input=${(e) => { context._editingModule.creator = e.target.value; }}
              ?disabled=${isFromYamlFile}
            ></ha-textfield>
            
            <ha-expansion-panel 
              .header=${html`
                <ha-icon icon="mdi:filter-check-outline" style="margin-right: 8px;"></ha-icon>
                支持的卡片
              `}
              @expanded-changed=${(e) => e.stopPropagation()}
            >
              <div>
                ${renderSupportedCardCheckboxes(context, isFromYamlFile)}
              </div>
            </ha-expansion-panel>

            <ha-expansion-panel 
              .header=${html`
                <ha-icon icon="mdi:file-document-outline" style="margin-right: 8px;"></ha-icon>
                描述
              `}
              @expanded-changed=${(e) => e.stopPropagation()}
            >
              <div class="code-editor-container">
                <ha-code-editor
                  class="${isFromYamlFile ? 'disabled' : ''}"
                  mode="yaml"
                  .value=${context._editingModule.description || ''}
                  @value-changed=${(e) => { context._editingModule.description = e.detail.value; }}
                ></ha-code-editor>
              </div>
              <span class="helper-text">
                此描述显示在您的模块和模块商店中（如果您分享它），请确保清晰简洁。<b>您可以使用 HTML 和内联 CSS</b>，但请注意，它仅在您的模块中渲染，模块商店不会显示它。            
              </span>
            </ha-expansion-panel>
          </div>

          <ha-expansion-panel 
            .header=${html`
              <ha-icon icon="mdi:code-json" style="margin-right: 8px;"></ha-icon>
              代码 (CSS/JS 模板)
            `}
            @expanded-changed=${(e) => e.stopPropagation()}
          >
            <div class="code-editor-container">
              <ha-code-editor
                class="${isFromYamlFile ? 'disabled' : ''}"
                mode="yaml"
                .value=${context._editingModule.code || ''}
                @value-changed=${(e) => applyLiveStyles(e.detail.value)}
              ></ha-code-editor>
            </div>
            ${context.createErrorConsole(context)}
            <span class="helper-text">
              关于 CSS 和 JS 模板功能的更多信息和示例可以在<a href="https://github.com/Clooos/Bubble-Card?tab=readme-ov-file#styling" target="_blank">样式和模板文档</a>中找到。提示：您可以通过点击面板标题 (Bubble Card 配置) 来放大编辑器。
            </span>
          </ha-expansion-panel>
          
          <ha-expansion-panel 
            style="display: ${context._editingModule.id === 'default' ? 'none' : ''}" 
            .header=${html`
              <ha-icon icon="mdi:form-select" style="margin-right: 8px;"></ha-icon>
              可选：编辑器架构 (YAML)
            `}
            @expanded-changed=${(e) => e.stopPropagation()}
          >
            <div class="editor-schema-container">
              <ha-code-editor
                class="${isFromYamlFile ? 'disabled' : ''}"
                mode="yaml"
                .value=${context._editingModule.editor_raw ||
    (typeof context._editingModule.editor === 'object'
      ? jsyaml.dump(context._editingModule.editor)
      : context._editingModule.editor || '')}
                @value-changed=${(e) => {
      // Save the raw value to prevent cursor loss
      context._editingModule.editor_raw = e.detail.value;

      // Use a debounce to prevent parsing incomplete YAML
      clearTimeout(context._editorSchemaDebounce);
      context._editorSchemaDebounce = setTimeout(() => {
        try {
          const newSchema = jsyaml.load(e.detail.value);
          // Only apply if it's a valid object and not null
          if (newSchema !== null && typeof newSchema === 'object') {
            applyLiveEditorSchema(newSchema);
            // Clear any previous YAML error
            if (context._yamlErrorMessage) {
              context._yamlErrorMessage = null;
              context.requestUpdate();
            }
          }
        } catch (error) {
          console.warn("Invalid YAML for editor schema:", error);
          // Keep the raw value
          context._editingModule.editor = context._editingModule.editor_raw || e.detail.value;
          // Set the error message
          context._yamlErrorMessage = error.message;
          context.requestUpdate();
        }
      }, 100); // Wait 100ms after the last modification
    }}
              ></ha-code-editor>
            </div>
            <div class="bubble-info error" 
                style="display: ${!context._yamlErrorMessage ? 'none' : ''}">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                    YAML 架构错误
                </h4>
                <div class="content">
                    <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">${context._yamlErrorMessage ? context._yamlErrorMessage.charAt(0).toUpperCase() + context._yamlErrorMessage.slice(1) : ''}</pre>
                </div>
            </div>
            <span class="helper-text">
              这允许您为模块添加可视化编辑器。了解所有可用的编辑器架构选项请查看<a href="https://github.com/Clooos/Bubble-Card/blob/main/src/modules/editor-schema-docs.md" target="_blank">编辑器架构文档</a>。
            </span>

            ${context._editingModule.editor && Array.isArray(context._editingModule.editor) && context._editingModule.editor.length > 0 ? html`
              <div class="form-preview">
                <h4>编辑器预览</h4>
                <div class="form-preview-container">
                  <ha-form
                    .hass=${context.hass}
                    .data=${{}}
                    .schema=${context._editingModule.editor}
                    .computeLabel=${context._computeLabelCallback || (schema => schema.label || schema.name)}
                  ></ha-form>
                </div>
              </div>
            ` : ''}
          </ha-expansion-panel>

          ${(!isFromYamlFile && hasBlockingErrors) ? html`
            <div class="bubble-info warning" style="margin-top: 8px;">
              <h4 class="bubble-section-title">
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                保存已禁用
              </h4>
              <div class="content">
                <p style="margin: 0;">
                  ${hasYamlError ? html`修复上方编辑器架构 (YAML) 中的错误以启用保存。` : ''}
                  ${hasYamlError && hasTemplateError ? html`<br>` : ''}
                  ${hasTemplateError ? html`修复上方 CSS/JS 模板中的错误以启用保存。` : ''}
                </p>
              </div>
            </div>
          ` : ''}

          <hr>

          <ha-expansion-panel 
            .header=${html`
              <ha-icon icon="mdi:export" style="margin-right: 8px;"></ha-icon>
              导出模块
            `}
            @expanded-changed=${(e) => e.stopPropagation()}
          >
            <div class="content">
                <div class="export-section">
                    <div class="export-buttons">
                        <button class="icon-button" @click=${() => {
      const yamlExport = generateYamlExport(context._editingModule);
      copyToClipboard(context, yamlExport, "YAML 格式已复制到剪贴板！", updateExportPreview);
    }}>
                        <ha-icon icon="mdi:content-copy"></ha-icon>
                        复制 YAML
                        </button>
                        
                        <button class="icon-button" @click=${() => {
      const githubExport = generateGitHubExport(context._editingModule);
      copyToClipboard(context, githubExport, "GitHub 讨论格式已复制到剪贴板！", updateExportPreview);
    }}>
                        <ha-icon icon="mdi:content-copy"></ha-icon>
                        复制到 GitHub
                        </button>
                        
                        <button class="icon-button" @click=${() => {
      downloadModuleAsYaml(context, context._editingModule, updateExportPreview);
    }}>
                        <ha-icon icon="mdi:file-download"></ha-icon>
                        下载 YAML
                        </button>
                    </div>
                    
                    <div class="export-preview">
                        <ha-expansion-panel 
                          .header=${"导出预览"}
                          @expanded-changed=${(e) => e.stopPropagation()}
                        >
                        <pre id="export-preview-content">点击上方按钮生成预览</pre>
                        </ha-expansion-panel>
                    </div>

                    <div class="bubble-info">
                      <h4 class="bubble-section-title">
                        <ha-icon icon="mdi:information-outline"></ha-icon>
                        分享您的模块到商店
                      </h4>
                      <div class="content">
                        <p>要将您的模块分享到模块商店，请点击<strong>复制到 GitHub</strong>，然后将内容粘贴到
                        <a href="https://github.com/Clooos/Bubble-Card/discussions/categories/share-your-modules" target="_blank">分享您的模块</a>类别的新讨论中。
                        <strong>编辑描述</strong>（如需要）、<strong>示例</strong>（供 YAML 用户使用），并记得为模块商店<strong>至少包含一张截图</strong>。</p>
                        <p><strong>您的模块会立即可用</strong>（刷新商店后），所以请仔细检查内容是否正确且模块运行正常。您当然可以在分享后编辑/更新模块。</p>
                      </div>
                    </div>
                </div>
            </div>
          </ha-expansion-panel>
          
          <div class="module-editor-buttons-container">
            <button class="icon-button" style="flex: 1;" @click=${() => {
      try {
        // Restore original module if canceling edit
        if (!context._showNewModuleForm && context._editingModule) {
          const moduleId = context._editingModule.id;
          // Clear any lingering module errors on cancel
          if (typeof context._clearCurrentModuleError === 'function') {
            context._clearCurrentModuleError(moduleId);
          }
          resetModuleChanges(context, moduleId);
        } else if (context._showNewModuleForm && context._editingModule) {
          // For new module creation cancellation
          const moduleId = context._editingModule.id;

          // Remove temporary module from configuration
          if (context._config && context._config.modules && moduleId) {
            context._config.modules = context._config.modules.filter(id => id !== moduleId);
            fireEvent(context, "config-changed", { config: context._config });

            // Remove from yamlKeysMap if present
            if (yamlKeysMap.has(moduleId)) {
              yamlKeysMap.delete(moduleId);
            }

            refreshStyles(context);
          }
        }
      } finally {
        // Reset editor state
        context._editingModule = null;
        context._showNewModuleForm = false;
        context._previousModuleId = null;
        // Re-enable HA save button on cancel
        setHAEditorButtonsDisabled(false);
        context.requestUpdate();
        setTimeout(() => scrollToModuleForm(context), 0);
      }
    }}>
              <ha-icon icon="mdi:close"></ha-icon>
              取消
            </button>
            
            <button class="icon-button ${isFromYamlFile || hasBlockingErrors ? 'disabled' : ''}" ?disabled=${isFromYamlFile || hasBlockingErrors} style="flex: 1;" @click=${() => {
      if (isFromYamlFile || hasBlockingErrors) { return; }
      // Clear any lingering module errors prior to saving
      if (typeof context._clearCurrentModuleError === 'function' && context._editingModule?.id) {
        context._clearCurrentModuleError(context._editingModule.id);
      }
      saveModule(context, context._editingModule);
      setTimeout(() => scrollToModuleForm(context), 0);
    }}>
              <ha-icon icon="mdi:content-save"></ha-icon>
              保存模块
            </button>
          </div>
        </div>
    </div>
  `;
}

// 获取可用卡片类型（导出供其他模块使用）
export function getAvailableCardTypes() {
  return [
    { id: 'button', name: '按钮' },
    { id: 'calendar', name: '日历' },
    { id: 'climate', name: '空调' },
    { id: 'cover', name: '窗帘' },
    { id: 'horizontal-buttons-stack', name: '水平按钮栏' },
    { id: 'media-player', name: '媒体播放器' },
    { id: 'pop-up', name: '弹出窗口' },
    { id: 'select', name: '选择' },
    { id: 'separator', name: '分隔符' },
    { id: 'sub-buttons', name: '子按钮' }
  ];
}

// Function to render checkboxes for supported cards
function renderSupportedCardCheckboxes(context, isFromYamlFile = false) {
  const availableCardTypes = getAvailableCardTypes();
  const allCardIds = availableCardTypes.map(card => card.id);

  // Initialize supported array if not exists
  if (context._editingModule.supported === undefined) {
    // If module has legacy unsupported property, convert it to supported
    if (context._editingModule.unsupported && context._editingModule.unsupported.length > 0) {
      // All cards except those in unsupported are supported
      context._editingModule.supported = allCardIds
        .filter(id => !context._editingModule.unsupported.includes(id));
    } else {
      // Default: all cards are supported if no 'unsupported' array exists
      // Don't create supported property - it means all cards are supported
      // Set to undefined so it won't be included in exports
      context._editingModule.supported = undefined;
    }
  }

  // Check if all cards are selected (supported is undefined/null or contains all cards)
  const allCardsSelected = !context._editingModule.supported ||
    (Array.isArray(context._editingModule.supported) &&
      context._editingModule.supported.length === allCardIds.length &&
      allCardIds.every(id => context._editingModule.supported.includes(id)));

  return html`
    <div class="checkbox-grid">
      <ha-formfield label="所有卡片" style="grid-column: 1 / -1; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--divider-color);">
        <ha-checkbox
          .checked=${allCardsSelected}
          @change=${(e) => {
      if (isFromYamlFile) return;
      if (e.target.checked) {
        // Remove supported to indicate all cards are supported
        delete context._editingModule.supported;
      } else {
        // Deselect all cards
        context._editingModule.supported = [];
      }
      context.requestUpdate();
    }}
          ?disabled=${isFromYamlFile}
        ></ha-checkbox>
      </ha-formfield>
      ${availableCardTypes.map(card => html`
        <ha-formfield label="${card.name}">
          <ha-checkbox
            .checked=${!context._editingModule.supported || context._editingModule.supported.includes(card.id)}
            @change=${(e) => {
        if (isFromYamlFile) return;
        // Ensure supported array exists when modifying individual cards
        if (!context._editingModule.supported) {
          context._editingModule.supported = allCardIds.slice();
        }
        if (e.target.checked) {
          if (!context._editingModule.supported.includes(card.id)) {
            context._editingModule.supported.push(card.id);
          }
          // If all cards are now selected, remove supported to indicate all cards
          if (context._editingModule.supported.length === allCardIds.length &&
            allCardIds.every(id => context._editingModule.supported.includes(id))) {
            delete context._editingModule.supported;
          }
        } else {
          context._editingModule.supported = context._editingModule.supported.filter(
            type => type !== card.id
          );
        }
        context.requestUpdate();
      }}
            ?disabled=${isFromYamlFile}
          ></ha-checkbox>
        </ha-formfield>
      `)}
    </div>
    <div class="helper-text">
      选择此模块支持的卡片类型。
    </div>
  `;
}

// Save a module (create new or update existing)
export async function saveModule(context, moduleData) {
  try {
    const moduleId = moduleData.id;
    const wasModuleEnabled = context._config.modules && context._config.modules.includes(moduleId);

    // Preserve is_global from existing module before saving
    const existingModule = yamlKeysMap.get(moduleId);
    const wasGlobal = existingModule && existingModule.is_global === true;

    // Ensure we use the parsed version for saving
    if (moduleData.editor_raw && typeof moduleData.editor_raw === 'string') {
      try {
        const parsed = jsyaml.load(moduleData.editor_raw);
        if (parsed !== null && typeof parsed === 'object') {
          moduleData.editor = parsed;
        }
      } catch (e) {
        console.warn("Couldn't parse editor schema during save, using fallback:", e);
      }
    }

    // Remove the raw version before saving
    if (moduleData.editor_raw) {
      delete moduleData.editor_raw;
    }

    // Remove unsupported if supported is present (for backward compatibility)
    if (moduleData.supported && moduleData.unsupported) {
      delete moduleData.unsupported;
    }

    // Remove supported if it contains all cards (for compatibility with older versions)
    const availableCardTypes = getAvailableCardTypes();
    const allCardIds = availableCardTypes.map(card => card.id);
    if (moduleData.supported && Array.isArray(moduleData.supported) &&
      moduleData.supported.length === allCardIds.length &&
      allCardIds.every(id => moduleData.supported.includes(id))) {
      delete moduleData.supported;
    }

    // Build a clean YAML string for persistence using only supported fields
    const { generateYamlExport } = await import('./export.js');
    const yamlContent = generateYamlExport(moduleData);

    // Extract metadata and update in yamlKeysMap
    const metadata = extractModuleMetadata(yamlContent, moduleData.id, {
      title: moduleData.name,
      defaultCreator: moduleData.creator
    });

    // Preserve is_global property if it was set before saving
    if (wasGlobal) {
      metadata.is_global = true;
    }

    // Signal modules have been updated
    document.dispatchEvent(new CustomEvent('yaml-modules-updated'));

    // Update yamlKeysMap while preserving order
    const oldKeys = Array.from(yamlKeysMap.keys());
    const newMap = new Map();

    oldKeys.forEach(key => {
      if (key === moduleData.id) {
        newMap.set(moduleData.id, metadata);
      } else {
        newMap.set(key, yamlKeysMap.get(key));
      }
    });

    // If it's a new module, add it to the map
    if (!oldKeys.includes(moduleData.id)) {
      newMap.set(moduleData.id, metadata);
    }

    // Replace the old map with the new one
    yamlKeysMap.clear();
    newMap.forEach((value, key) => {
      yamlKeysMap.set(key, value);
    });

    // Mark this module as coming from the persistent entity (not YAML file)
    // Will be overridden below depending on storage provider

    // Ensure the module is added to the card's configuration
    if (context._config && context._config.modules) {
      if (!context._config.modules.includes(moduleId)) {
        context._config.modules.push(moduleId);
      }
      // Notify the editor of config changes
      fireEvent(context, "config-changed", { config: context._config });
    }

    // Persist using Bubble Card Tools files if available; otherwise keep changes local only (no entity writes)
    let savedViaFiles = false;
    try {
      const bctAvailable = await ensureBCTProviderAvailable(context.hass);
      if (bctAvailable) {
        // Persist to modules/<id>.yaml using the provider with the YAML string
        await writeModuleYaml(context.hass, moduleId, yamlContent);
        try { moduleSourceMap.set(moduleId, 'file'); } catch (e) { }
        // Notify the system to reload modules from files
        document.dispatchEvent(new CustomEvent('yaml-modules-updated'));
        savedViaFiles = true;
      }
    } catch (e) {
      // Keep local-only if file save fails
      console.warn('File-based save failed; keeping changes local only:', e);
    }
    // No writes to the legacy entity; if files are unavailable, changes remain local-only
    if (!savedViaFiles) {
      try { moduleSourceMap.set(moduleId, 'editor'); } catch (e) { }
    }

    // Broadcast change to all cards
    broadcastModuleUpdate(moduleId, metadata);

    // Reset style cache
    context.stylesYAML = null;

    // Force refresh if module is currently used
    if (wasModuleEnabled) {
      refreshStyles(context);
    }

    // Reset editing state
    context._editingModule = null;
    context._showNewModuleForm = false;

    // Force UI refresh
    forceUIRefresh(context);

    // Re-enable HA save button after successful save
    setHAEditorButtonsDisabled(false);

  } catch (error) {
    console.error("Error saving module:", error);
  } finally {
    // Ensure HA editor buttons are re-enabled even if an error occurs
    setHAEditorButtonsDisabled(false);
  }
}

// No longer writing modules to Home Assistant; persistence is handled by Bubble Card Tools files.

// Function to force a complete UI refresh
function forceUIRefresh(context) {
  // Reset cached structures
  if (context._processedSchemas) {
    context._processedSchemas = {};
  }

  // Reset state variables
  context._selectedModuleTab = 0;

  // Force all cached forms to be rebuilt
  if (typeof context._getProcessedSchema === 'function') {
    if (!context._schemaCache) {
      context._schemaCache = {};
    } else {
      Object.keys(context._schemaCache).forEach(key => {
        delete context._schemaCache[key];
      });
    }
  }

  // Reset style cache
  context.lastEvaluatedStyles = "";

  // Apply styles
  if (context.card && typeof context.handleCustomStyles === 'function') {
    context.handleCustomStyles(context, context.card);
  }

  // Notify parent components
  fireEvent(context, 'editor-refresh', {});

  // Trigger updates
  context.requestUpdate();

  // Secondary update after delay
  setTimeout(() => {
    if (context.card && typeof context.handleCustomStyles === 'function') {
      context.handleCustomStyles(context, context.card);
    }

    context.requestUpdate();

    // If changes still not reflected, try more aggressive approach
    setTimeout(() => {
      if (context._config) {
        const config = { ...context._config };

        // Reset style cache
        if (context.stylesYAML) {
          context.stylesYAML = null;
          document.dispatchEvent(new CustomEvent('yaml-modules-updated'));
        }

        // Trigger config change
        fireEvent(context, "config-changed", { config: config });

        // Apply styles
        if (context.card && typeof context.handleCustomStyles === 'function') {
          context.handleCustomStyles(context, context.card);
        }
      }
      context.requestUpdate();
    }, 100);
  }, 50);
}

// Edit a module
export function editModule(context, moduleId) {
  // Reset original state
  context._originalModuleState = null;

  // Get module data
  const moduleData = yamlKeysMap.get(moduleId);

  if (!moduleData) {
    console.error(`Module ${moduleId} not found`);
    return;
  }

  // Set the editing module
  context._editingModule = {
    id: moduleId,
    ...moduleData
  };

  // Disable HA save button when starting edit
  setHAEditorButtonsDisabled(true);

  // Set default values if missing
  if (!context._editingModule.code) {
    context._editingModule.code = '';
  }

  if (context._editingModule.editor && typeof context._editingModule.editor === 'string') {
    context._editingModule.editorReference = context._editingModule.editor;
    context._editingModule.editor = [];
  }

  // Initialize editor_raw to preserve the raw YAML syntax
  if (typeof context._editingModule.editor === 'object') {
    context._editingModule.editor_raw = jsyaml.dump(context._editingModule.editor);
  } else {
    context._editingModule.editor_raw = context._editingModule.editor || '';
  }

  context.requestUpdate();

  setTimeout(() => scrollToModuleForm(context), 0);
}

// Delete a module
export async function deleteModule(context, moduleId) {
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete module "${moduleId}"?`)) {
    return;
  }

  try {
    // Remove from yamlKeysMap
    yamlKeysMap.delete(moduleId);
    // Remove source mapping
    try { moduleSourceMap.delete(moduleId); } catch (e) { }

    // Force refresh
    document.dispatchEvent(new CustomEvent('yaml-modules-updated'));

    // Prefer deleting from Bubble Card Tools files; no legacy entity writes
    let deletedViaFiles = false;
    try {
      const bctAvailable = await ensureBCTProviderAvailable(context.hass);
      if (bctAvailable) {
        await deleteModuleFile(context.hass, moduleId);
        // Notify reload
        document.dispatchEvent(new CustomEvent('yaml-modules-updated'));
        deletedViaFiles = true;
      }
    } catch (e) {
      console.warn('File-based deletion failed; keeping changes local only:', e);
    }
    // No writes to legacy entity

    // Remove module from current config
    if (context._config && context._config.modules) {
      context._config.modules = context._config.modules.filter(id => id !== moduleId);
      fireEvent(context, "config-changed", { config: context._config });
      refreshStyles(context);
    }

    // Force UI refresh
    forceUIRefresh(context);

    // Re-enable HA save button after successful deletion
    setHAEditorButtonsDisabled(false);

  } catch (error) {
    console.error("Error deleting module:", error);
  } finally {
    // Ensure HA editor buttons are re-enabled even if an error occurs
    setHAEditorButtonsDisabled(false);
  }
}

// No longer updating Home Assistant entity when deleting modules.

// Initialize module editor context
export function initModuleEditor(context) {
  if (!context._editingModuleInitialized) {
    context._editingModule = null;
    context._showNewModuleForm = false;
    context._showManualImportForm = false;
    context._manualYamlContent = '';
    context._exportContent = null;
    context._exportType = null;
    context._exportStep = 0;
    context._schemaCache = {};
    context._processedSchemas = {};
    context._originalModuleState = null;
    context._previousModuleId = null;

    // Function to generate a unique module ID
    context._generateUniqueModuleId = (baseId = 'my_module') => {
      // If the base ID doesn't exist yet, return it as is
      if (!yamlKeysMap.has(baseId)) {
        return baseId;
      }

      // Otherwise, try to add a number suffix until a unique ID is found
      let counter = 1;
      let newId = `${baseId}_${counter}`;

      while (yamlKeysMap.has(newId)) {
        counter++;
        newId = `${baseId}_${counter}`;
      }

      return newId;
    };

    // Use the function to create a unique ID for the template
    const uniqueId = context._generateUniqueModuleId('my_module');

    context._newModuleTemplate = {
      id: uniqueId,
      name: 'My Module',
      description: '',
      creator: '',
      version: '1.0',
      // No supported property = all cards are supported (compatible with older versions)
      code: '',
      editor: '',
    };
    context._editingModuleInitialized = true;
  }
}

// Reset changes and restore original module state
function resetModuleChanges(context, moduleId) {
  if (!moduleId) return;

  // Use original saved state if exists, otherwise use from yamlKeysMap
  let originalModule;
  if (context._originalModuleState) {
    originalModule = context._originalModuleState;
    context._originalModuleState = null;
  } else {
    originalModule = yamlKeysMap.get(moduleId);
  }

  if (!originalModule) return;

  // Reset caches
  context.lastEvaluatedStyles = "";
  context.stylesYAML = null;

  // Replace modified module with original version
  yamlKeysMap.set(moduleId, { ...originalModule });

  // Clear schema caches
  if (context._schemaCache) {
    delete context._schemaCache[moduleId];
  }

  if (context._processedSchemas) {
    delete context._processedSchemas[moduleId];
  }

  // Apply styles and update UI
  if (context.handleCustomStyles) {
    context.handleCustomStyles(context, context.card);
  }

  // Notify other instances
  broadcastModuleUpdate(moduleId, originalModule);

  // Force complete refresh
  setTimeout(() => {
    if (context._config) {
      const tempConfig = { ...context._config };
      fireEvent(context, "config-changed", { config: tempConfig });
    }
    context.requestUpdate();
  }, 50);
} 
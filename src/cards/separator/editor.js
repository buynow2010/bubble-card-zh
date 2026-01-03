import { html } from 'lit';


export function renderSeparatorEditor(editor) {

    return html`
    <div class="card-config">
        ${editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList)}
        <ha-textfield
            label="名称"
            .value="${editor._config?.name || ''}"
            .configValue="${"name"}"
            @input="${editor._valueChanged}"
        ></ha-textfield>
        ${editor.makeDropdown("图标", "icon")}
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
                分隔符卡片
            </h4>
            <div class="content">
                <p>这是一个简单的分隔符卡片，用于将您的弹窗/仪表盘分成不同的类别或部分。例如：灯光、设备、窗帘、设置、自动化等...</p>
            </div>
        </div>
        ${editor.makeVersion()}
  </div>
`;
}
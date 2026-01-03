import { html } from 'lit';

export function renderEmptyColumnEditor(editor) {

    return html`
        <div class="card-config">
            ${editor.makeDropdown("卡片类型", "card_type", editor.cardTypeList)}
            <ha-expansion-panel outlined>
                <h4 slot="header">
                  <ha-icon icon="mdi:palette"></ha-icon>
                  样式和布局选项
                </h4>
                <div class="content">
                    ${editor.makeLayoutPanel()}
                </div>
            </ha-expansion-panel>
            <div class="bubble-info">
                <h4 class="bubble-section-title">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    空列卡片
                </h4>
                <div class="content">
                    <p>这只是一个空卡片，用于填充任何空列。</p>
                </div>
            </div>
            ${editor.makeVersion()}
        </div>
    `;
}
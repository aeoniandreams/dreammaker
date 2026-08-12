// WIKIMAKER_BUILD: 2026-08-12-15 (column width w/ merged rows fix)
const debouncedGenerateHTML = (function() {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(generateHTML, 300);
    };
})();

document.addEventListener('DOMContentLoaded', (event) => {
    initializeColorPicker();
    initializeResizer();
    initializeBodyEditor();
    initializeBasicToolbar();
    generateHTML();

    const dropdown = document.querySelector('.dropdown');
    const dropdownBtn = dropdown.querySelector('.toolbar-button.has-text');
    const dropdownLinks = dropdown.querySelectorAll('.dropdown-content a');

    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
    }

    dropdownLinks.forEach(link => {
        link.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    document.getElementById('input-section').addEventListener('input', debouncedGenerateHTML);

    document.body.addEventListener('focusin', (e) => {
        if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && e.target.id !== 'bodyFontSizeInput') {
            lastFocusedInput = e.target;
            savedRange = null;
        }
    });
});

function addCategoryRow(text = '', link = '') {
    const list = document.getElementById("category-list");
    const row = document.createElement("div");
    row.className = "category-row";
    row.style.cssText = "display:flex; gap:8px; margin-bottom:8px;";
    row.innerHTML = `
      <input class="cat-text" placeholder="장르/등장인물" style="flex:1;" value="${text}" oninput="debouncedGenerateHTML()" />
      <input class="cat-link" placeholder="URL (선택)" style="flex:1;" value="${link}" oninput="debouncedGenerateHTML()" />
      <button type="button" onclick="this.parentElement.remove(); debouncedGenerateHTML();" style="border:none; background:transparent; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
    `;
    list.appendChild(row);
    debouncedGenerateHTML();
}

function initializeColorPicker() {
    const colorPicker = document.getElementById("mainColorPicker");
    const colorDisplay = document.querySelector(".color-display");

    colorDisplay.style.backgroundColor = colorPicker.value;
    updatePreviewColor(colorPicker.value); 

    colorPicker.addEventListener("input", (e) => {
        colorDisplay.style.backgroundColor = e.target.value;
        updatePreviewColor(e.target.value); 
        debouncedGenerateHTML(); 
    });
}

function updatePreviewColor(color) {
    const previewElement = document.getElementById("preview");
    if (previewElement) {
        const wikiWrap = previewElement.querySelector("#wikiwrap");
        if (wikiWrap) {
            wikiWrap.style.setProperty('--wiki-main-color', color, 'important');
        }
        
        const mainTable = previewElement.querySelector('.wiki-main-table');
        if (mainTable) {
            mainTable.style.setProperty('border-color', color, 'important');
        }
        
        const wtNameElements = previewElement.querySelectorAll('.wt-name');
        wtNameElements.forEach(element => {
            element.style.setProperty('background-color', color, 'important');
            element.style.setProperty('border-color', color, 'important');
        });

        const wtColorElements = previewElement.querySelectorAll('.wt-color');
        wtColorElements.forEach(element => {
            element.style.setProperty('background-color', color, 'important');
        });
        
        const quotes = previewElement.querySelectorAll('.wiki-quote td');
        quotes.forEach(element => {
             element.style.borderLeftColor = color;
        });
    }
}

function initializeResizer() {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.getElementById('input-section');
    const rightPanel = document.getElementById('preview-section');

    const handleMouseDown = (e) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const containerRect = resizer.parentElement.getBoundingClientRect();
        const leftBoundary = containerRect.left;
        const rightBoundary = containerRect.right;
        
        let newX = e.clientX;
        if (newX < leftBoundary + 200) newX = leftBoundary + 200;
        if (newX > rightBoundary - 200) newX = rightBoundary - 200;

        const newLeftWidth = newX - leftBoundary;

        leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
        rightPanel.style.flex = '1 1 0';
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    resizer.addEventListener('mousedown', handleMouseDown);
}

function insertFootnote() {
    const labelChoice = confirm("텍스트 레이블 각주로 넣으시겠습니까?\n확인 → 텍스트 레이블 (예: [스포일러])\n취소 → 자동 번호");
    const text = prompt("각주(주석) 내용을 입력하세요:", "");
    if (!text) return;

    let labelText = '';
    if (labelChoice) {
        labelText = prompt("표시할 레이블 텍스트를 입력하세요 (예: 스포일러):", "");
        if (labelText === null) return;
        if (!labelText.trim()) labelText = '';
    }

    const formattedText = labelText.trim()
        ? `{{[${labelText.trim()}]|${text}}}`
        : `{{${text}}}`;

    if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
        document.execCommand('insertText', false, formattedText);
        debouncedGenerateHTML();
        return;
    }

    if (lastFocusedInput) {
        const start = lastFocusedInput.selectionStart;
        const end = lastFocusedInput.selectionEnd;
        const val = lastFocusedInput.value;
        
        lastFocusedInput.value = val.slice(0, start) + formattedText + val.slice(end);
        
        lastFocusedInput.selectionStart = lastFocusedInput.selectionEnd = start + formattedText.length;
        lastFocusedInput.focus();
        debouncedGenerateHTML();
        return;
    }

    alert("각주를 넣을 입력창이나 에디터를 먼저 클릭해주세요.");
}

new Sortable(document.getElementById("field-list"), {
  animation: 150,
  handle: ".drag-handle",
  onEnd: debouncedGenerateHTML
});

function addField() {
  const list = document.getElementById("field-list");
  const row = document.createElement("div");
  row.className = "field-row";
  row.innerHTML = `
    <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
    <input class="field-name" placeholder="항목명" />
    <div class="field-value" contenteditable="true" data-placeholder="내용"></div>
  `;
  list.appendChild(row);
  debouncedGenerateHTML();
}

function getFormattedTime() {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function generateHTML() {
  const color = document.getElementById("mainColorPicker").value;
  const name = document.getElementById("charName").value.trim();
  const jpSurname = document.getElementById("jpSurname").value.trim();
  const jpSurnameFuri = document.getElementById("jpSurnameFurigana").value.trim();
  const jpName = document.getElementById("jpName").value.trim();
  const jpNameFuri = document.getElementById("jpNameFurigana").value.trim();
  const enName = document.getElementById("enName").value.trim();
  const imageUrl = document.getElementById("imageUrl").value.trim();
  const copyright = document.getElementById("copyright").value.trim();

  const showDocTitle = document.getElementById("showDocTitle")?.checked;
  const docTitleInput = document.getElementById("docTitle")?.value.trim();
  const finalTitle = docTitleInput || name;

  let titleTimeHTML = "";
  if (showDocTitle && finalTitle) {
      titleTimeHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 2rem; font-weight: 700; line-height: 1; margin: 0;">${finalTitle}</h1>
        <p style="font-size: .9rem; margin: .5rem 0 0; color: inherit; opacity: 0.7;">최근 수정 시각: <time>${getFormattedTime()}</time></p>
      </div>`;
  }
  let rubyBlock = '';
  if (jpSurname || jpName) {
    rubyBlock += jpSurname ? `<ruby>${jpSurname}<rt>${jpSurnameFuri}</rt></ruby>` : '';
    rubyBlock += jpSurname && jpName ? ' ' : '';
    rubyBlock += jpName ? `<ruby>${jpName}<rt>${jpNameFuri}</rt></ruby>` : '';
  }

  let pipeName = '';
  if ((jpSurname || jpName) && enName) {
    pipeName = ` ｜ ${enName}`;
  } else if (!jpSurname && !jpName && enName) {
    pipeName = `${enName}`;
  }

  const rows = document.querySelectorAll(".field-row");
  let detailRows = '';
  rows.forEach(row => {
    const field = row.querySelector(".field-name").value.trim();
    const valueEl = row.querySelector(".field-value");
    const value = valueEl ? (valueEl.tagName === 'INPUT' ? valueEl.value.trim() : valueEl.innerHTML.trim()) : '';
    if (field && value) {
      detailRows += `<tr><td class="wt-color">${field}</td><td class="wt-detail">${value}</td></tr>\n`;
    }
  });

  const catRows = document.querySelectorAll("#category-list .category-row");
  let categoryItems = [];
  catRows.forEach(row => {
      const text = row.querySelector(".cat-text").value.trim();
      const link = row.querySelector(".cat-link").value.trim();
      if (text) {
          if (link) {
              categoryItems.push(`<a href="${link}" target="_blank">${text}</a>`);
          } else {
              categoryItems.push(`<span style="color: #0275d8">${text}</span>`);
          }
      }
  });

  let categoryHTML = "";
  if (categoryItems.length > 0) {
      const sep = `<span style="border-left: 1px solid #888; display: inline-block; height: .8rem; margin: 0 .4rem -.1rem;"></span>`;
      const inner = categoryItems.join(sep);
      categoryHTML = `<div class="wiki-category" style="display: flex; align-items: center; flex-wrap: wrap;">분류:&nbsp; ${inner}</div>`;
  }

  const indexHTML = generateIndexHTML();
  const bodyHTML = generateBodyHTML();
  
let rawHTML = `
<style>
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-jp.min.css");
:root {
    --wiki-main-color: ${color};
    --wiki-text-color: #ffffff;
    --wiki-link-color: #0275d8;
    --wiki-border-color: #ddd;
    --wiki-bg-gray: #eee;
    --wiki-max-width: 700px;
    --wiki-font-size: 14px;
    --wiki-line-height: 1.5;
}

#wikiwrap {
    --wiki-main-color: ${color}; 
}

.wiki-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.wiki-main-table {
    order: 1;
}

.wiki-index {
    order: 2;
}

@media (min-width: 768px) {
    .wiki-container {
        flex-direction: row;
        align-items: flex-start;
    }

    .wiki-index {
        order: 1;
        flex: 0 0 250px;
        top: 20px;
    }

    .wiki-main-table {
        order: 2;
        flex: 1;
        min-width: 0;
    }
}

#wikiwrap {
    font-family: "Pretendard JP Variable", "Pretendard JP", "Pretendard", Pretendard, 
                 -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", 
                 "Segoe UI", "Hiragino Sans", "Apple SD Gothic Neo", Meiryo, 
                 "Noto Sans JP", "Noto Sans KR", "Malgun Gothic", Osaka, 
                 "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
    box-sizing: border-box;
    font-size: var(--wiki-font-size);
    line-height: var(--wiki-line-height);
    max-width: var(--wiki-max-width);
    margin: 0 auto;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
}

#wikiwrap a,
.text1 a,
.wiki-category a,
.wiki-index a {
    color: var(--wiki-link-color);
    text-decoration: none;
}

#wikiwrap a::before,
#wikiwrap a::after,
.text1 a::before,
.wiki-category a::before,
.wiki-index a::before {
    content: none !important;
}

.wiki-toggle-btn {
    color: inherit !important;
    text-decoration: none !important;
    cursor: pointer;
    font-size: var(--wiki-font-size) !important;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
}

.wiki-main-table {
    border-collapse: collapse;
    width: 100%;
    border: 2px solid var(--wiki-main-color);
    font-size: 0.96em;
    line-height: var(--wiki-line-height);
    margin: 20px 0 16px;
}

.wt-name {
    padding: 5px 10px;
    border: 2px solid var(--wiki-main-color);
    text-align: center;
    background-color: var(--wiki-main-color);
    color: var(--wiki-text-color);
}

.wt-copyright {
    padding: 5px 10px;
    border: 1px solid var(--wiki-border-color);
    text-align: center;
    color: inherit !important;
}

.wt-color {
    width: 30%;
    padding: 5px 10px;
    border: 1px solid var(--wiki-border-color);
    border-right: 1px solid var(--wiki-border-color);
    border-bottom: 1px solid var(--wiki-border-color);
    text-align: center;
    background-color: var(--wiki-main-color);
    color: var(--wiki-text-color);
}

.wt-detail {
    padding: 5px 10px;
    border: 1px solid var(--wiki-border-color);
    border-bottom: 1px solid var(--wiki-border-color);
    text-align: left;
    color: inherit !important;
}

.wiki-main-table tr:last-child > td {
    border-bottom: none;
}

summary {
    list-style-type: none;
    opacity: 0.5;
    cursor: pointer;
    align-items: center;
    justify-content: center;
}

summary::-webkit-details-marker {
    display: none;
}

details[open] summary {
    opacity: 1;
}

.wiki-h1-icon ion-icon,
.wiki-h2-icon ion-icon,
.wiki-h3-icon ion-icon {
    transition: transform 0.3s ease;
    transform: rotate(-90deg);
}

details[open] .wiki-h1-icon ion-icon,
details[open] .wiki-h2-icon ion-icon,
details[open] .wiki-h3-icon ion-icon {
    transform: rotate(0deg);
}

.text1 {
    font-size: var(--wiki-font-size);
    line-height: var(--wiki-line-height);
}

#wikiwrap ul,
#wikiwrap ol {
    padding-left: 1.4em !important;
    margin: 0.4em 0 !important;
    list-style-position: outside !important;
    color: inherit !important;
}

#wikiwrap ul {
    list-style-type: disc !important;
}

#wikiwrap ol {
    list-style-type: decimal !important;
}

#wikiwrap li {
    margin: 0.2em 0 !important;
    color: inherit !important;
}

#wikiwrap ul li::marker,
#wikiwrap ol li::marker {
    color: inherit !important;
}

.wiki-category {
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: normal;
    line-height: var(--wiki-line-height);
    margin: 0 0 1em;
    padding: 0.2rem 0.5rem;
}

.wiki-h1 {
    font-size: 1.8em;
    border-bottom: 1px solid #ccc;
    margin: 1.2em 0 0.7em;
    padding-bottom: 5px;
    font-weight: bold;
}

.wiki-h2 {
    font-size: 1.6em;
    border-bottom: 1px solid #ccc;
    margin: 1.2em 0 0.7em;
    padding-bottom: 5px;
    font-weight: bold;
}

.wiki-h3 {
    font-size: 1.4em;
    border-bottom: 1px solid #ccc;
    margin: 1.2em 0 0.7em;
    padding-bottom: 5px;
    font-weight: bold;
}

.wiki-h1-icon,
.wiki-h2-icon,
.wiki-h3-icon {
    color: #666;
    float: left;
    font-weight: 400;
    line-height: 1em;
    text-align: center;
    width: 0.9em;
    margin-right: 0.4em;
    margin-top: 0.2em;
}

.wiki-index {
    border-collapse: collapse;
    width: auto;
    max-width: 250px;
    border: 1px solid #ccc;
    margin: 0 0 20px 5px;
    line-height: 1.8;
}

.wiki-quote {
    border-collapse: collapse;
    width: auto;
    height: auto;
    margin: 1em 0;
}

.wiki-quote td {
    width: 100%;
    border: 2px dashed #ccc;
    border-left: 5px solid var(--wiki-main-color);
    background: var(--wiki-bg-gray);
    padding: 1em;
    line-height: 1.6;
}

.wiki-quote hr {
    border: 0;
    border-top: 1px solid #ccc;
    margin: 0.5em 0;
}

.wiki-footnote {
    border-top: 1px solid #777;
    margin: 1.5em 0;
    padding: 0.5em 0;
    font-size: 0.9em;
}
.wiki-footnote p {
    margin: 5px 0;
}

.wikigreenicon {
    background: green;
    color: white;
    padding: 0 0.08em;
    font-size: var(--wiki-font-size);
    vertical-align: middle;
}

.wikigreentext {
    color: green;
    vertical-align: middle;
    font-size: var(--wiki-font-size);
    line-height: var(--wiki-line-height);
}

.wikigreen:hover {
    text-decoration: underline;
    text-decoration-color: green;
}

.wiki-img-sing {
    width: 100%;
    margin: 1em 0;
    border-collapse: collapse;
    line-height: 0;
}

.wiki-table-scaled {
    width: var(--table-width-pct, 100%);
}

@media (max-width: 767px) {
    .wiki-table-scaled {
        width: 100% !important;
    }
}

.wiki-img-sing td {
    padding: 0;
    border: 2px solid var(--wiki-main-color);
}

.wiki-img-sing img {
    display: block;
    width: 100%;
    height: auto;
}

.wiki-img-sing iframe {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 0;
    box-shadow: none;
}
.wiki-img-sing iframe[src*="youtube.com"] {
    border-radius: 0 !important;
}
.wiki-fn-link {
    position: relative;
    display: inline-block;
    cursor: pointer;
    text-decoration: none !important;
}
.wiki-fn-tooltip {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 8px 12px;
    width: max-content;
    max-width: 250px;
    z-index: 100;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    text-align: left;
    white-space: normal;
    margin-bottom: 8px; 
    
    font-size: calc(var(--wiki-font-size) * 0.9);
    line-height: var(--wiki-line-height);
    font-weight: normal !important;
}

.wiki-fn-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #ccc transparent transparent transparent; 
}

@media (min-width: 768px) {
    .wiki-fn-link:hover .wiki-fn-tooltip {
        display: block;
    }
}

.wiki-modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.3);
    z-index: 99998;
}
.wiki-modal-overlay.active {
    display: block;
}
.wiki-modal-box {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 15px;
    width: 80%;
    max-width: 300px;
    z-index: 99999;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    
    font-size: calc(var(--wiki-font-size) * 0.9);
    line-height: var(--wiki-line-height);
    font-weight: normal !important;
}
</style>
<div id="wikiwrap">
  ${titleTimeHTML}
  ${categoryHTML}
  
  <div class="wiki-container">
    <table class="wiki-main-table">
      <tbody>
        <tr>
          <td class="wt-name" colspan="2">
            <b><span style="font-size: 20px;">${name}</span></b><br />
            <b><span style="font-size: 13px; line-height: 180%;">${rubyBlock}${pipeName}</span></b>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 0; border: 2px solid var(--wiki-main-color); border-bottom: var(--wiki-border-color);">
            <div style="text-align: center;">
              <img src="${imageUrl}" width="100%" style="display:block;" />
            </div>
          </td>
        </tr>
        ${copyright ? `<tr><td class="wt-copyright" colspan="2">${copyright}</td></tr>` : ''}
        ${detailRows}
      </tbody>
    </table>
    ${indexHTML}
  </div>
  ${bodyHTML}
</div>
`.trim();

    const processedData = processFootnotes(rawHTML);
    const fullHTML = processedData.html; 

    document.getElementById("output").value = fullHTML;
    document.getElementById("preview").innerHTML = fullHTML; 
    
    updatePreviewColor(color);
}

function processFootnotes(html) {
    const allFootnotes = [];
    let numCounter = 1;

    const processedHTML = html.replace(/\{\{\[([^\]]*)\]\|([^}]*)\}\}|\{\{(.*?)\}\}/g, (match, label, labelContent, numContent) => {
        if (label !== undefined) {
            const safeLabel = label.trim() || '주석';
            const id = `fn-label-${allFootnotes.length + 1}`;
            const tooltipContent = `<span style="color: var(--wiki-link-color);">[${safeLabel}]</span> <span style="color: #333;">${labelContent}</span>`;
            const anchorLink = `<a name="돌아가기-${id}"></a><a href="#각주-${id}" class="wiki-fn-link" onclick="openWikiModal(event, this)"><sup>[${safeLabel}]</sup><span class="wiki-fn-tooltip">${tooltipContent}</span></a>`;
            allFootnotes.push({ anchor: `각주-${id}`, backAnchor: `돌아가기-${id}`, label: safeLabel, content: labelContent });
            return anchorLink;
        } else {
            const n = numCounter;
            const tooltipContent = `<span style="color: var(--wiki-link-color);">[${n}]</span> <span style="color: #333;">${numContent}</span>`;
            const anchorLink = `<a name="돌아가기${n}"></a><a href="#각주${n}" class="wiki-fn-link" onclick="openWikiModal(event, this)"><sup>[${n}]</sup><span class="wiki-fn-tooltip">${tooltipContent}</span></a>`;
            allFootnotes.push({ anchor: `각주${n}`, backAnchor: `돌아가기${n}`, label: `${n}`, content: numContent });
            numCounter++;
            return anchorLink;
        }
    });

    let footnoteSection = '';
    let modalScript = '';

    if (allFootnotes.length > 0) {
        let listItems = '';
        allFootnotes.forEach(item => {
            listItems += `<p><a name="${item.anchor}"></a><a href="#${item.backAnchor}">[${item.label}]</a> ${item.content}</p>\n`;
        });

        footnoteSection = `
            <div class="text1 wiki-footnote">
                ${listItems}
            </div>`;

        modalScript = `
            <script>
            function openWikiModal(e, el) {
                if (window.innerWidth >= 768) return; 
                e.preventDefault(); 
                const existingOverlay = document.getElementById('wiki-fn-overlay');
                if (existingOverlay) existingOverlay.remove();
                const tooltipContent = el.querySelector('.wiki-fn-tooltip').innerHTML;
                const overlay = document.createElement('div');
                overlay.id = 'wiki-fn-overlay';
                overlay.className = 'wiki-modal-overlay active';
                const modal = document.createElement('div');
                modal.className = 'wiki-modal-box';
                modal.innerHTML = tooltipContent;
                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                });
            }
            </script>
        `;
        
        const lastDivIndex = processedHTML.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
            return {
                html: processedHTML.substring(0, lastDivIndex) + footnoteSection + modalScript + processedHTML.substring(lastDivIndex)
            };
        }
    }

    return { html: processedHTML };
}

function copyCode() {
  const code = document.getElementById("output");
  code.select();
  document.execCommand("copy");
  alert("코드가 복사되었습니다!");
}

document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    const selectedTab = button.dataset.tab;
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
    document.getElementById("tab-" + selectedTab).classList.remove("hidden");
  });
});

let lastFocusedInput = null;
let savedRange = null;
let lastSelectedBlock = null;

function initializeBodyEditor() {
    const editorContainer = document.getElementById("editor-container");

    editorContainer.addEventListener('mousedown', (e) => {
        const block = e.target.closest('.editable-block');
        if (block && editorContainer.contains(block)) {
            lastSelectedBlock = block;
        }
    });

    new Sortable(editorContainer, {
        animation: 150,
        handle: ".editable-block",
        filter: '[contenteditable="true"], input, textarea, button, label, select, .tbl-btn, .tbl-color-label, .delete-block-btn, .toggle-mini-toolbar, .table-toolbar, .table-scroll-wrap, .description-settings, .color-picker-wrapper, .quote2-link, .toggle-label-row',
        preventOnFilter: true,
        group: { name: 'editor-blocks', pull: true, put: true },
        scroll: true,
        forceFallback: true,
        scrollSensitivity: 100, 
        scrollSpeed: 20,
        bubbleScroll: true,
        onEnd: debouncedGenerateHTML
    });

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if(editorContainer.contains(range.commonAncestorContainer)) {
                savedRange = range.cloneRange();
                lastFocusedInput = null;
                updateFontSizeInputDisplay(range, 'body');
            }
        }
    };
    editorContainer.addEventListener('mouseup', saveSelection);
    editorContainer.addEventListener('keyup', saveSelection);

    const fontColorPicker = document.getElementById('fontColorPicker');
    const fontColorButton = document.querySelector('label[for="fontColorPicker"]');

    fontColorButton.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (!savedRange) {
             editorContainer.querySelector('[contenteditable="true"]')?.focus();
        }
        fontColorPicker.click();
    });

    fontColorPicker.addEventListener('input', () => {
        if (savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRange);
            
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('foreColor', false, fontColorPicker.value);
            
            if (selection.rangeCount > 0) {
                savedRange = selection.getRangeAt(0).cloneRange();
            }
            debouncedGenerateHTML();
        }
    });

    const bgColorPicker = document.getElementById('bgColorPicker');
    const bgColorButton = document.querySelector('label[for="bgColorPicker"]');

    bgColorButton.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (!savedRange) {
             editorContainer.querySelector('[contenteditable="true"]')?.focus();
        }
        bgColorPicker.click();
    });

    bgColorPicker.addEventListener('input', () => {
        if (savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRange);
            
            document.execCommand('styleWithCSS', false, true); 
            
            if (!document.execCommand('hiliteColor', false, bgColorPicker.value)) {
                document.execCommand('backColor', false, bgColorPicker.value);
            }
            
            if (selection.rangeCount > 0) {
                savedRange = selection.getRangeAt(0).cloneRange();
            }
            debouncedGenerateHTML();
        }
    });
}

// ── 기본정보 탭 툴바 ────────────────────────────
let basicSavedRange = null;

function initializeBasicToolbar() {
    const basicToolbar = document.getElementById('basic-toolbar');
    if (!basicToolbar) return;

    const fieldList = document.getElementById('field-list');

    basicToolbar.addEventListener('mousedown', (e) => {
        const target = e.target.closest('button, label');
        if (target) {
            e.preventDefault();
        }
    });

    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (fieldList && fieldList.contains(range.commonAncestorContainer)) {
            basicSavedRange = range.cloneRange();
            updateFontSizeInputDisplay(range, 'basic');
        }
    });

    const fontPicker = document.getElementById('basicFontColorPicker');
    document.querySelector('label[for="basicFontColorPicker"]').addEventListener('click', (e) => {
        e.preventDefault();
        fontPicker.click();
    });
    fontPicker.addEventListener('input', () => {
        if (basicSavedRange) {
            restoreBasicRange();
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('foreColor', false, fontPicker.value);
            saveBasicRange();
            debouncedGenerateHTML();
        }
    });

    const bgPicker = document.getElementById('basicBgColorPicker');
    document.querySelector('label[for="basicBgColorPicker"]').addEventListener('click', (e) => {
        e.preventDefault();
        bgPicker.click();
    });
    bgPicker.addEventListener('input', () => {
        if (basicSavedRange) {
            restoreBasicRange();
            document.execCommand('styleWithCSS', false, true);
            if (!document.execCommand('hiliteColor', false, bgPicker.value)) {
                document.execCommand('backColor', false, bgPicker.value);
            }
            saveBasicRange();
            debouncedGenerateHTML();
        }
    });
}

function saveBasicRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        basicSavedRange = sel.getRangeAt(0).cloneRange();
    }
}

function restoreBasicRange() {
    if (basicSavedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(basicSavedRange);
    }
}

function basicExec(cmd) {
    if (basicSavedRange) {
        restoreBasicRange();
    }
    document.execCommand(cmd);
    saveBasicRange();
    debouncedGenerateHTML();
}

// ── 글씨 크기 조절 (기본 정보 / 본문 공통) ──────────
function updateFontSizeInputDisplay(range, scope) {
    const input = document.getElementById(scope === 'basic' ? 'basicFontSizeInput' : 'bodyFontSizeInput');
    if (!input) return;
    let node = range.startContainer;
    if (node.nodeType !== Node.ELEMENT_NODE) node = node.parentElement;
    if (!node) return;
    const size = parseFloat(window.getComputedStyle(node).fontSize);
    input.value = isNaN(size) ? '' : Math.round(size);
}

function changeFontSize(delta, scope) {
    const isBasic = scope === 'basic';
    const rangeRef = isBasic ? basicSavedRange : savedRange;

    if (!rangeRef || rangeRef.collapsed) {
        alert('글씨 크기를 조절할 텍스트를 먼저 선택(드래그)해주세요.');
        return;
    }

    let refNode = rangeRef.startContainer;
    if (refNode.nodeType !== Node.ELEMENT_NODE) refNode = refNode.parentElement;
    const currentSize = refNode ? parseFloat(window.getComputedStyle(refNode).fontSize) : NaN;
    const newSize = Math.max(8, (isNaN(currentSize) ? 14 : currentSize) + delta);

    applyFontSizeToSelection(newSize, scope, rangeRef);
}

function setFontSizeExact(inputEl, scope) {
    const isBasic = scope === 'basic';
    const rangeRef = isBasic ? basicSavedRange : savedRange;

    if (!rangeRef || rangeRef.collapsed) {
        alert('글씨 크기를 조절할 텍스트를 먼저 선택(드래그)해주세요.');
        inputEl.value = '';
        return;
    }

    const newSize = Math.max(8, parseFloat(inputEl.value) || 14);
    applyFontSizeToSelection(newSize, scope, rangeRef);
}

function applyFontSizeToSelection(newSize, scope, rangeRef) {
    const isBasic = scope === 'basic';

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeRef);

    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');

    const scopeEl = isBasic ? document.getElementById('field-list') : document.getElementById('editor-container');
    const newSpans = [];
    if (scopeEl) {
        scopeEl.querySelectorAll('font[size="7"]').forEach(f => {
            const span = document.createElement('span');
            span.style.fontSize = newSize + 'px';
            while (f.firstChild) span.appendChild(f.firstChild);
            f.replaceWith(span);
            newSpans.push(span);
        });
    }

    // Re-select the resized text (boundaries INSIDE the spans, not around
    // them) so repeated clicks and the size input keep working on the same
    // selection without re-dragging. A range anchored at the parent level
    // (setStartBefore/After) looks selected visually but execCommand treats
    // it as nothing-to-rewrap on the next call, silently no-op'ing.
    if (newSpans.length > 0) {
        const firstSpan = newSpans[0];
        const lastSpan = newSpans[newSpans.length - 1];
        const newRange = document.createRange();
        newRange.setStart(firstSpan, 0);
        newRange.setEnd(lastSpan, lastSpan.childNodes.length);
        selection.removeAllRanges();
        selection.addRange(newRange);
        if (isBasic) {
            basicSavedRange = newRange.cloneRange();
        } else {
            savedRange = newRange.cloneRange();
        }
    }
    debouncedGenerateHTML();
}

function basicApplyLink() {
    if (!basicSavedRange || basicSavedRange.collapsed) {
        alert("링크를 적용할 텍스트를 먼저 선택(드래그)해주세요.");
        return;
    }
    const url = prompt("연결할 URL을 입력하세요:", "https://");
    if (url) {
        restoreBasicRange();
        document.execCommand('createLink', false, url);
        const sel = window.getSelection();
        let node = sel.anchorNode;
        if (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
        if (node && node.tagName === 'A') node.target = '_blank';
        saveBasicRange();
        debouncedGenerateHTML();
    }
}

function basicApplySourceLink() {
    const url = prompt("출처 URL을 입력하세요:", "");
    if (!url) return;
    const text = prompt("표시할 텍스트를 입력하세요:", "출처");
    if (!text) return;

    const sourceHtml = `<span contenteditable="false" style="display: inline-block; white-space: nowrap;"><a class="wikigreen" href="${url}" target="_blank"><ion-icon class="wikigreenicon md hydrated" name="link" role="img"></ion-icon><span class="wikigreentext">${text}</span></a></span>&nbsp;`;

    if (basicSavedRange) restoreBasicRange();
    document.execCommand('insertHTML', false, sourceHtml);
    debouncedGenerateHTML();
}

function basicAddToggle() {
    const openLabel = prompt("열릴 때 문구를 입력하세요:", "더보기");
    if (openLabel === null) return;
    const closeLabel = prompt("닫힐 때 문구를 입력하세요:", "닫기");
    if (closeLabel === null) return;
    const content = prompt("토글 안에 들어갈 내용을 입력하세요:", ""); 
    if (content === null) return;

    const toggleHtml = `<span class="wiki-toggle-wrap"><a class="wiki-toggle-btn" href="javascript:void(0)" onclick="(function(btn){var w=btn.closest('.wiki-toggle-wrap'); var b=w.querySelector('.wiki-toggle-body'); var isOpen=b.style.display!=='none'; b.style.display=isOpen?'none':'block'; btn.innerHTML=isOpen?btn.dataset.openLabel:btn.dataset.closeLabel;})(this)" data-open-label="${openLabel.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" data-close-label="${closeLabel.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" style="color: inherit; text-decoration: none; cursor: pointer; font-size: var(--wiki-font-size, 14px); -webkit-text-size-adjust: 100%; text-size-adjust: 100%;">${openLabel}</a><div class="wiki-toggle-body" style="display:none; padding-top:4px;">${content}</div></span>`;

    if (basicSavedRange) restoreBasicRange();
    document.execCommand('insertHTML', false, toggleHtml);
    debouncedGenerateHTML();
}

function basicInsertFootnote() {
    const labelChoice = confirm("텍스트 레이블 각주로 넣으시겠습니까?\n확인 → 텍스트 레이블 (예: [스포일러])\n취소 → 자동 번호");
    const text = prompt("각주(주석) 내용을 입력하세요:", "");
    if (!text) return;

    let labelText = '';
    if (labelChoice) {
        labelText = prompt("표시할 레이블 텍스트를 입력하세요 (예: 스포일러):", "");
        if (labelText === null) return;
    }

    const formattedText = labelText.trim()
        ? `{{[${labelText.trim()}]|${text}}}`
        : `{{${text}}}`;

    if (basicSavedRange) restoreBasicRange();
    document.execCommand('insertText', false, formattedText);
    debouncedGenerateHTML();
}

function applyLink() {
    if (!savedRange || savedRange.collapsed) {
        alert("링크를 적용할 텍스트를 먼저 선택(드래그)해주세요.");
        return;
    }
    const url = prompt("연결할 URL을 입력하세요:", "https://");
    if (url) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
        document.execCommand('createLink', false, url);
        
        let anchorNode = selection.anchorNode;
        if (anchorNode.nodeType !== Node.ELEMENT_NODE) {
            anchorNode = anchorNode.parentNode;
        }
        if (anchorNode && anchorNode.tagName === 'A') {
             anchorNode.target = "_blank";
        }
        debouncedGenerateHTML();
    }
}

function applySourceLink() {
    const url = prompt("출처 URL을 입력하세요:", "");
    if (!url) return;
    const text = prompt("표시할 텍스트를 입력하세요:", "출처");
    if (!text) return;

    const sourceHtml = `
        <span contenteditable="false" style="display: inline-block; white-space: nowrap;">
            <a class="wikigreen" href="${url}" target="_blank">
                <ion-icon class="wikigreenicon md hydrated" name="link" role="img"></ion-icon>
                <span class="wikigreentext">${text}</span>
            </a>
        </span>&nbsp;`;
    
    const selection = window.getSelection();
    if (savedRange) {
         selection.removeAllRanges();
         selection.addRange(savedRange);
    }
    
    document.execCommand('insertHTML', false, sourceHtml);
    debouncedGenerateHTML();
}

function getYoutubeEmbedUrl(url) {
    if (!url) return '';
    let videoId = '';
    const youtubeIdRegex = /^[a-zA-Z0-9_-]{11}$/;

    if (youtubeIdRegex.test(url)) {
        videoId = url;
    } else {
        try {
            const fullUrl = url.startsWith('http') ? url : `${url}`;
            const urlObj = new URL(fullUrl);

            if (urlObj.hostname === 'youtu.be') {
                videoId = urlObj.pathname.slice(1).split('?')[0];
            } else if (urlObj.hostname.includes('youtube.com')) {
                if (urlObj.pathname.includes('embed')) {
                    videoId = urlObj.pathname.split('/embed/')[1].split('?')[0];
                } else if (urlObj.searchParams.has('v')) {
                    videoId = urlObj.searchParams.get('v');
                }
            }
        } catch (e) {
            return '';
        }
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

function updateMediaSrc(inputElement, mediaType) {
    const container = inputElement.closest('.editable-media');
    const mediaElement = container.querySelector(mediaType);
    if (mediaType === 'img') {
        mediaElement.src = inputElement.value;
    } else if (mediaType === 'iframe') {
        const embedUrl = getYoutubeEmbedUrl(inputElement.value);
        if (embedUrl) {
            mediaElement.src = embedUrl;
        }
    }
}

function updateMediaBorderColor(colorInput) {
    const container = colorInput.closest('.editable-media');
    const table = container.querySelector('.wiki-img-sing');
    const allCells = table.querySelectorAll('td');
    
    colorInput.previousElementSibling.style.backgroundColor = colorInput.value;
    
    allCells.forEach(cell => {
        cell.style.borderColor = colorInput.value;
    });
}

function resolveContainerChildBlock(startEl, container) {
    let node = startEl;
    while (node && node.parentElement && node.parentElement !== container) {
        node = node.parentElement;
    }
    return (node && node.parentElement === container) ? node : null;
}

function addBlock(type, data = {}, targetContainer = null, forceAppend = false) {
    const container = targetContainer || document.getElementById("editor-container");
    const block = document.createElement("div");
    block.className = "editable-block";
    block.dataset.type = type;

    let contentHTML = '';
    const mainColor = document.getElementById("mainColorPicker").value;

    switch (type) {
        case 'h1':
            contentHTML = `<div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-h1" contenteditable="true">${data.content || '대제목'}</div>`;
            break;
        case 'h2':
            contentHTML = `<div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-h2" contenteditable="true">${data.content || '중제목'}</div>`;
            break;
        case 'h3':
            contentHTML = `<div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-h3" contenteditable="true">${data.content || '소제목'}</div>`;
            break;
        case 'text':
            contentHTML = `<div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-text" contenteditable="true">${data.content || '본문 내용을 입력하세요.'}</div>`;
            break;
        case 'quote':
            const quoteColor = data.color || mainColor;
            contentHTML = `
                <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-quote" style="border-left-color: ${quoteColor};">
                    <div class="color-picker-wrapper">
                        <label class="quote-color-display" title="대사 색상 선택" style="background-color: ${quoteColor};"></label>
                        <input type="color" class="quote-color-picker" value="${quoteColor}">
                        <span>대사 색상 선택</span>
                    </div>
                    <div class="quote-content" contenteditable="true">${data.content || '대사 내용을 입력하세요.'}</div>
                </div>`;
            break;
        case 'quote2':
            const quote2Color = data.color || mainColor;
            contentHTML = `
                <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-quote2" style="border-left-color: ${quote2Color};">
                     <div class="color-picker-wrapper">
                        <label class="quote-color-display" title="대사 색상 선택" style="background-color: ${quote2Color};"></label>
                        <input type="color" class="quote-color-picker" value="${quote2Color}">
                        <span>대사 색상 선택</span>
                    </div>
                    <div class="quote2-dialog" contenteditable="true">${data.dialog || '대사2 내용을 입력하세요.'}</div>
                    <hr/>
                    <div class="quote2-desc" contenteditable="true">${data.desc || '이름/장면 등'}</div>
                    <input type="text" class="quote2-link" value="${data.link || ''}" placeholder="링크를 입력하세요 (선택)" />
                </div>`;
            break;
            
        case 'warn':
            contentHTML = `
                <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-warn">
                    <span style="font-size: 1.3em;">이 문서에</span> 
                    <a style="color: #0275d8; font-size: 1.3em;" href="https://namu.wiki/w/%EC%8A%A4%ED%8F%AC%EC%9D%BC%EB%9F%AC" target="_blank" rel="noopener">스포일러</a>
                    <span style="font-size: 1.3em;">가 포함되어 있습니다.</span><br /><br />
                    이 문서가 설명하는 작품이나 인물 등에 대한 줄거리, 결말, 반전 요소 등을 직·간접적으로 포함하고 있습니다.
                </div>`;
            break;
        case 'toggle': {
            const toggleOpenLabel = data.openLabel || '더보기';
            const toggleCloseLabel = data.closeLabel || '닫기';
            const toggleBtnColor = data.btnColor || '#000000';
            const toggleBtnColorCustom = !!data.btnColorCustom;
            contentHTML = `
                <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-toggle">
                    <div class="toggle-label-row">
                        <span class="toggle-label-hint">열릴 때:</span>
                        <span class="toggle-open-label" contenteditable="true" style="display: inline-block; min-width: 80px; padding: 3px 6px; font-size: 0.82rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); cursor: text;">${toggleOpenLabel}</span>
                        <span class="toggle-label-hint">닫힐 때:</span>
                        <span class="toggle-close-label" contenteditable="true" style="display: inline-block; min-width: 80px; padding: 3px 6px; font-size: 0.82rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); cursor: text;">${toggleCloseLabel}</span>
                        <span class="toggle-label-hint">버튼 색:</span>
                        <label class="tbl-color-label toggle-btn-color-label" title="버튼 텍스트 색상 (지정하지 않으면 티스토리 스킨 기본 글자색을 따릅니다)" style="padding:3px 6px;">
                            <div class="toggle-btn-color-display" style="width:14px;height:14px;border-radius:50%;background:${toggleBtnColorCustom ? toggleBtnColor : 'transparent'};border:1px ${toggleBtnColorCustom ? 'solid' : 'dashed'} rgba(0,0,0,0.35);flex-shrink:0;"></div>
                            <input type="color" class="toggle-btn-color" value="${toggleBtnColor}" data-custom="${toggleBtnColorCustom}" style="width:0;height:0;opacity:0;position:absolute;">
                        </label>
                        ${toggleBtnColorCustom ? `<button type="button" class="tbl-transparent-btn toggle-btn-color-reset" title="버튼 색을 스킨 기본색으로 되돌리기">↺</button>` : ''}
                    </div>
                    <div class="toggle-mini-toolbar">
                        <span class="toggle-label-hint" style="font-size:0.7rem;">블록 추가:</span>
                        <button class="tbl-btn" type="button" onclick="addNestedBlock(this,'text')" title="텍스트"><i class="fa-solid fa-paragraph"></i></button>
                        <button class="tbl-btn" type="button" onclick="addNestedBlock(this,'quote')" title="대사 블록"><i class="fa-solid fa-comment-dots"></i></button>
                        <button class="tbl-btn" type="button" onclick="addNestedBlock(this,'quote2')" title="대사형식2"><i class="fa-solid fa-comments"></i></button>
                        <button class="tbl-btn" type="button" onclick="addNestedBlock(this,'warn')" title="스포일러 주의"><i class="fa-solid fa-triangle-exclamation"></i></button>
                        <button class="tbl-btn" type="button" onclick="addNestedBlock(this,'image')" title="이미지"><i class="fa-solid fa-image"></i></button>
                        <button class="tbl-btn" type="button" onclick="addNestedBlock(this,'youtube')" title="유튜브"><i class="fa-brands fa-youtube"></i></button>
                        <button class="tbl-btn" type="button" onclick="addNestedBlock(this,'table')" title="표"><i class="fa-solid fa-table"></i></button>
                    </div>
                    <div class="toggle-blocks-container"></div>
                </div>`;
            break;
        }
        case 'image':
            const imageUrl = data.url || prompt("이미지 URL을 입력하세요:");
            if (!imageUrl) return;
            const imgBorderColor = data.borderColor || mainColor;
            const imgHasDesc = data.hasDescription !== undefined ? data.hasDescription : true;
            const imgDescBg = data.descriptionBg || imgBorderColor;
            const imgDescText = data.descriptionTextColor || '#ffffff';
            contentHTML = `
    <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-media">
        <table class="wiki-img-sing" style="margin: 0;">
            <tbody>
                <tr><td style="border-color: ${imgBorderColor}; padding: 0;"><img src="${imageUrl}" alt="사용자 이미지" style="width: 100%; height: auto; display: block;"></td></tr>
                ${imgHasDesc ? `<tr><td class="media-description-cell" contenteditable="true" style="background-color: ${imgDescBg}; color: ${imgDescText}; border-color: ${imgBorderColor}; padding: 5px 10px; line-height: 1.5; text-align: center; word-wrap: break-word; white-space: normal; min-height: 20px; vertical-align: top;">${data.description || '이미지 설명을 입력하세요'}</td></tr>` : ''}
            </tbody>
        </table>
        <input type="text" class="media-url" value="${imageUrl}" oninput="updateMediaSrc(this, 'img')" placeholder="Image URL">
        <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
            <label class="color-display" title="테두리 색상 선택" style="background-color: ${imgBorderColor};"></label>
            <input type="color" class="media-border-color" value="${imgBorderColor}" 
                   oninput="updateMediaBorderColor(this)">
            <span>테두리 색상</span>
        </div>
        <div class="description-settings">
                        <label style="display: flex; align-items: center; gap: 5px; margin-top: 10px;">
                            <input type="checkbox" class="desc-enabled" ${imgHasDesc ? 'checked' : ''}>
                            설명란 사용
                        </label>
                        <div class="desc-options" style="display: ${imgHasDesc ? 'block' : 'none'};">
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
                                <label class="color-display" title="설명란 배경색" style="background-color: ${imgDescBg};"></label>
                                <input type="color" class="desc-bg-color" value="${imgDescBg}">
                                <span>배경색</span>
                            </div>
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 5px;">
                                <label class="color-display" title="설명란 텍스트 색상" style="background-color: ${imgDescText};"></label>
                                <input type="color" class="desc-text-color" value="${imgDescText}">
                                <span>텍스트 색상</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            break;
                case 'youtube':
            const youtubeUrl = data.url || prompt("유튜브 영상 ID를 입력하세요:");
            if (!youtubeUrl) return;
            const embedUrl = getYoutubeEmbedUrl(youtubeUrl);
            if (!embedUrl) {
                alert("유효하지 않은 ID입니다.");
                return;
            }
            const ytBorderColor = data.borderColor || mainColor;
            const ytHasDesc = data.hasDescription !== undefined ? data.hasDescription : true;
            const ytDescBg = data.descriptionBg || ytBorderColor;
            const ytDescText = data.descriptionTextColor || '#ffffff';
            contentHTML = `
    <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div><div class="editable-media">
        <table class="wiki-img-sing" style="margin: 0;">
            <tbody>
                <tr><td style="border-color: ${ytBorderColor}; padding: 0;"><iframe src="${embedUrl}" style="display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; border-radius: 0; box-shadow: none;"></iframe></td></tr>
                ${ytHasDesc ? `<tr><td class="media-description-cell" contenteditable="true" style="background-color: ${ytDescBg}; color: ${ytDescText}; border-color: ${ytBorderColor}; padding: 5px 10px; line-height: 1.5; text-align: center; word-wrap: break-word; white-space: normal; min-height: 20px; vertical-align: top;">${data.description || '영상 설명을 입력하세요'}</td></tr>` : ''}
            </tbody>
        </table>
        <input type="text" class="media-url" value="${youtubeUrl}" oninput="updateMediaSrc(this, 'iframe')" placeholder="YouTube URL or ID">
        <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
            <label class="color-display" title="테두리 색상 선택" style="background-color: ${ytBorderColor};"></label>
            <input type="color" class="media-border-color" value="${ytBorderColor}"
                   oninput="updateMediaBorderColor(this)">
            <span>테두리 색상</span>
        </div>
        <div class="description-settings">
                        <label style="display: flex; align-items: center; gap: 5px; margin-top: 10px;">
                            <input type="checkbox" class="desc-enabled" ${ytHasDesc ? 'checked' : ''}>
                            설명란 사용
                        </label>
                        <div class="desc-options" style="display: ${ytHasDesc ? 'block' : 'none'};">
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
                                <label class="color-display" title="설명란 배경색" style="background-color: ${ytDescBg};"></label>
                                <input type="color" class="desc-bg-color" value="${ytDescBg}">
                                <span>배경색</span>
                            </div>
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 5px;">
                                <label class="color-display" title="설명란 텍스트 색상" style="background-color: ${ytDescText};"></label>
                                <input type="color" class="desc-text-color" value="${ytDescText}">
                                <span>텍스트 색상</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            break;
        case 'table': {
            let rows = data.rows || 0;
            let cols = data.cols || 0;
            if (!rows || !cols) {
                const r = parseInt(prompt('행 수를 입력하세요:', '3'));
                const c = parseInt(prompt('열 수를 입력하세요:', '3'));
                if (!r || !c || isNaN(r) || isNaN(c)) return;
                rows = r; cols = c;
            }
            const tblBorderColor = data.borderColor || '#cccccc';
            const tblOutBorderColor = data.outBorderColor || tblBorderColor;
            const tblBgColor = data.bgColor || '#ffffff';
            const tblWidthPercent = data.widthPercent || 100;
            const tblColWidths = data.colWidths || [];
            let colgroupHTML = '<colgroup>';
            for (let c = 0; c < cols; c++) {
                colgroupHTML += tblColWidths[c] ? `<col style="width:${tblColWidths[c]};">` : '<col>';
            }
            colgroupHTML += '</colgroup>';
            let cellsHTML = '';
            for (let r = 0; r < rows; r++) {
                cellsHTML += '<tr>';
                for (let c = 0; c < cols; c++) {
                    const cellData = (data.cells && data.cells[r] && data.cells[r][c]) || {};
                    const rowspan = cellData.rowspan || 1;
                    const colspan = cellData.colspan || 1;
                    const cellBg = cellData.bg || '';
                    const cellBorder = cellData.border || tblBorderColor;
                    const cellContent = cellData.content || '';
                    const isHeader = cellData.isHeader || false;
                    const tag = isHeader ? 'th' : 'td';
                    const bgAttr = cellBg ? `background-color:${cellBg};` : '';
                    const widthAttr = cellData.width ? `width:${cellData.width};` : '';
                    const heightAttr = cellData.height ? `height:${cellData.height};` : '';
                    if (!cellData.hidden) {
                        const rsAttr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
                        const csAttr = colspan > 1 ? ` colspan="${colspan}"` : '';
                        cellsHTML += `<${tag}${rsAttr}${csAttr} contenteditable="true" style="border:1px solid ${cellBorder};${bgAttr}padding:6px 10px;min-width:60px;min-height:28px;vertical-align:top;word-break:break-word;${widthAttr}${heightAttr}">${cellContent}</${tag}>`;
                    }
                }
                cellsHTML += '</tr>';
            }
            contentHTML = `
    <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div>
    <div class="editable-table-wrap">
        <div class="table-toolbar">
            <button class="tbl-btn" onclick="tableAddRow(this)" title="행 추가"><i class="fa-solid fa-plus"></i> 행</button>
            <button class="tbl-btn" onclick="tableAddCol(this)" title="열 추가"><i class="fa-solid fa-plus"></i> 열</button>
            <button class="tbl-btn tbl-btn-danger" onclick="tableDelRow(this)" title="행 삭제"><i class="fa-solid fa-minus"></i> 행</button>
            <button class="tbl-btn tbl-btn-danger" onclick="tableDelCol(this)" title="열 삭제"><i class="fa-solid fa-minus"></i> 열</button>
            <span class="tbl-sep"></span>
            <button class="tbl-btn" onclick="tableMergeCells(this)" title="셀 합치기"><i class="fa-solid fa-object-group"></i></button>
            <button class="tbl-btn" onclick="tableSplitCell(this)" title="셀 나누기"><i class="fa-solid fa-object-ungroup"></i></button>
            <span class="tbl-sep"></span>
            <label class="tbl-color-label" title="선택 셀 배경색">
                <i class="fa-solid fa-fill-drip"></i>
                <input type="color" class="tbl-cell-bg" value="${tblBgColor}" onchange="tableCellBg(this)">
            </label>
            <label class="tbl-color-label" title="선택 셀 테두리색 (투명 = #000000에서 opacity 0 불가, 투명하려면 아래 투명 버튼 사용)">
                <i class="fa-solid fa-border-all"></i>
                <input type="color" class="tbl-cell-border" value="${tblBorderColor}" onchange="tableCellBorderColor(this)">
                <button type="button" class="tbl-transparent-btn" onclick="event.preventDefault();event.stopPropagation();tableCellBorderNoneFromLabel(this)" title="투명">T</button>
            </label>
            <label class="tbl-color-label" title="표 전체(바깥) 테두리색">
                <i class="fa-solid fa-table"></i>
                <input type="color" class="tbl-all-border" value="${tblOutBorderColor}" onchange="tableOuterBorder(this)">
            </label>
            <span class="tbl-sep"></span>
            <button class="tbl-btn" onclick="tableInsertImage(this)" title="셀에 이미지 추가"><i class="fa-solid fa-image"></i></button>
            <button class="tbl-btn" onclick="tableInsertYoutube(this)" title="셀에 유튜브 추가"><i class="fa-brands fa-youtube"></i></button>
            <button class="tbl-btn" onclick="tableInsertToggle(this)" title="셀에 토글 블록 추가"><i class="fa-solid fa-chevron-right"></i></button>
            <span class="tbl-sep"></span>
            <label class="tbl-color-label" title="표 너비 (데스크탑 기준 %, 모바일에서는 항상 100%)">
                <i class="fa-solid fa-arrows-left-right"></i>
                <input type="number" class="tbl-width-input" min="10" max="100" step="1" value="${tblWidthPercent}" onchange="tableSetWidthPercent(this)">%
            </label>
            <span class="tbl-sep"></span>
            <label class="tbl-color-label" title="선택한 셀이 속한 열의 너비 (%, 표 자체 너비 기준)">
                <i class="fa-solid fa-ruler-horizontal"></i>
                <input type="number" class="tbl-colwidth-input" min="1" max="100" step="1" placeholder="열 너비%" onchange="tableSetColumnWidth(this)">%
            </label>
            <span class="tbl-cell-info"></span>
        </div>
        <div class="table-scroll-wrap">
            <table class="editable-table" data-border-color="${tblBorderColor}" data-bg-color="${tblBgColor}" data-out-border-color="${tblOutBorderColor}" data-width-pct="${tblWidthPercent}" style="border-collapse:collapse;width:100%;border:2px solid ${tblOutBorderColor};">
                ${colgroupHTML}
                <tbody>${cellsHTML}</tbody>
            </table>
        </div>
    </div>`;
            break;
        }
            break;
    }

    block.innerHTML = contentHTML + `<button class="delete-block-btn" onclick="this.parentElement.remove(); debouncedGenerateHTML();"><i class="fa-solid fa-xmark"></i></button>`;
    
    let referenceBlock = null;
    if (!forceAppend) {
        const focusedElement = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.editable-block') : null;
        referenceBlock = (focusedElement && resolveContainerChildBlock(focusedElement, container))
            || (lastSelectedBlock && resolveContainerChildBlock(lastSelectedBlock, container))
            || null;
    }

    if (referenceBlock) {
        referenceBlock.after(block);
    } else {
        container.appendChild(block);
    }
    if (!targetContainer) lastSelectedBlock = block;
    
    const editableContent = block.querySelector('[contenteditable="true"]');
    if(editableContent) {
        editableContent.focus();
    }
    
    const allColorLabels = block.querySelectorAll('.color-display, .quote-color-display');
    allColorLabels.forEach(label => {
        label.addEventListener('click', () => {
            const nextSibling = label.nextElementSibling;
            if (nextSibling && nextSibling.type === 'color') {
                nextSibling.click();
            }
        });
    });

    const quoteColorInput = block.querySelector('.quote-color-picker');
    if (quoteColorInput) {
        quoteColorInput.addEventListener('input', function() {
            const parentBlock = this.closest('.editable-quote, .editable-quote2');
            if (parentBlock) {
                parentBlock.style.borderLeftColor = this.value;
            }
            const label = this.previousElementSibling;
            if (label) {
                label.style.backgroundColor = this.value;
            }
            debouncedGenerateHTML();
        });
    }

    const descCheckbox = block.querySelector('.desc-enabled');
    if (descCheckbox) {
        descCheckbox.addEventListener('change', function() {
            const container = this.closest('.editable-media');
            const table = container.querySelector('.wiki-img-sing tbody');
            const descRow = table.querySelector('.media-description-cell')?.closest('tr');
            const descOptions = this.closest('.description-settings').querySelector('.desc-options');
            
            if (this.checked) {
                if (!descRow) {
                    const borderColor = container.querySelector('.media-border-color').value;
                    const bgColor = container.querySelector('.desc-bg-color').value;
                    const textColor = container.querySelector('.desc-text-color').value;
                    
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `<td class="media-description-cell" contenteditable="true" style="background-color: ${bgColor}; color: ${textColor}; border-color: ${borderColor}; padding: 10px; text-align: center; word-wrap: break-word; white-space: normal; min-height: 20px; vertical-align: top;">설명을 입력하세요</td>`;
                    table.appendChild(newRow);
                }
                descOptions.style.display = 'block';
            } else {
                if (descRow) {
                    descRow.remove();
                }
                descOptions.style.display = 'none';
            }
            debouncedGenerateHTML();
        });
    }

    const descBgColorInput = block.querySelector('.desc-bg-color');
    if (descBgColorInput) {
        descBgColorInput.addEventListener('input', function() {
            const descCell = this.closest('.editable-media').querySelector('.media-description-cell');
            if (descCell) {
                descCell.style.backgroundColor = this.value;
            }
            debouncedGenerateHTML();
        });
        
    }

    const descTextColorInput = block.querySelector('.desc-text-color');
    if (descTextColorInput) {
        descTextColorInput.addEventListener('input', function() {
            const descCell = this.closest('.editable-media').querySelector('.media-description-cell');
            if (descCell) {
                descCell.style.color = this.value;
            }
            debouncedGenerateHTML();
        });
    }

    if (block.dataset.type === 'table') {
        initTableBlock(block);
    }

    const dragHandle = block.querySelector('.block-drag-handle');
    if (dragHandle) {
        dragHandle.addEventListener('mouseenter', () => block.classList.add('keep-handle'));
        dragHandle.addEventListener('mouseleave', () => block.classList.remove('keep-handle'));
    }

    if (block.dataset.type === 'toggle') {
        initToggleContainer(block);
        const toggleColorLabel = block.querySelector('.toggle-btn-color-label');
        const toggleColorInput = block.querySelector('.toggle-btn-color');
        const toggleColorDisplay = block.querySelector('.toggle-btn-color-display');

        const wireResetBtn = (resetBtn) => {
            resetBtn.addEventListener('click', () => {
                toggleColorInput.dataset.custom = 'false';
                if (toggleColorDisplay) {
                    toggleColorDisplay.style.background = 'transparent';
                    toggleColorDisplay.style.borderStyle = 'dashed';
                }
                resetBtn.remove();
                debouncedGenerateHTML();
            });
        };
        const existingResetBtn = block.querySelector('.toggle-btn-color-reset');
        if (existingResetBtn) wireResetBtn(existingResetBtn);

        if (toggleColorLabel && toggleColorInput) {
            toggleColorLabel.addEventListener('click', () => toggleColorInput.click());
            toggleColorInput.addEventListener('input', function() {
                this.dataset.custom = 'true';
                if (toggleColorDisplay) {
                    toggleColorDisplay.style.background = this.value;
                    toggleColorDisplay.style.borderStyle = 'solid';
                }
                if (!block.querySelector('.toggle-btn-color-reset')) {
                    const resetBtn = document.createElement('button');
                    resetBtn.type = 'button';
                    resetBtn.className = 'tbl-transparent-btn toggle-btn-color-reset';
                    resetBtn.title = '버튼 색을 스킨 기본색으로 되돌리기';
                    resetBtn.textContent = '↺';
                    wireResetBtn(resetBtn);
                    toggleColorLabel.after(resetBtn);
                }
                debouncedGenerateHTML();
            });
        }
        if (data.nestedBlocks && data.nestedBlocks.length > 0) {
            const nestedContainer = block.querySelector('.toggle-blocks-container');
            data.nestedBlocks.forEach(nb => addBlock(nb.type, nb, nestedContainer, true));
        } else if (data.content) {
            const nestedContainer = block.querySelector('.toggle-blocks-container');
            addBlock('text', { content: data.content }, nestedContainer, true);
        }
    }

    debouncedGenerateHTML();
}

function generateSingleBlockHTML(block) {
    const type = block.dataset.type;
    switch (type) {
        case 'text': {
            // A <ul>/<ol> from the list toolbar button can't legally live
            // inside a <p>; the browser would silently split the <p> and
            // eject the list (and strip .text1 from anything after it).
            // <div> has no such restriction.
            const content = block.querySelector('.editable-text')?.innerHTML || '';
            return `<div class="text1">${content}</div>\n`;
        }
        case 'quote': {
            const quoteContent = block.querySelector('.quote-content')?.innerHTML || '';
            const quoteColor = block.querySelector('.quote-color-picker')?.value || '#cccccc';
            return `<table class="wiki-quote"><tbody><tr><td class="text1" style="border-left: 5px solid ${quoteColor};">${quoteContent}</td></tr></tbody></table>\n`;
        }
        case 'quote2': {
            const dialog = block.querySelector('.quote2-dialog')?.innerHTML || '';
            const desc = block.querySelector('.quote2-desc')?.innerHTML || '';
            const link = block.querySelector('.quote2-link')?.value.trim() || '';
            const color = block.querySelector('.quote-color-picker')?.value || '#cccccc';
            const linkPart = link ? `<a class="text1" href="${link}" target="_blank">${desc}</a>` : desc;
            return `<table class="wiki-quote"><tbody><tr><td class="text1" style="border-left: 5px solid ${color};">${dialog}<hr />${linkPart}</td></tr></tbody></table>\n`;
        }
        case 'warn': {
            return `<table class="text1" style="border-collapse: collapse; width: 100%; border: 1px solid #dddddd;" data-ke-align="alignLeft"><tbody><tr><td style="width: 100%; border: 1px solid gray; border-top: 5px solid orange; padding: 12px;"><span style="font-size: 1.3em;">이 문서에</span> <a style="color: #0275d8; font-size: 1.3em;" href="https://namu.wiki/w/%EC%8A%A4%ED%8F%AC%EC%9D%BC%EB%9F%AC" target="_blank" rel="noopener">스포일러</a><span style="font-size: 1.3em;">가 포함되어 있습니다.</span><br /><br />이 문서가 설명하는 작품이나 인물 등에 대한 줄거리, 결말, 반전 요소 등을 직·간접적으로 포함하고 있습니다.</td></tr></tbody></table>\n`;
        }
        case 'toggle': {
            const openLabel = block.querySelector('.toggle-open-label')?.innerHTML.trim() || '더보기';
            const closeLabel = block.querySelector('.toggle-close-label')?.innerHTML.trim() || '닫기';
            const btnColorInput = block.querySelector('.toggle-btn-color');
            const btnColor = btnColorInput?.value || '#000000';
            const btnColorCustom = btnColorInput?.dataset.custom === 'true';
            const nestedContainer = block.querySelector('.toggle-blocks-container');
            let nestedHTML = '';
            if (nestedContainer) {
                nestedContainer.querySelectorAll(':scope > .editable-block').forEach(nb => {
                    nestedHTML += generateSingleBlockHTML(nb);
                });
            }
            const escapedOpenLabel = openLabel.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const escapedCloseLabel = closeLabel.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const colorStyle = btnColorCustom ? `color: ${btnColor} !important;` : `color: inherit;`;

            return `<div class="wiki-toggle-wrap text1"><p><a class="wiki-toggle-btn" href="javascript:void(0)" onclick="(function(btn){var w=btn.closest('.wiki-toggle-wrap'); var b=w.querySelector('.wiki-toggle-body'); var isOpen=b.style.display!=='none'; b.style.display=isOpen?'none':'block'; btn.innerHTML=isOpen?btn.dataset.openLabel:btn.dataset.closeLabel;})(this)" data-open-label="${escapedOpenLabel}" data-close-label="${escapedCloseLabel}" style="${colorStyle} text-decoration: none !important; cursor: pointer; font-size: var(--wiki-font-size, 14px); -webkit-text-size-adjust: 100%; text-size-adjust: 100%;">${openLabel}</a></p><div class="wiki-toggle-body" style="display:none; padding-top:8px;">${nestedHTML}</div></div>\n`;
        }
        case 'image': {
            const imgSrc = block.querySelector('.media-url')?.value.trim() || '';
            const imgBorderColor = block.querySelector('.media-border-color')?.value || '#cccccc';
            const imgDescEnabled = block.querySelector('.desc-enabled')?.checked || false;
            const imgDescCell = block.querySelector('.media-description-cell');
            const imgDescription = imgDescCell ? imgDescCell.innerHTML.trim() : '';
            const imgDescBg = block.querySelector('.desc-bg-color')?.value || imgBorderColor;
            const imgDescTextColor = block.querySelector('.desc-text-color')?.value || '#ffffff';
            if (!imgSrc) return '';
            if (imgDescEnabled && imgDescription) {
                return `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${imgBorderColor};"><img src="${imgSrc}"></td></tr><tr><td style="background-color: ${imgDescBg}; color: ${imgDescTextColor}; border-color: ${imgBorderColor}; padding: 5px 10px; text-align: center; word-wrap: break-word; white-space: normal; vertical-align: top; line-height: 1.5;">${imgDescription}</td></tr></tbody></table>\n`;
            } else {
                return `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${imgBorderColor};"><img src="${imgSrc}"></td></tr></tbody></table>\n`;
            }
        }
        case 'youtube': {
            const youtubeSrcRaw = block.querySelector('.media-url')?.value.trim() || '';
            const ytBorderColor = block.querySelector('.media-border-color')?.value || '#cccccc';
            const ytDescEnabled = block.querySelector('.desc-enabled')?.checked || false;
            const ytDescCell = block.querySelector('.media-description-cell');
            const ytDescription = ytDescCell ? ytDescCell.innerHTML.trim() : '';
            const ytDescBg = block.querySelector('.desc-bg-color')?.value || ytBorderColor;
            const ytDescTextColor = block.querySelector('.desc-text-color')?.value || '#ffffff';
            const youtubeEmbedSrc = getYoutubeEmbedUrl(youtubeSrcRaw);
            if (!youtubeEmbedSrc) return '';
            if (ytDescEnabled && ytDescription) {
                return `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${ytBorderColor};"><iframe src="${youtubeEmbedSrc}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameborder="0" allowfullscreen="true"></iframe></td></tr><tr><td style="background-color: ${ytDescBg}; color: ${ytDescTextColor}; border-color: ${ytBorderColor}; padding: 5px 10px; text-align: center; word-wrap: break-word; white-space: normal; vertical-align: top; line-height: 1.5;">${ytDescription}</td></tr></tbody></table>\n`;
            } else {
                return `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${ytBorderColor};"><iframe src="${youtubeEmbedSrc}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameborder="0" allowfullscreen="true"></iframe></td></tr></tbody></table>\n`;
            }
        }
        case 'table': {
            const tbl = block.querySelector('.editable-table');
            if (!tbl) return '';
            const outBorderColor = tbl.dataset.outBorderColor || tbl.dataset.borderColor || '#cccccc';
            const widthPct = parseInt(tbl.dataset.widthPct) || 100;
            const rows = tbl.querySelectorAll('tr');
            let tableHTML = `<table class="wiki-table-scaled" style="--table-width-pct: ${widthPct}%; border-collapse:collapse;table-layout:fixed;margin:1em 0; border: 2px solid ${outBorderColor};">`;
            const colgroupEl = tbl.querySelector('colgroup');
            if (colgroupEl) {
                tableHTML += '<colgroup>';
                Array.from(colgroupEl.children).forEach(col => {
                    tableHTML += col.style.width ? `<col style="width:${col.style.width};">` : '<col>';
                });
                tableHTML += '</colgroup>';
            }
            rows.forEach(row => {
                tableHTML += '<tr>';
                row.querySelectorAll('td, th').forEach(cell => {
                    const tag = cell.tagName.toLowerCase();
                    const rowspan = cell.getAttribute('rowspan') > 1 ? ` rowspan="${cell.getAttribute('rowspan')}"` : '';
                    const colspan = cell.getAttribute('colspan') > 1 ? ` colspan="${cell.getAttribute('colspan')}"` : '';
                    const bg = cell.style.backgroundColor ? `background-color:${cell.style.backgroundColor};` : '';
                    const border = cell.style.borderColor || '#cccccc';
                    const padding = '6px 10px';
                    const width = cell.style.width ? `width:${cell.style.width};` : '';
                    const height = cell.style.height ? `height:${cell.style.height};` : '';
                    tableHTML += `<${tag}${rowspan}${colspan} style="border:1px solid ${border};${bg}padding:${padding};vertical-align:top;word-break:break-word;${width}${height}">${cell.innerHTML}</${tag}>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</table>';
            return tableHTML + '\n';
        }
        default:
            return '';
    }
}

function generateBodyHTML() {
    const blocks = document.querySelectorAll("#editor-container > .editable-block");
    let bodyHTML = "";
    let h1Index = 0, h2Index = 0, h3Index = 0;
    let openDetails = false;

    blocks.forEach(block => {
        const type = block.dataset.type;
        let content = '';

        if (type.startsWith('h')) {
            if (openDetails) {
                bodyHTML += `</details>\n`; 
            }
            const level = type.charAt(1);
            const textHTML = block.querySelector(`[contenteditable]`).innerHTML.trim();
            if(!textHTML) return;
            
            if (level === "1") {
                h1Index++; h2Index = 0; h3Index = 0;
            } else if (level === "2") {
                h2Index++; h3Index = 0;
            } else if (level === "3") {
                h3Index++;
            }
            const indexText = level === "1" ? `${h1Index}.` : (level === "2" ? `${h1Index}.${h2Index}` : `${h1Index}.${h2Index}.${h3Index}`);
            const anchor = `목차${indexText.replace(/\./g, "-")}`;
            const headingClass = `wiki-h${level}`;
            const iconClass = `wiki-h${level}-icon`;

            bodyHTML += `<details open><summary class="text1"><h2 class="${headingClass}"><span style="float: right; color: var(--wiki-link-color); font-size: 0.85rem; margin-top: 0.2em; cursor: pointer; text-decoration: none !important;">[편집]</span><span class="${iconClass}"><ion-icon name="chevron-down-outline"></ion-icon></span> <a name="${anchor}"></a><a href="#목차">${indexText}</a> ${textHTML}</h2></summary>\n`;
            openDetails = true;
        } else {
            if (!openDetails && blocks.length > 0 && !block.previousElementSibling?.dataset.type.startsWith('h')) {
                bodyHTML += `<details open style="display:none;"><summary></summary>\n`;
                openDetails = true;
            }
            bodyHTML += generateSingleBlockHTML(block);
        }
    });

    if (openDetails) {
        bodyHTML += `</details>\n`;
    }
    return bodyHTML;
}

function generateIndexHTML() {
    const blocks = document.querySelectorAll("#editor-container > .editable-block");
    let h1Index = 0, h2Index = 0, h3Index = 0;
    let indexContent = '';

    blocks.forEach(block => {
        const type = block.dataset.type;
        if (type.startsWith('h')) {
            const level = type.charAt(1);
            const textHTML = block.querySelector(`[contenteditable]`).innerHTML.trim();
            if (!textHTML) return;

            if (level === "1") {
                h1Index++; h2Index = 0; h3Index = 0;
            } else if (level === "2") {
                h2Index++; h3Index = 0;
            } else if (level === "3") {
                h3Index++;
            }
            const indexText = level === "1" ? `${h1Index}.` : (level === "2" ? `${h1Index}.${h2Index}` : `${h1Index}.${h2Index}.${h3Index}`);
            const anchor = `목차${indexText.replace(/\./g, "-")}`;
            const indent = level === "1" ? 0 : (level === "2" ? 20 : 40);
            indexContent += `<a style="padding-left: ${indent}px;" href="#${anchor}">${indexText}</a> ${textHTML}<br />\n`;
        }
    });
    
    if(!indexContent) return '';

    return `
        <table class="wiki-index">
        <tbody>
        <tr style="padding: 0 20px;">
        <td style="width: 100%; margin-left: 5px; padding: 12px 20px 18px 20px; line-height: 1.5; position: relative;">
        <div onclick="(function(header){var body=header.closest('td').querySelector('.wiki-index-body');var btn=header.querySelector('button');var isOpen=body.style.display!=='none';body.style.display=isOpen?'none':'block';if(btn)btn.style.transform=isOpen?'rotate(90deg)':'rotate(0deg)';})(this)" style="display: flex; align-items: center; justify-content: space-between; margin-left: -5px; margin-bottom: 4px; cursor: pointer; font-size: .95rem;" title="접기/펼치기">
        <div><a name="목차"></a><span style="font-size: 1.25em;">목차</span></div>
        <button style="background:none;border:none;cursor:pointer;padding:2px 4px;color:#555;transition:transform 0.25s ease;display:flex;align-items:center;"><ion-icon name="chevron-down-outline" style="font-size:1.4em;"></ion-icon></button>
        </div>
        <div class="wiki-index-body" style="font-size: var(--wiki-font-size);">
        ${indexContent}
        </div>
        </td></tr></tbody></table>`;
}

document.getElementById("help-button").addEventListener("click", () => {
  document.getElementById("help-popup").classList.toggle("hidden");
});
document.getElementById("close-help").addEventListener("click", () => {
  document.getElementById("help-popup").classList.add("hidden");
});
document.getElementById("help-popup").addEventListener("click", (e) => {
  if (e.target === document.getElementById("help-popup")) {
    document.getElementById("help-popup").classList.add("hidden");
  }
});

// ── 표(Table) 기능 ────────────────────────────

function tableGetSelectedCells(btn) {
    const wrap = btn.closest('.editable-table-wrap');
    const table = wrap.querySelector('.editable-table');
    const selected = table.querySelectorAll('td.tbl-selected, th.tbl-selected');
    return { wrap, table, selected: Array.from(selected) };
}

function tableUpdateInfo(wrap) {
    const info = wrap.querySelector('.tbl-cell-info');
    const selected = wrap.querySelectorAll('td.tbl-selected, th.tbl-selected');
    if (info) info.textContent = selected.length > 0 ? `${selected.length}셀 선택됨` : '';
}

function tableAddRow(btn) {
    const { table, selected } = tableGetSelectedCells(btn);
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) return;
    const colCount = Array.from(rows[0].querySelectorAll('td, th')).reduce((s, c) => s + (parseInt(c.getAttribute('colspan')) || 1), 0);
    const newRow = document.createElement('tr');
    const borderColor = table.dataset.borderColor || '#cccccc';
    for (let i = 0; i < colCount; i++) {
        const td = document.createElement('td');
        td.setAttribute('contenteditable', 'true');
        td.style.border = `1px solid ${borderColor}`;
        td.style.padding = '6px 10px';
        td.style.minWidth = '60px';
        td.style.verticalAlign = 'top';
        td.style.wordBreak = 'break-word';
        newRow.appendChild(td);
    }
    const targetRow = selected.length > 0 ? selected[selected.length - 1].closest('tr') : null;
    if (targetRow) {
        targetRow.after(newRow);
    } else {
        tbody.appendChild(newRow);
    }
    debouncedGenerateHTML();
}

function tableAddCol(btn) {
    const { table, selected } = tableGetSelectedCells(btn);
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    const borderColor = table.dataset.borderColor || '#cccccc';

    let targetColIndex = -1;
    if (selected.length > 0) {
        const refCell = selected[selected.length - 1];
        const cellsInRefRow = Array.from(refCell.closest('tr').querySelectorAll('td, th'));
        targetColIndex = cellsInRefRow.indexOf(refCell);
    }

    rows.forEach(row => {
        const td = document.createElement('td');
        td.setAttribute('contenteditable', 'true');
        td.style.border = `1px solid ${borderColor}`;
        td.style.padding = '6px 10px';
        td.style.minWidth = '60px';
        td.style.verticalAlign = 'top';
        td.style.wordBreak = 'break-word';

        const cellsInRow = Array.from(row.querySelectorAll('td, th'));
        const refCellInRow = targetColIndex >= 0 ? cellsInRow[targetColIndex] : null;
        if (refCellInRow) {
            refCellInRow.after(td);
        } else {
            row.appendChild(td);
        }
    });

    const colgroup = table.querySelector('colgroup');
    if (colgroup) {
        const newCol = document.createElement('col');
        const refCol = targetColIndex >= 0 ? colgroup.children[targetColIndex] : null;
        if (refCol) {
            refCol.after(newCol);
        } else {
            colgroup.appendChild(newCol);
        }
    }
    debouncedGenerateHTML();
}

function tableDelRow(btn) {
    const { table, selected } = tableGetSelectedCells(btn);
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length <= 1) return;
    const rowsToDelete = new Set();
    selected.forEach(cell => rowsToDelete.add(cell.closest('tr')));
    if (rowsToDelete.size === 0) {
        rowsToDelete.add(rows[rows.length - 1]);
    }
    rowsToDelete.forEach(r => r.remove());
    debouncedGenerateHTML();
}

function tableDelCol(btn) {
    const { table, selected } = tableGetSelectedCells(btn);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0) return;
    const colsToDelete = new Set();
    selected.forEach(cell => {
        const row = cell.closest('tr');
        const cells = Array.from(row.querySelectorAll('td, th'));
        colsToDelete.add(cells.indexOf(cell));
    });
    const colgroup = table.querySelector('colgroup');
    if (colsToDelete.size === 0) {
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length > 1) cells[cells.length - 1].remove();
        });
        if (colgroup && colgroup.lastElementChild) colgroup.lastElementChild.remove();
    } else {
        colsToDelete.forEach(colIdx => {
            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th');
                if (cells[colIdx]) cells[colIdx].remove();
            });
            if (colgroup && colgroup.children[colIdx]) colgroup.children[colIdx].remove();
        });
    }
    debouncedGenerateHTML();
}

function tableMergeCells(btn) {
    const { table, selected } = tableGetSelectedCells(btn);
    if (selected.length < 2) {
        alert('합칠 셀을 2개 이상 선택해주세요. (Ctrl/Cmd + 클릭으로 다중 선택)');
        return;
    }
    const tbody = table.querySelector('tbody');
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    selected.forEach(cell => {
        const r = allRows.indexOf(cell.closest('tr'));
        const cells = Array.from(cell.closest('tr').querySelectorAll('td, th'));
        const c = cells.indexOf(cell);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r + (parseInt(cell.getAttribute('rowspan')) || 1) - 1);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c + (parseInt(cell.getAttribute('colspan')) || 1) - 1);
    });
    const rowspan = maxR - minR + 1;
    const colspan = maxC - minC + 1;
    const firstCell = selected[0];
    const mergedContent = selected.map(c => c.innerHTML).filter(h => h.trim()).join('<br>');
    firstCell.innerHTML = mergedContent;
    firstCell.setAttribute('rowspan', rowspan);
    firstCell.setAttribute('colspan', colspan);
    for (let i = 1; i < selected.length; i++) {
        selected[i].remove();
    }
    firstCell.classList.remove('tbl-selected');
    tableUpdateInfo(firstCell.closest('.editable-table-wrap'));
    debouncedGenerateHTML();
}

function tableSplitCell(btn) {
    const { selected } = tableGetSelectedCells(btn);
    if (selected.length === 0) {
        alert('나눌 셀을 선택해주세요.');
        return;
    }
    selected.forEach(cell => {
        const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
        const colspan = parseInt(cell.getAttribute('colspan')) || 1;
        if (rowspan === 1 && colspan === 1) return;
        const row = cell.closest('tr');
        const tbody = row.closest('tbody');
        const allRows = Array.from(tbody.querySelectorAll('tr'));
        const rowIdx = allRows.indexOf(row);
        for (let c = 1; c < colspan; c++) {
            const newCell = cell.cloneNode(false);
            newCell.removeAttribute('rowspan');
            newCell.removeAttribute('colspan');
            newCell.innerHTML = '';
            cell.after(newCell);
        }
        for (let r = 1; r < rowspan; r++) {
            const targetRow = allRows[rowIdx + r];
            if (targetRow) {
                for (let c = 0; c < colspan; c++) {
                    const newCell = cell.cloneNode(false);
                    newCell.removeAttribute('rowspan');
                    newCell.removeAttribute('colspan');
                    newCell.innerHTML = '';
                    targetRow.appendChild(newCell);
                }
            }
        }
        cell.removeAttribute('rowspan');
        cell.removeAttribute('colspan');
        cell.classList.remove('tbl-selected');
    });
    debouncedGenerateHTML();
}

function tableCellBorderNone(btn) {
    const wrap = btn.closest('.editable-table-wrap');
    const selected = wrap.querySelectorAll('td.tbl-selected, th.tbl-selected');
    if (selected.length === 0) {
        alert('테두리를 투명으로 바꿀 셀을 선택해주세요.');
        return;
    }
    selected.forEach(cell => cell.style.borderColor = 'transparent');
    debouncedGenerateHTML();
}

function tableCellBorderNoneFromLabel(btn) {
    const wrap = btn.closest('.editable-table-wrap');
    const selected = wrap.querySelectorAll('td.tbl-selected, th.tbl-selected');
    if (selected.length === 0) {
        alert('투명으로 바꿀 셀을 먼저 선택해주세요.');
        return;
    }
    selected.forEach(cell => cell.style.borderColor = 'transparent');
    debouncedGenerateHTML();
}

function tableCellBorderColor(input) {
    const wrap = input.closest('.editable-table-wrap');
    const selected = wrap.querySelectorAll('td.tbl-selected, th.tbl-selected');
    if (selected.length === 0) {
        alert('테두리색을 바꿀 셀을 선택해주세요.');
        return;
    }
    selected.forEach(cell => cell.style.borderColor = input.value);
    debouncedGenerateHTML();
}

function tableCellBg(input) {
    const wrap = input.closest('.editable-table-wrap');
    const selected = wrap.querySelectorAll('td.tbl-selected, th.tbl-selected');
    if (selected.length === 0) {
        alert('배경색을 바꿀 셀을 선택해주세요. (셀 클릭 또는 Ctrl+클릭으로 다중 선택)');
        return;
    }
    selected.forEach(cell => cell.style.backgroundColor = input.value);
    debouncedGenerateHTML();
}

function tableCellBorder(input) {
    const wrap = input.closest('.editable-table-wrap');
    const selected = wrap.querySelectorAll('td.tbl-selected, th.tbl-selected');
    if (selected.length === 0) {
        alert('테두리색을 바꿀 셀을 선택해주세요.');
        return;
    }
    selected.forEach(cell => cell.style.borderColor = input.value);
    debouncedGenerateHTML();
}

function tableOuterBorder(input) {
    const wrap = input.closest('.editable-table-wrap');
    const table = wrap.querySelector('.editable-table');
    table.style.border = `2px solid ${input.value}`;
    table.dataset.outBorderColor = input.value;
    debouncedGenerateHTML();
}

function tableSetWidthPercent(input) {
    const wrap = input.closest('.editable-table-wrap');
    const table = wrap.querySelector('.editable-table');
    let pct = parseInt(input.value);
    if (isNaN(pct)) pct = 100;
    pct = Math.min(100, Math.max(10, pct));
    input.value = pct;
    table.dataset.widthPct = pct;
    debouncedGenerateHTML();
}

// Maps every real cell in the table to its logical column, accounting for
// colspan/rowspan (same walk as serializeTableForSave). A raw "Nth cell in
// this row" index breaks the moment any other row has a different real cell
// count - e.g. a colspan=2 image row above a normal 2-column row - so column
// width/lookup needs to go through logical columns instead.
function buildTableCellGrid(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    const rowspanTracker = {};
    return rows.map(row => {
        const cellsInRow = Array.from(row.querySelectorAll('td, th'));
        let c = 0, cellIdx = 0;
        const entries = [];
        while (cellIdx < cellsInRow.length || rowspanTracker[c] > 0) {
            if (rowspanTracker[c] > 0) {
                rowspanTracker[c]--;
                c++;
                continue;
            }
            const cell = cellsInRow[cellIdx];
            if (!cell) break;
            const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
            const colspan = parseInt(cell.getAttribute('colspan')) || 1;
            entries.push({ cell, logicalCol: c, colspan });
            if (rowspan > 1) {
                for (let cc = 0; cc < colspan; cc++) {
                    rowspanTracker[c + cc] = (rowspanTracker[c + cc] || 0) + (rowspan - 1);
                }
            }
            c += colspan;
            cellIdx++;
        }
        return entries;
    });
}

function tableSetColumnWidth(input) {
    const wrap = input.closest('.editable-table-wrap');
    const table = wrap.querySelector('.editable-table');
    const selected = wrap.querySelectorAll('td.tbl-selected, th.tbl-selected');
    if (selected.length === 0) {
        alert('너비를 지정할 셀을 먼저 선택해주세요.');
        input.value = '';
        return;
    }

    let pct = parseFloat(input.value);
    if (isNaN(pct) || pct <= 0) {
        input.value = '';
        return;
    }
    pct = Math.min(100, pct);
    input.value = pct;

    const refCell = selected[selected.length - 1];
    const grid = buildTableCellGrid(table);

    let targetLogicalCol = null;
    for (const row of grid) {
        const entry = row.find(e => e.cell === refCell);
        if (entry) { targetLogicalCol = entry.logicalCol; break; }
    }
    if (targetLogicalCol === null) return;

    // table-layout:fixed only reads column widths from <col> elements (or the
    // FIRST row's cells) - a merged cell in an earlier row (e.g. an image
    // spanning both columns) makes any width set on a later row's cells get
    // silently ignored by the browser. A <colgroup> controls column width
    // independent of which row has merges, so that's the only reliable way.
    let colgroup = table.querySelector('colgroup');
    if (!colgroup) {
        colgroup = document.createElement('colgroup');
        table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length <= targetLogicalCol) {
        colgroup.appendChild(document.createElement('col'));
    }
    colgroup.children[targetLogicalCol].style.width = pct + '%';
    debouncedGenerateHTML();
}

function tableToggleHeader(btn) {
    const { table, selected } = tableGetSelectedCells(btn);
    if (selected.length === 0) {
        alert('헤더(제목)로 토글할 셀을 선택해주세요.');
        return;
    }
    selected.forEach(cell => {
        const isHeader = cell.tagName === 'TH';
        const newTag = isHeader ? 'td' : 'th';
        const newCell = document.createElement(newTag);
        newCell.innerHTML = cell.innerHTML;
        Array.from(cell.attributes).forEach(attr => newCell.setAttribute(attr.name, attr.value));
        
        if (!isHeader) {
            newCell.style.fontWeight = 'bold';
            newCell.style.textAlign = 'center';
            if (!newCell.style.backgroundColor || newCell.style.backgroundColor === table.dataset.bgColor || newCell.style.backgroundColor === 'rgb(255, 255, 255)') {
                newCell.style.backgroundColor = '#f0f0f0';
            }
        } else {
            newCell.style.fontWeight = 'normal';
            newCell.style.textAlign = 'left';
            if (newCell.style.backgroundColor === 'rgb(240, 240, 240)' || newCell.style.backgroundColor === '#f0f0f0') {
                newCell.style.backgroundColor = table.dataset.bgColor || '#ffffff';
            }
        }
        cell.replaceWith(newCell);
        newCell.classList.add('tbl-selected');
    });
    debouncedGenerateHTML();
}

function tableInsertImage(btn) {
    const { selected } = tableGetSelectedCells(btn);
    if (selected.length === 0) {
        alert('이미지를 넣을 셀을 먼저 선택해주세요.');
        return;
    }
    const url = prompt('이미지 URL을 입력하세요:');
    if (!url) return;
    const imgHTML = `<img src="${url}" style="max-width:100%; height:auto; display:block; margin:auto;" />`;
    selected[0].focus();
    document.execCommand('insertHTML', false, imgHTML);
    debouncedGenerateHTML();
}

function tableInsertToggle(btn) {
    const { selected } = tableGetSelectedCells(btn);
    if (selected.length === 0) {
        alert('토글을 넣을 셀을 먼저 선택해주세요.');
        return;
    }
    const cell = selected[0];
    const openLabel = prompt('열릴 때 문구를 입력하세요:', '더보기');
    if (openLabel === null) return;
    const closeLabel = prompt('닫힐 때 문구를 입력하세요:', '닫기');
    if (closeLabel === null) return;
    const toggleHtml = `<span class="wiki-toggle-wrap"><a class="wiki-toggle-btn" href="javascript:void(0)" onclick="(function(btn){var w=btn.closest('.wiki-toggle-wrap'); var b=w.querySelector('.wiki-toggle-body'); var isOpen=b.style.display!=='none'; b.style.display=isOpen?'none':'block'; btn.innerHTML=isOpen?btn.dataset.openLabel:btn.dataset.closeLabel;})(this)" data-open-label="${openLabel.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" data-close-label="${closeLabel.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" style="color: inherit !important; text-decoration: none !important; cursor: pointer;">${openLabel}</a><div class="wiki-toggle-body" style="display:none; padding-top:4px;"><br></div></span>`;
    cell.focus();
    document.execCommand('insertHTML', false, toggleHtml);
    debouncedGenerateHTML();
}

function tableInsertYoutube(btn) {
    const { selected } = tableGetSelectedCells(btn);
    if (selected.length === 0) {
        alert('유튜브를 넣을 셀을 먼저 선택해주세요.');
        return;
    }
    const url = prompt('유튜브 ID를 입력하세요:');
    if (!url) return;
    const embedUrl = getYoutubeEmbedUrl(url);
    if (!embedUrl) {
        alert('유효하지 않은 유튜브 주소입니다.');
        return;
    }
    const ytHTML = `<iframe src="${embedUrl}" style="max-width:100%; aspect-ratio:16/9; display:block; margin:auto;" frameborder="0" allowfullscreen="true"></iframe><br>`;
    selected[0].focus();
    document.execCommand('insertHTML', false, ytHTML);
    debouncedGenerateHTML();
}

function tableCellClick(e) {
    const cell = e.target.closest('td, th');
    if (!cell) return;
    const wrap = cell.closest('.editable-table-wrap');
    if (!wrap) return;
    if (e.ctrlKey || e.metaKey) {
        cell.classList.toggle('tbl-selected');
    } else if (e.shiftKey) {
        cell.classList.add('tbl-selected');
    } else {
        wrap.querySelectorAll('.tbl-selected').forEach(c => {
            if (c !== cell) c.classList.remove('tbl-selected');
        });
        cell.classList.add('tbl-selected');
    }
    tableUpdateInfo(wrap);
}

function setupTableResizer(table) {
    let resizingCol = null;
    let resizingRow = null;
    let startX, startY, startW, startH;

    table.addEventListener('mousemove', function(e) {
        if (resizingCol || resizingRow) return;
        const cell = e.target.closest('td, th');
        if (!cell || !table.contains(cell)) return;
        const rect = cell.getBoundingClientRect();
        const isNearRight = (rect.right - e.clientX) < 8;
        const isNearBottom = (rect.bottom - e.clientY) < 8;
        
        if (isNearRight && isNearBottom) {
            cell.style.cursor = 'nwse-resize';
        } else if (isNearRight) {
            cell.style.cursor = 'col-resize';
        } else if (isNearBottom) {
            cell.style.cursor = 'row-resize';
        } else {
            cell.style.cursor = 'text';
        }
    });

    table.addEventListener('mousedown', function(e) {
        const cell = e.target.closest('td, th');
        if (!cell || !table.contains(cell)) return;
        const rect = cell.getBoundingClientRect();
        const isNearRight = (rect.right - e.clientX) < 8;
        const isNearBottom = (rect.bottom - e.clientY) < 8;
        
        if (isNearRight) {
            const firstRow = table.querySelector('tr');
            if (firstRow) {
                Array.from(firstRow.querySelectorAll('td, th')).forEach(c => {
                    if (!c.style.width) {
                        c.style.width = c.offsetWidth + 'px';
                    }
                    c.style.minWidth = '20px';
                });
            }
            table.style.tableLayout = 'fixed';
            resizingCol = cell;
            startX = e.clientX;
            startW = cell.offsetWidth;
        }
        if (isNearBottom) {
            resizingRow = cell;
            startY = e.clientY;
            startH = cell.offsetHeight;
        }
        if (resizingCol || resizingRow) {
            e.preventDefault();
            e.stopPropagation();
            document.body.style.userSelect = 'none';
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (resizingCol) {
            const newW = Math.max(20, startW + (e.clientX - startX));
            resizingCol.style.width = newW + 'px';
            resizingCol.style.minWidth = '20px';
        }
        if (resizingRow) {
            const newH = Math.max(20, startH + (e.clientY - startY));
            resizingRow.style.height = newH + 'px';
        }
    });

    document.addEventListener('mouseup', function() {
        if (resizingCol || resizingRow) {
            resizingCol = null;
            resizingRow = null;
            document.body.style.userSelect = '';
            debouncedGenerateHTML();
        }
    });
}

function initToggleContainer(toggleBlock) {
    const container = toggleBlock.querySelector('.toggle-blocks-container');
    if (!container) return;
    new Sortable(container, {
        animation: 150,
        handle: ".editable-block",
        filter: '[contenteditable="true"], input, textarea, button, label, select, .tbl-btn, .tbl-color-label, .delete-block-btn, .toggle-mini-toolbar, .table-toolbar, .table-scroll-wrap, .description-settings, .color-picker-wrapper, .quote2-link, .toggle-label-row',
        preventOnFilter: true,
        group: { name: 'editor-blocks', pull: true, put: true },
        scroll: true,
        scrollSensitivity: 80,
        scrollSpeed: 15,
        onEnd: debouncedGenerateHTML
    });
}

function addNestedBlock(btn, type) {
    const toggleBlock = btn.closest('.editable-block');
    const nestedContainer = toggleBlock ? toggleBlock.querySelector('.toggle-blocks-container') : null;
    if (!nestedContainer) return;
    addBlock(type, {}, nestedContainer);
}

function initTableBlock(block) {
    const table = block.querySelector('.editable-table');
    if (!table) return;
    table.addEventListener('click', tableCellClick);
    setupTableResizer(table);
}

// Serializes a table's actual DOM cells into a full logical rows x cols grid,
// with {hidden:true} placeholders at positions covered by an earlier cell's
// rowspan/colspan. A flat "one entry per actual <td>" list breaks as soon as
// any cell is merged, since a merged row has fewer real <td>s than the
// table's true column count - loading that back would silently drop columns.
function serializeTableForSave(tbl) {
    const borderColor = tbl.dataset.borderColor || '#cccccc';
    const outBorderColor = tbl.dataset.outBorderColor || borderColor;
    const bgColor = tbl.dataset.bgColor || '#ffffff';
    const widthPercent = parseInt(tbl.dataset.widthPct) || 100;

    const rowEls = Array.from(tbl.querySelectorAll('tr'));
    const grid = [];
    const rowspanTracker = {};

    rowEls.forEach((row, r) => {
        grid[r] = [];
        const cellsInRow = Array.from(row.querySelectorAll('td, th'));
        let c = 0, cellIdx = 0;
        while (cellIdx < cellsInRow.length || rowspanTracker[c] > 0) {
            if (rowspanTracker[c] > 0) {
                grid[r][c] = { hidden: true };
                rowspanTracker[c]--;
                c++;
                continue;
            }
            const cell = cellsInRow[cellIdx];
            if (!cell) break;
            const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
            const colspan = parseInt(cell.getAttribute('colspan')) || 1;
            grid[r][c] = {
                content: cell.innerHTML,
                bg: cell.style.backgroundColor || '',
                border: cell.style.borderColor || borderColor,
                rowspan,
                colspan,
                isHeader: cell.tagName === 'TH',
                width: cell.style.width || '',
                height: cell.style.height || ''
            };
            for (let cc = 1; cc < colspan; cc++) {
                grid[r][c + cc] = { hidden: true };
            }
            if (rowspan > 1) {
                for (let cc = 0; cc < colspan; cc++) {
                    rowspanTracker[c + cc] = (rowspanTracker[c + cc] || 0) + (rowspan - 1);
                }
            }
            c += colspan;
            cellIdx++;
        }
    });

    const cols = grid.reduce((max, row) => Math.max(max, row.length), 0) || 1;

    const colgroup = tbl.querySelector('colgroup');
    const colWidths = colgroup ? Array.from(colgroup.children).map(col => col.style.width || '') : [];

    return { borderColor, outBorderColor, bgColor, widthPercent, colWidths, cells: grid, rows: grid.length, cols };
}

function saveData() {
  const data = {
    mainColor: document.getElementById("mainColorPicker").value,
    showDocTitle: document.getElementById("showDocTitle")?.checked ?? true,
    docTitle: document.getElementById("docTitle")?.value || "",
    charName: document.getElementById("charName").value,
    jpSurname: document.getElementById("jpSurname").value,
    jpSurnameFurigana: document.getElementById("jpSurnameFurigana").value,
    jpName: document.getElementById("jpName").value,
    jpNameFurigana: document.getElementById("jpNameFurigana").value,
    enName: document.getElementById("enName").value,
    imageUrl: document.getElementById("imageUrl").value,
    copyright: document.getElementById("copyright").value,
    categories: Array.from(document.querySelectorAll("#category-list .category-row")).map(row => ({
        text: row.querySelector(".cat-text").value,
        link: row.querySelector(".cat-link").value
    })),
    fields: Array.from(document.querySelectorAll(".field-row")).map(row => ({
      name: row.querySelector(".field-name").value,
      value: (() => { const v = row.querySelector(".field-value"); return v ? (v.tagName === 'INPUT' ? v.value : v.innerHTML) : ''; })()
    })),
    bodyContent: Array.from(document.querySelectorAll("#editor-container > .editable-block")).map(block => {
        const type = block.dataset.type;
        const item = { type };
        switch (type) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'text':
                item.content = block.querySelector('[contenteditable]').innerHTML;
                break;
            case 'quote':
                item.content = block.querySelector('.quote-content').innerHTML;
                item.color = block.querySelector('.quote-color-picker').value;
                break;
            case 'quote2':
                item.dialog = block.querySelector('.quote2-dialog').innerHTML;
                item.desc = block.querySelector('.quote2-desc').innerHTML;
                item.link = block.querySelector('.quote2-link').value;
                item.color = block.querySelector('.quote-color-picker').value;
                break;
            case 'warn':
                break;
            case 'toggle': {
                item.openLabel = block.querySelector('.toggle-open-label')?.innerHTML.trim() || '';
                item.closeLabel = block.querySelector('.toggle-close-label')?.innerHTML.trim() || '';
                item.btnColor = block.querySelector('.toggle-btn-color')?.value || '#000000';
                item.btnColorCustom = block.querySelector('.toggle-btn-color')?.dataset.custom === 'true';
                const nestedContainer = block.querySelector('.toggle-blocks-container');
                item.nestedBlocks = [];
                if (nestedContainer) {
                    nestedContainer.querySelectorAll(':scope > .editable-block').forEach(nb => {
                        const nbType = nb.dataset.type;
                        const nbItem = { type: nbType };
                        switch (nbType) {
                            case 'h1': case 'h2': case 'h3': case 'text':
                                nbItem.content = nb.querySelector('[contenteditable]')?.innerHTML || '';
                                break;
                            case 'quote':
                                nbItem.content = nb.querySelector('.quote-content')?.innerHTML || '';
                                nbItem.color = nb.querySelector('.quote-color-picker')?.value || '';
                                break;
                            case 'quote2':
                                nbItem.dialog = nb.querySelector('.quote2-dialog')?.innerHTML || '';
                                nbItem.desc = nb.querySelector('.quote2-desc')?.innerHTML || '';
                                nbItem.link = nb.querySelector('.quote2-link')?.value || '';
                                nbItem.color = nb.querySelector('.quote-color-picker')?.value || '';
                                break;
                            case 'image': case 'youtube':
                                nbItem.url = nb.querySelector('.media-url')?.value || '';
                                nbItem.borderColor = nb.querySelector('.media-border-color')?.value || '';
                                nbItem.hasDescription = nb.querySelector('.desc-enabled')?.checked || false;
                                nbItem.description = nb.querySelector('.media-description-cell')?.innerHTML || '';
                                nbItem.descriptionBg = nb.querySelector('.desc-bg-color')?.value || '';
                                nbItem.descriptionTextColor = nb.querySelector('.desc-text-color')?.value || '';
                                break;
                            case 'table': {
                                const tbl = nb.querySelector('.editable-table');
                                if (tbl) {
                                    Object.assign(nbItem, serializeTableForSave(tbl));
                                }
                                break;
                            }
                        }
                        item.nestedBlocks.push(nbItem);
                    });
                }
                break;
            }
            case 'image':
            case 'youtube':
                item.url = block.querySelector('.media-url').value;
                item.borderColor = block.querySelector('.media-border-color').value;
                item.hasDescription = block.querySelector('.desc-enabled')?.checked || false;
                const descCell = block.querySelector('.media-description-cell');
                item.description = descCell ? descCell.innerHTML : '';
                item.descriptionBg = block.querySelector('.desc-bg-color')?.value || item.borderColor;
                item.descriptionTextColor = block.querySelector('.desc-text-color')?.value || '#ffffff';
                break;
            case 'table': {
                const tbl = block.querySelector('.editable-table');
                if (tbl) {
                    Object.assign(item, serializeTableForSave(tbl));
                }
                break;
            }
        }
        return item;
    })
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const charName = document.getElementById("charName").value.trim() || "profile";
  a.href = url;
  a.download = `${charName}_data.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);

    if (data.mainColor) {
      document.getElementById("mainColorPicker").value = data.mainColor;
      document.querySelector(".color-display").style.backgroundColor = data.mainColor;
    }

    if (data.showDocTitle !== undefined) {
        const checkbox = document.getElementById("showDocTitle");
        if(checkbox) checkbox.checked = data.showDocTitle;
    }

    const docTitleInput = document.getElementById("docTitle");
    if(docTitleInput) docTitleInput.value = data.docTitle || "";

    document.getElementById("charName").value = data.charName || "";
    document.getElementById("jpSurname").value = data.jpSurname || "";
    document.getElementById("jpSurnameFurigana").value = data.jpSurnameFurigana || "";
    document.getElementById("jpName").value = data.jpName || "";
    document.getElementById("jpNameFurigana").value = data.jpNameFurigana || "";
    document.getElementById("enName").value = data.enName || "";
    document.getElementById("imageUrl").value = data.imageUrl || "";
    document.getElementById("copyright").value = data.copyright || "";

    const catList = document.getElementById("category-list");
    if(catList) {
        catList.innerHTML = "";
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(cat => addCategoryRow(cat.text, cat.link));
        } else if (data.categoryText) {
            addCategoryRow(data.categoryText, data.categoryLink);
        } else {
            addCategoryRow(); 
        }
    }

    const fieldList = document.getElementById("field-list");
    fieldList.innerHTML = "";
    (data.fields || []).forEach(item => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.innerHTML = `
        <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
        <input class="field-name" value="${item.name}" placeholder="항목명" />
        <div class="field-value" contenteditable="true" data-placeholder="내용">${item.value || ''}</div>
      `;
      fieldList.appendChild(row);
    });

    const editorContainer = document.getElementById("editor-container");
    editorContainer.innerHTML = "";
    if (data.bodyContent && data.bodyContent.length > 0) {
        data.bodyContent.forEach(item => {
            addBlock(item.type, item, null, true);
        });
    }

    debouncedGenerateHTML();
  };
  
  reader.readAsText(file);
  event.target.value = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const inputSection = document.getElementById('input-section');
    const header = document.querySelector('.input-header');
    const toolbar = document.getElementById('body-toolbar');
    
    let lastScrollTop = 0;
    const delta = 5; 

    inputSection.addEventListener('scroll', () => {
        const currentScrollTop = inputSection.scrollTop;

        if (currentScrollTop > 10) {
            toolbar.classList.add('scrolled');
        } else {
            toolbar.classList.remove('scrolled');
        }
        
        if (Math.abs(lastScrollTop - currentScrollTop) <= delta) return;

        if (currentScrollTop > lastScrollTop && currentScrollTop > 60) {
            header.classList.add('hide');
            if(toolbar) toolbar.classList.add('move-up');
        } 
        else {
            header.classList.remove('hide');
            if(toolbar) toolbar.classList.remove('move-up');
        }

        lastScrollTop = currentScrollTop;
    });
});

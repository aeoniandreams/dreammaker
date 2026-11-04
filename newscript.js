// WIKIMAKER_BUILD: 2026-08-13-1 (list bullets, name text color, pre-heading blocks)
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
    buildInfoEditor();
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
    const colorDisplay = colorPicker.closest('label').querySelector(".color-display");

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

function getFormattedTime() {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function generateHTML() {
  const color = document.getElementById("mainColorPicker").value;

  const showDocTitle = document.getElementById("showDocTitle")?.checked;
  const docTitleInput = document.getElementById("docTitle")?.value.trim();
  const finalTitle = docTitleInput || infoFallbackTitle();

  let titleTimeHTML = "";
  if (showDocTitle && finalTitle) {
      titleTimeHTML = `
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 32px; font-weight: 700; line-height: 1.2 !important; margin: 0 !important; padding: 0 !important;">${finalTitle}</h1>
        <div style="font-size: 14.4px; line-height: 1.5 !important; margin: 0 !important; padding: 8px 0 0 !important; color: inherit; opacity: 0.7;">최근 수정 시각: <time>${getFormattedTime()}</time></div>
      </div>`;
  }
  const infoTableHTML = generateInfoTableHTML();

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
    font-weight: 400;
    letter-spacing: normal;
    font-variant-numeric: normal;
    font-feature-settings: normal;
    font-variation-settings: normal;
}

/* 블로그 스킨이 링크·표 칸·문단 등에 따로 지정한 굵기, 자간, 글꼴이 이 글을 덮어쓰지 않도록,
   바깥 상자의 값을 그대로 따르게 한다. (굵게/제목/표 머리글은 원래 굵기를 유지하려고 뺐다.) */
#wikiwrap a,
#wikiwrap time,
#wikiwrap span,
#wikiwrap div,
#wikiwrap p,
#wikiwrap td,
#wikiwrap li,
#wikiwrap summary,
#wikiwrap ruby,
#wikiwrap rt {
    font-family: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    font-variant-numeric: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
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
    border: 2px solid var(--wiki-border-color);
    font-size: 0.96em;
    line-height: var(--wiki-line-height);
    margin: 20px 0 16px;
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
    ${infoTableHTML}
    ${indexHTML}
  </div>
  ${bodyHTML}
</div>
`.trim();

    rawHTML = inlineListStyles(rawHTML);
    const processedData = processFootnotes(rawHTML);
    const fullHTML = processedData.html;

    document.getElementById("output").value = fullHTML;
    document.getElementById("preview").innerHTML = fullHTML; 
    
    updatePreviewColor(color);
}

// Tistory's HTML-mode sanitizer can strip the <style> block on save, which
// would silently drop the #wikiwrap ul/ol/li rules (list-style-type etc.)
// and leave the site's own theme reset (many blog themes zero out list
// bullets globally) in sole control. Bake the same rules on as inline
// styles too, so the bullets still show even if the <style> block is gone.
function inlineListStyles(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.querySelectorAll('ul').forEach(el => {
        el.style.setProperty('padding-left', '1.4em');
        el.style.setProperty('margin', '0.4em 0');
        el.style.setProperty('list-style-position', 'outside');
        el.style.setProperty('list-style-type', 'disc');
        el.style.setProperty('color', 'inherit');
    });
    container.querySelectorAll('ol').forEach(el => {
        el.style.setProperty('padding-left', '1.4em');
        el.style.setProperty('margin', '0.4em 0');
        el.style.setProperty('list-style-position', 'outside');
        el.style.setProperty('list-style-type', 'decimal');
        el.style.setProperty('color', 'inherit');
    });
    container.querySelectorAll('li').forEach(el => {
        el.style.setProperty('margin', '0.2em 0');
        el.style.setProperty('color', 'inherit');
    });
    return container.innerHTML;
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

    const infoEditor = document.getElementById('info-editor');

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
        if (infoEditor && infoEditor.contains(range.commonAncestorContainer)) {
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
    stripAutoInjectedFontSize(document.getElementById('info-editor'));
    saveBasicRange();
    debouncedGenerateHTML();
}

// Chrome's justify/list commands wrap the selection in a new block element
// and, to keep the visible size unchanged across that restructuring, copy
// the selection's current computed font-size back in as an inline style —
// using whatever unit the matched CSS rule was written in (rem/em, since
// our own editor-only styling uses those). That editor-only size then gets
// baked into the saved innerHTML and leaks into the exported HTML, where it
// resolves against a different font-size context than the editor did. We
// never set font-size in rem/em ourselves (only px, via the size stepper),
// so any bare rem/em value found here is that browser artifact and safe to
// strip, letting the element inherit its size normally again.
function stripAutoInjectedFontSize(container) {
    if (!container) return;
    container.querySelectorAll('[style*="font-size"]').forEach(el => {
        const fs = el.style.fontSize;
        if (fs && /^[\d.]+(rem|em)$/i.test(fs.trim())) {
            el.style.removeProperty('font-size');
            if (el.getAttribute('style') === '') el.removeAttribute('style');
        }
    });
}

function bodyExec(cmd) {
    document.execCommand(cmd);
    stripAutoInjectedFontSize(document.getElementById('editor-container'));
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
    }
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

    const scopeEl = isBasic ? document.getElementById('info-editor') : document.getElementById('editor-container');
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

// ── 캐릭터 정보 표 ─────────────────────────────
// 기본정보 탭의 정보 표는 본문의 표 블록과 같은 편집기를 쓴다. 레이아웃과 내용을 모두 직접 편집한다.
const INFO_BORDER_COLOR = '#dddddd';
const INFO_GRAY = '#eeeeee';

// 기본 템플릿: 2칸 x 10줄. 1~2줄은 한 칸으로 합쳐지고, 3줄부터 3:7로 나뉘며,
// 합쳐진 칸과 3줄부터의 왼쪽 칸은 옅은 회색이다.
function defaultInfoTableData() {
    const cell = extra => Object.assign({ content: '', bg: '', border: INFO_BORDER_COLOR, rowspan: 1, colspan: 1, isHeader: false, width: '', height: '' }, extra);
    const cells = [];
    for (let r = 0; r < 10; r++) {
        cells.push(r < 2 ? [cell({ colspan: 2, bg: INFO_GRAY }), { hidden: true }] : [cell({ bg: INFO_GRAY }), cell({})]);
    }
    return { borderColor: INFO_BORDER_COLOR, outBorderColor: '', bgColor: '#ffffff', widthPercent: 100, colWidths: ['30%', '70%'], cells, rows: 10, cols: 2 };
}

// 예전 저장 파일/코드(이름·이미지·상세 프로필 입력칸 방식)를 같은 모양의 표로 옮긴다.
function legacyToInfoTable(d) {
    const main = d.mainColor || '#8d27ae';
    const txt = d.nameTextColor || '#ffffff';
    let ruby = '';
    if (d.jpSurname || d.jpName) {
        ruby += d.jpSurname ? `<ruby>${d.jpSurname}<rt>${d.jpSurnameFurigana || ''}</rt></ruby>` : '';
        ruby += d.jpSurname && d.jpName ? ' ' : '';
        ruby += d.jpName ? `<ruby>${d.jpName}<rt>${d.jpNameFurigana || ''}</rt></ruby>` : '';
    }
    let pipe = '';
    if ((d.jpSurname || d.jpName) && d.enName) pipe = ` ｜ ${d.enName}`;
    else if (!d.jpSurname && !d.jpName && d.enName) pipe = d.enName;

    const center = (html, color) => `<div style="text-align: center;${color ? ` color: ${color};` : ''}">${html}</div>`;
    const base = { border: INFO_BORDER_COLOR, rowspan: 1, colspan: 1, isHeader: false, width: '', height: '' };
    const rows = [];
    rows.push([Object.assign({}, base, { colspan: 2, bg: main, content: center(`<b><span style="font-size: 20px;">${d.charName || ''}</span></b><br><b><span style="font-size: 13px;">${ruby}${pipe}</span></b>`, txt) }), { hidden: true }]);
    rows.push([Object.assign({}, base, { colspan: 2, content: d.imageUrl ? `<img src="${d.imageUrl}" style="max-width:100%; height:auto; display:block; margin:auto;">` : '' }), { hidden: true }]);
    if (d.copyright) rows.push([Object.assign({}, base, { colspan: 2, content: center(d.copyright) }), { hidden: true }]);
    (d.fields || []).forEach(f => {
        if (f.name && f.value) rows.push([Object.assign({}, base, { bg: main, content: center(f.name, txt) }), Object.assign({}, base, { content: f.value })]);
    });
    return { borderColor: INFO_BORDER_COLOR, outBorderColor: '', bgColor: '#ffffff', widthPercent: 100, colWidths: ['30%', '70%'], cells: rows, rows: rows.length, cols: 2 };
}

function buildInfoEditor(infoData) {
    const host = document.getElementById('info-editor');
    const d = infoData && infoData.cells ? infoData : defaultInfoTableData();
    host.innerHTML = buildTableWrapHTML(d, d.rows || d.cells.length, d.cols || 2, { info: true });
    initTableBlock(host);
    basicSavedRange = null;
}

// 문서 제목을 비워 뒀을 때 쓰는 이름: 정보 표 첫 칸의 첫 줄(윗주 제외).
function infoFallbackTitle() {
    const cell = document.querySelector('#info-editor .editable-table td, #info-editor .editable-table th');
    return cell ? firstLineText(cell.innerHTML) : '';
}

function firstLineText(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('rt, script, style').forEach(n => n.remove());
    tmp.querySelectorAll('br, div, p').forEach(n => n.before('\n'));
    return tmp.textContent.replace(/\u00a0/g, ' ').split('\n').map(s => s.trim()).find(Boolean) || '';
}

function generateInfoTableHTML() {
    const tbl = document.querySelector('#info-editor .editable-table');
    if (!tbl) return '';
    // 바깥 테두리를 따로 정하지 않았다면 안쪽 테두리와 같은 색을 쓴다.
    const outer = tbl.dataset.outBorderColor || tbl.dataset.borderColor || INFO_BORDER_COLOR;
    return tableOutputHTML(tbl, `<table class="wiki-main-table" style="table-layout: fixed; border: 2px solid ${outer};">`);
}

// 정보 표 상단바: 캐럿 위치(또는 선택한 글)에 넣는 기능들
function infoNeedCaret() {
    if (basicSavedRange) return true;
    alert('넣을 칸을 먼저 클릭해주세요.');
    return false;
}

function basicInsertWarn() {
    if (!infoNeedCaret()) return;
    // 표 안에 표를 만들면 표 편집이 꼬이므로, 스포일러 주의 상자는 <div>로 넣는다.
    const html = `<div class="text1" style="border: 1px solid gray; border-top: 5px solid orange; padding: 12px; margin: 4px 0;"><span style="font-size: 1.3em;">이 문서에</span> <a style="color: #0275d8; font-size: 1.3em;" href="https://namu.wiki/w/%EC%8A%A4%ED%8F%AC%EC%9D%BC%EB%9F%AC" target="_blank" rel="noopener">스포일러</a><span style="font-size: 1.3em;">가 포함되어 있습니다.</span><br><br>이 문서가 설명하는 작품이나 인물 등에 대한 줄거리, 결말, 반전 요소 등을 직·간접적으로 포함하고 있습니다.</div><br>`;
    restoreBasicRange();
    document.execCommand('insertHTML', false, html);
    saveBasicRange();
    debouncedGenerateHTML();
}

function basicInsertImage() {
    if (!infoNeedCaret()) return;
    const url = prompt('이미지 URL을 입력하세요:');
    if (!url) return;
    restoreBasicRange();
    document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%; height:auto; display:block; margin:auto;" />`);
    saveBasicRange();
    debouncedGenerateHTML();
}

function basicInsertYoutube() {
    if (!infoNeedCaret()) return;
    const url = prompt('유튜브 ID 또는 주소를 입력하세요:');
    if (!url) return;
    const embedUrl = getYoutubeEmbedUrl(url);
    if (!embedUrl) {
        alert('유효하지 않은 유튜브 주소입니다.');
        return;
    }
    restoreBasicRange();
    document.execCommand('insertHTML', false, `<iframe src="${embedUrl}" style="max-width:100%; aspect-ratio:16/9; display:block; margin:auto;" frameborder="0" allowfullscreen="true"></iframe><br>`);
    saveBasicRange();
    debouncedGenerateHTML();
}

// 윗주: 드래그해 둔 글자 위에 작은 글씨를 올린다(<ruby>).
function applyRuby() {
    if (!basicSavedRange || basicSavedRange.collapsed) {
        alert('윗주를 달 글자를 먼저 선택(드래그)해주세요.');
        return;
    }
    const rt = prompt('윗주로 표시할 내용을 입력하세요:', '');
    if (!rt) return;
    restoreBasicRange();
    const range = window.getSelection().getRangeAt(0);
    const tmp = document.createElement('div');
    tmp.appendChild(range.cloneContents());
    // 이미 윗주가 달린 글자를 다시 선택했다면 이전 윗주는 걷어낸다.
    tmp.querySelectorAll('rt').forEach(n => n.remove());
    tmp.querySelectorAll('ruby').forEach(n => n.replaceWith(...n.childNodes));
    const safeRt = rt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    document.execCommand('insertHTML', false, `<ruby>${tmp.innerHTML}<rt>${safeRt}</rt></ruby>`);
    saveBasicRange();
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

// 표 편집기(툴바 + 표) HTML. 본문의 표 블록과 캐릭터 정보 표가 함께 쓴다.
// opts.info: 캐릭터 정보 표용 — 이미지/유튜브/토글 버튼(상단바에 있음)과 표 너비 입력을 빼고,
// 바깥 테두리색을 따로 지정하지 않았다면 테마 색상을 따르게 둔다.
function buildTableWrapHTML(data, rows, cols, opts = {}) {
    const info = !!opts.info;
    const tblBorderColor = data.borderColor || '#cccccc';
    const tblOutBorderColor = data.outBorderColor || tblBorderColor;
    const outBorderAttr = (!info || data.outBorderColor) ? ` data-out-border-color="${tblOutBorderColor}"` : '';
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
                cellsHTML += `<${tag}${rsAttr}${csAttr} contenteditable="true" style="border:1px solid ${cellBorder};${bgAttr}padding:6px 10px;min-width:60px;min-height:28px;vertical-align:middle;word-break:break-word;${widthAttr}${heightAttr}">${cellContent}</${tag}>`;
            }
        }
        cellsHTML += '</tr>';
    }
    const insertButtons = info ? '' : `
            <span class="tbl-sep"></span>
            <button class="tbl-btn" onclick="tableInsertImage(this)" title="셀에 이미지 추가"><i class="fa-solid fa-image"></i></button>
            <button class="tbl-btn" onclick="tableInsertYoutube(this)" title="셀에 유튜브 추가"><i class="fa-brands fa-youtube"></i></button>
            <button class="tbl-btn" onclick="tableInsertToggle(this)" title="셀에 토글 블록 추가"><i class="fa-solid fa-chevron-right"></i></button>`;
    const widthInput = info ? '' : `
            <span class="tbl-sep"></span>
            <label class="tbl-color-label" title="표 너비 (데스크탑 기준 %, 모바일에서는 항상 100%)">
                <i class="fa-solid fa-arrows-left-right"></i>
                <input type="number" class="tbl-width-input" min="10" max="100" step="1" value="${tblWidthPercent}" onchange="tableSetWidthPercent(this)">%
            </label>`;
    return `<div class="editable-table-wrap">
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
            </label>${insertButtons}${widthInput}
            <span class="tbl-sep"></span>
            <label class="tbl-color-label" title="선택한 셀이 속한 열의 너비 (%, 표 자체 너비 기준)">
                <i class="fa-solid fa-ruler-horizontal"></i>
                <input type="number" class="tbl-colwidth-input" min="1" max="100" step="1" placeholder="열 너비%" onchange="tableSetColumnWidth(this)">%
            </label>
            <span class="tbl-cell-info"></span>
        </div>
        <div class="table-scroll-wrap">
            <table class="editable-table" data-border-color="${tblBorderColor}" data-bg-color="${tblBgColor}"${outBorderAttr} data-width-pct="${tblWidthPercent}" style="border-collapse:collapse;width:100%;border:2px solid ${tblOutBorderColor};">
                ${colgroupHTML}
                <tbody>${cellsHTML}</tbody>
            </table>
        </div>
    </div>`;
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
            contentHTML = `
    <div class="block-drag-handle" title="드래그하여 이동"><i class="fa-solid fa-grip-vertical"></i></div>
    ${buildTableWrapHTML(data, rows, cols)}`;
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

// 편집 중인 표(.editable-table)를 출력용 <table>로 바꾼다. 여는 태그는 호출하는 쪽이 정한다.
function tableOutputHTML(tbl, openTag) {
    let tableHTML = openTag;
    const colgroupEl = tbl.querySelector('colgroup');
    if (colgroupEl) {
        tableHTML += '<colgroup>';
        Array.from(colgroupEl.children).forEach(col => {
            tableHTML += col.style.width ? `<col style="width:${col.style.width};">` : '<col>';
        });
        tableHTML += '</colgroup>';
    }
    tbl.querySelectorAll('tr').forEach(row => {
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
            tableHTML += `<${tag}${rowspan}${colspan} style="border:1px solid ${border};${bg}padding:${padding};vertical-align:middle;word-break:break-word;${width}${height}">${cell.innerHTML}</${tag}>`;
        });
        tableHTML += '</tr>';
    });
    return tableHTML + '</table>';
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
            return tableOutputHTML(tbl, `<table class="wiki-table-scaled" style="--table-width-pct: ${widthPct}%; border-collapse:collapse;table-layout:fixed;margin:1em 0; border: 2px solid ${outBorderColor};">`) + '\n';
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

// ── HTML 코드로 불러오기 ───────────────────────
// 생성기가 만든 코드(티스토리에 붙여 넣었다가 복사한 코드 포함)를 다시 읽어
// 작업 내용을 복원한다.
function cssColorToHex(c, fallback) {
    const t = (c || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(t)) return t.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(t)) return '#' + t.slice(1).split('').map(x => x + x).join('').toLowerCase();
    const m = t.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) return '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('');
    return fallback;
}

function parseWikiHTML(raw) {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const wrap = doc.getElementById('wikiwrap');
    if (!wrap) throw new Error('생성기로 만든 코드를 찾지 못했어요. 코드 전체(<div id="wikiwrap"> 부분 포함)를 붙여 넣었는지 확인해 주세요.');
    const mainTable = wrap.querySelector('.wiki-main-table');
    if (!mainTable) throw new Error('캐릭터 정보 표(wiki-main-table)를 찾지 못했어요. 생성기로 만든 코드가 맞는지 확인해 주세요.');

    const warnings = [];
    const styleText = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');
    const colorVar = name => (styleText.match(new RegExp('--' + name + ':\\s*(#[0-9a-fA-F]{3,8})')) || [])[1];

    // 각주: 본문 속 링크를 {{...}} 표기로 되돌리고 하단 각주 목록은 버린다.
    const fnList = [];
    wrap.querySelectorAll('a.wiki-fn-link').forEach(a => {
        const sup = a.querySelector('sup')?.textContent.trim() || '';
        const spans = a.querySelectorAll('.wiki-fn-tooltip > span');
        const content = spans.length > 1 ? spans[spans.length - 1].innerHTML : '';
        fnList.push(/^\[\d+\]$/.test(sup) ? `{{${content}}}` : `{{[${sup.slice(1, -1)}]|${content}}}`);
        const prev = a.previousElementSibling;
        if (prev && prev.tagName === 'A' && prev.hasAttribute('name') && !prev.textContent) prev.remove();
        a.replaceWith(doc.createTextNode(`@@TISFN${fnList.length - 1}@@`));
    });
    wrap.querySelectorAll('.wiki-footnote, script').forEach(el => el.remove());
    const restoreFn = s => s.replace(/@@TISFN(\d+)@@/g, (m, i) => fnList[+i]);

    const data = { showDocTitle: false, docTitle: '', categories: [], fields: [], bodyContent: [] };
    const mainColor = colorVar('wiki-main-color');
    const textColor = colorVar('wiki-text-color');
    if (mainColor) data.mainColor = mainColor; else warnings.push('색상 정보(<style>)가 없어 테마 색상은 현재 값을 그대로 뒀어요.');
    if (textColor) data.nameTextColor = textColor;

    // 정보 표: 직접 편집하는 표(현재 형식)와, 이름·이미지·상세 프로필 입력칸으로 만든 예전 형식을 구분한다.
    const legacy = !!mainTable.querySelector('.wt-name');
    let fallbackTitle = '';
    if (!legacy) {
        const proxy = mainTable.cloneNode(true);
        proxy.querySelectorAll('td, th').forEach(c => { c.innerHTML = restoreFn(c.innerHTML); });
        const outInline = /(?:^|;)\s*border:\s*2px solid\s*([^;]+)/.exec(mainTable.getAttribute('style') || '');
        proxy.dataset.borderColor = cssColorToHex(mainTable.querySelector('td, th')?.style.borderColor, INFO_BORDER_COLOR);
        // 안쪽 테두리와 같은 색이면 "따로 정하지 않음"으로 본다.
        const outHex = outInline ? cssColorToHex(outInline[1], '') : '';
        proxy.dataset.outBorderColor = outHex === proxy.dataset.borderColor ? '' : outHex;
        proxy.dataset.bgColor = '#ffffff';
        proxy.dataset.widthPct = '100';
        data.infoTable = Object.assign(serializeTableForSave(proxy), { outBorderColor: proxy.dataset.outBorderColor });
        fallbackTitle = firstLineText(proxy.querySelector('td, th')?.innerHTML || '');
    }

    // 이름 (예전 형식)
    const bolds = legacy ? mainTable.querySelectorAll('.wt-name b') : [];
    if (legacy) {
        data.charName = bolds[0]?.textContent.trim() || '';
        fallbackTitle = data.charName;
        data.jpSurname = data.jpSurnameFurigana = data.jpName = data.jpNameFurigana = data.enName = '';
    }
    const sub = bolds[1]?.querySelector('span');
    if (sub) {
        const rubies = Array.from(sub.querySelectorAll('ruby')).map(r => ({
            text: Array.from(r.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join(''),
            furi: r.querySelector('rt')?.textContent || '',
            kind: r.classList.contains('wiki-jp-surname') ? 'surname' : r.classList.contains('wiki-jp-name') ? 'name' : ''
        }));
        const setSurname = r => { data.jpSurname = r.text; data.jpSurnameFurigana = r.furi; };
        const setName = r => { data.jpName = r.text; data.jpNameFurigana = r.furi; };
        if (rubies.some(r => r.kind)) {
            rubies.forEach(r => (r.kind === 'surname' ? setSurname : setName)(r));
        } else if (rubies.length >= 2) {
            // 표시가 없는 예전 코드: 앞이 성, 뒤가 이름. 하나뿐이면 구분할 수 없어 이름으로 본다.
            setSurname(rubies[0]); setName(rubies[1]);
        } else if (rubies.length === 1) {
            setName(rubies[0]);
        }
        const rest = sub.cloneNode(true);
        rest.querySelectorAll('ruby').forEach(r => r.remove());
        data.enName = rest.textContent.replace(/^[\s｜]+/, '').trim();
    }

    // 문서 제목
    const first = wrap.firstElementChild;
    const h1 = first && first.tagName === 'DIV' ? first.querySelector(':scope > h1') : null;
    if (h1) {
        data.showDocTitle = true;
        const title = h1.textContent.trim();
        data.docTitle = title === fallbackTitle ? '' : title;
    }

    // 분류
    wrap.querySelectorAll('.wiki-category > a, .wiki-category > span').forEach(el => {
        if (el.tagName === 'SPAN' && /border-left/.test(el.getAttribute('style') || '')) return;
        data.categories.push({ text: el.textContent.trim(), link: el.tagName === 'A' ? (el.getAttribute('href') || '') : '' });
    });

    // 대표 이미지, 출처, 상세 프로필 (예전 형식)
    if (legacy) {
        const rows = Array.from(mainTable.querySelectorAll('tr'));
        data.imageUrl = rows[1]?.querySelector('td img')?.getAttribute('src') || '';
        data.copyright = mainTable.querySelector('.wt-copyright')?.textContent.trim() || '';
        rows.filter(tr => tr.querySelector('.wt-color')).forEach(tr => {
            data.fields.push({
                name: restoreFn(tr.querySelector('.wt-color').innerHTML.trim()),
                value: restoreFn(tr.querySelector('.wt-detail')?.innerHTML.trim() || '')
            });
        });
    }

    // 본문
    let skipped = 0;
    const parseBlock = (el, out) => {
        const cls = el.classList;
        if (el.tagName === 'DETAILS') {
            const h2 = el.querySelector(':scope > summary h2');
            const anchor = h2?.querySelector('a[href="#목차"]');
            if (h2 && anchor) {
                const level = (h2.className.match(/wiki-h(\d)/) || [])[1] || '2';
                const tmp = doc.createElement('div');
                for (let n = anchor.nextSibling; n; n = n.nextSibling) tmp.appendChild(n.cloneNode(true));
                out.push({ type: 'h' + level, content: restoreFn(tmp.innerHTML.trim()) });
            }
            Array.from(el.children).filter(c => c.tagName !== 'SUMMARY').forEach(c => parseBlock(c, out));
        } else if (cls.contains('wiki-toggle-wrap')) {
            const btn = el.querySelector('.wiki-toggle-btn');
            const cm = (btn?.getAttribute('style') || '').match(/(?:^|;)\s*color:\s*([^;]*?)\s*!important/);
            const item = {
                type: 'toggle',
                openLabel: btn?.getAttribute('data-open-label') ?? btn?.innerHTML ?? '',
                closeLabel: btn?.getAttribute('data-close-label') ?? '',
                btnColor: cm ? cssColorToHex(cm[1], '#000000') : '#000000',
                btnColorCustom: !!cm,
                nestedBlocks: []
            };
            const body = el.querySelector(':scope > .wiki-toggle-body');
            if (body) Array.from(body.children).forEach(c => parseBlock(c, item.nestedBlocks));
            out.push(item);
        } else if (el.tagName === 'DIV' && cls.contains('text1')) {
            out.push({ type: 'text', content: restoreFn(el.innerHTML.trim()) });
        } else if (el.tagName === 'TABLE' && cls.contains('wiki-quote')) {
            const td = el.querySelector('td');
            const color = cssColorToHex(td?.style.borderLeftColor, '#cccccc');
            const html = td ? td.innerHTML : '';
            if (/<hr\s*\/?>/i.test(html)) {
                const [dialog, ...restParts] = html.split(/<hr\s*\/?>/i);
                const tmp = doc.createElement('div');
                tmp.innerHTML = restParts.join('<hr>');
                const a = tmp.childNodes.length === 1 ? tmp.firstElementChild : null;
                const isLink = a && a.matches('a.text1[href]');
                out.push({ type: 'quote2', dialog: restoreFn(dialog), desc: restoreFn(isLink ? a.innerHTML : tmp.innerHTML), link: isLink ? a.getAttribute('href') : '', color });
            } else {
                out.push({ type: 'quote', content: restoreFn(html), color });
            }
        } else if (el.tagName === 'TABLE' && cls.contains('wiki-img-sing')) {
            const trs = el.querySelectorAll('tr');
            const td = trs[0]?.querySelector('td');
            const border = cssColorToHex(td?.style.borderColor, '#cccccc');
            const iframe = td?.querySelector('iframe');
            const item = { type: iframe ? 'youtube' : 'image', borderColor: border, hasDescription: false, description: '', descriptionBg: border, descriptionTextColor: '#ffffff' };
            item.url = iframe ? (iframe.getAttribute('src') || '') : (td?.querySelector('img')?.getAttribute('src') || '');
            const descTd = trs[1]?.querySelector('td');
            if (descTd) {
                item.hasDescription = true;
                item.description = restoreFn(descTd.innerHTML.trim());
                item.descriptionBg = cssColorToHex(descTd.style.backgroundColor, border);
                item.descriptionTextColor = cssColorToHex(descTd.style.color, '#ffffff');
            }
            out.push(item);
        } else if (el.tagName === 'TABLE' && cls.contains('wiki-table-scaled')) {
            const proxy = el.cloneNode(true);
            proxy.querySelectorAll('td, th').forEach(c => { c.innerHTML = restoreFn(c.innerHTML); });
            const firstCell = el.querySelector('td, th');
            proxy.dataset.borderColor = cssColorToHex(firstCell?.style.borderColor, '#cccccc');
            proxy.dataset.outBorderColor = cssColorToHex(el.style.borderColor, proxy.dataset.borderColor);
            proxy.dataset.bgColor = '#ffffff';
            proxy.dataset.widthPct = (el.getAttribute('style') || '').match(/--table-width-pct:\s*(\d+)/)?.[1] || '100';
            out.push(Object.assign({ type: 'table' }, serializeTableForSave(proxy)));
        } else if (el.tagName === 'TABLE' && cls.contains('text1') && el.textContent.includes('스포일러')) {
            out.push({ type: 'warn' });
        } else if (el.tagName === 'TABLE' && cls.contains('wiki-index')) {
            // 목차는 제목 블록에서 자동으로 만들어져요.
        } else if (el.textContent.trim() || el.querySelector('img, iframe')) {
            skipped++;
        }
    };
    const container = wrap.querySelector('.wiki-container');
    for (let el = container ? container.nextElementSibling : null; el; el = el.nextElementSibling) {
        parseBlock(el, data.bodyContent);
    }
    if (skipped) warnings.push(`알 수 없는 형식의 부분 ${skipped}개는 불러오지 못했어요.`);

    return { data, warnings };
}

function openHtmlLoad() {
    document.getElementById("html-load-text").value = "";
    const msg = document.getElementById("html-load-msg");
    msg.textContent = "";
    msg.className = "html-load-msg";
    document.getElementById("html-load-popup").classList.remove("hidden");
}

function closeHtmlLoad() {
    document.getElementById("html-load-popup").classList.add("hidden");
}

function runHtmlLoad() {
    const msg = document.getElementById("html-load-msg");
    const show = (t, ok) => { msg.textContent = t; msg.className = "html-load-msg " + (ok ? "ok" : "err"); };
    const text = document.getElementById("html-load-text").value;
    if (!text.trim()) { show("불러올 코드를 붙여 넣어 주세요.", false); return; }

    let parsed;
    try {
        parsed = parseWikiHTML(text);
    } catch (err) {
        show(err.message, false);
        return;
    }
    if (!confirm("현재 작업 내용이 모두 붙여 넣은 코드의 내용으로 바뀝니다. 계속할까요?")) return;

    applyLoadedData(parsed.data);
    generateHTML();
    show(["코드를 불러왔어요.", ...parsed.warnings].join(" "), parsed.warnings.length === 0);
}

document.getElementById("html-load-popup").addEventListener("click", (e) => {
    if (e.target === document.getElementById("html-load-popup")) closeHtmlLoad();
});

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
        td.style.verticalAlign = 'middle';
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
        td.style.verticalAlign = 'middle';
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
    setupTableDragSelect(table);
}

// 표 안에서 마우스를 끌어 여러 셀을 한 번에 선택한다. 한 셀 안에서 끄는 것은 글자 선택 그대로 둔다.
// 선택 범위는 시작 셀과 현재 셀을 두 모서리로 하는 직사각형이고, 합쳐진 셀이 걸치면 그 셀 전체를 포함한다.
function setupTableDragSelect(table) {
    let startCell = null;
    let dragging = false;

    const cellRects = () => {
        const rects = [];
        buildTableCellGrid(table).forEach((entries, r) => entries.forEach(e => {
            rects.push({
                cell: e.cell,
                r1: r, c1: e.logicalCol,
                r2: r + (parseInt(e.cell.getAttribute('rowspan')) || 1) - 1,
                c2: e.logicalCol + e.colspan - 1
            });
        }));
        return rects;
    };

    const selectRange = (a, b) => {
        const rects = cellRects();
        const ra = rects.find(x => x.cell === a);
        const rb = rects.find(x => x.cell === b);
        if (!ra || !rb) return;
        let r1 = Math.min(ra.r1, rb.r1), r2 = Math.max(ra.r2, rb.r2);
        let c1 = Math.min(ra.c1, rb.c1), c2 = Math.max(ra.c2, rb.c2);
        const overlaps = x => x.r1 <= r2 && x.r2 >= r1 && x.c1 <= c2 && x.c2 >= c1;
        let changed = true;
        while (changed) {
            changed = false;
            rects.filter(overlaps).forEach(x => {
                if (x.r1 < r1) { r1 = x.r1; changed = true; }
                if (x.r2 > r2) { r2 = x.r2; changed = true; }
                if (x.c1 < c1) { c1 = x.c1; changed = true; }
                if (x.c2 > c2) { c2 = x.c2; changed = true; }
            });
        }
        table.querySelectorAll('.tbl-selected').forEach(c => c.classList.remove('tbl-selected'));
        rects.filter(overlaps).forEach(x => x.cell.classList.add('tbl-selected'));
        tableUpdateInfo(table.closest('.editable-table-wrap'));
    };

    const reset = () => {
        startCell = null;
        dragging = false;
        table.classList.remove('tbl-dragging');
    };

    table.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const cell = e.target.closest('td, th');
        if (!cell || !table.contains(cell)) return;
        const rect = cell.getBoundingClientRect();
        if (rect.right - e.clientX < 8 || rect.bottom - e.clientY < 8) return; // 열·행 크기 조절 영역
        startCell = cell;
        dragging = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!startCell) return;
        if ((e.buttons & 1) === 0) { reset(); return; }
        const cell = e.target instanceof Element ? e.target.closest('td, th') : null;
        if (!cell || !table.contains(cell) || (!dragging && cell === startCell)) return;
        if (!dragging) {
            dragging = true;
            table.classList.add('tbl-dragging');
        }
        window.getSelection().removeAllRanges();
        selectRange(startCell, cell);
    });

    document.addEventListener('mouseup', () => {
        if (!startCell) return;
        const wasDragging = dragging;
        reset();
        if (wasDragging) window.getSelection().removeAllRanges();
    });
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

// 지금 작업 내용을 저장 형식(JSON으로 쓰이는 객체)으로 모은다. 파일 저장과 사이트 내 저장이 함께 쓴다.
function collectSaveData() {
  const data = {
    mainColor: document.getElementById("mainColorPicker").value,
    showDocTitle: document.getElementById("showDocTitle")?.checked ?? true,
    docTitle: document.getElementById("docTitle")?.value || "",
    infoTable: (() => {
        const tbl = document.querySelector('#info-editor .editable-table');
        // 바깥 테두리를 따로 정하지 않았다면 빈 값으로 남겨, 불러온 뒤에도 테마 색상을 따라가게 한다.
        return tbl ? Object.assign(serializeTableForSave(tbl), { outBorderColor: tbl.dataset.outBorderColor || '' }) : null;
    })(),
    categories: Array.from(document.querySelectorAll("#category-list .category-row")).map(row => ({
        text: row.querySelector(".cat-text").value,
        link: row.querySelector(".cat-link").value
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

  return data;
}

function saveData() {
  const data = collectSaveData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const charName = (document.getElementById("docTitle")?.value.trim() || infoFallbackTitle()).replace(/[\\/:*?"<>|]/g, '').trim() || "profile";
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
    applyLoadedData(JSON.parse(e.target.result));
  };

  reader.readAsText(file);
  event.target.value = null;
}

// 저장 파일(JSON)과 HTML 코드 불러오기가 함께 쓰는, 작업 내용 복원 함수.
function applyLoadedData(data) {
  {
    if (data.mainColor) {
      const mainColorPicker = document.getElementById("mainColorPicker");
      mainColorPicker.value = data.mainColor;
      mainColorPicker.closest('label').querySelector('.color-display').style.backgroundColor = data.mainColor;
    }

    if (data.showDocTitle !== undefined) {
        const checkbox = document.getElementById("showDocTitle");
        if(checkbox) checkbox.checked = data.showDocTitle;
    }

    const docTitleInput = document.getElementById("docTitle");
    if(docTitleInput) docTitleInput.value = data.docTitle || "";

    // 정보 표: 새 형식이면 그대로, 예전 형식(이름/이미지/상세 프로필 입력칸)이면 표로 옮겨서 복원한다.
    const isLegacy = !data.infoTable && ['charName', 'imageUrl', 'copyright', 'fields', 'enName', 'jpName', 'jpSurname'].some(k => k in data);
    buildInfoEditor(data.infoTable || (isLegacy ? legacyToInfoTable(data) : null));

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

    const editorContainer = document.getElementById("editor-container");
    editorContainer.innerHTML = "";
    if (data.bodyContent && data.bodyContent.length > 0) {
        data.bodyContent.forEach(item => {
            addBlock(item.type, item, null, true);
        });
    }

    debouncedGenerateHTML();
  }
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

// ── 붙여넣기: 글 내용만 ────────────────────────
// 웹페이지·문서에서 복사한 글은 글꼴, 크기, 줄 간격, 색, 배경색 같은 서식을 모두 버리고 글자만 붙여 넣는다.
// (사이트 안에서 복사한 글도 마찬가지라, 굵게·색 같은 서식은 위 도구 모음으로 다시 입히면 된다.)
// 복사한 것에 글자가 없고 HTML만 있는 경우(그림 등)에는 서식 속성을 모두 걷어낸 HTML을 넣는다.
function escapeHTMLText(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('paste', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || !target.closest('[contenteditable="true"]')) return;
    const clip = e.clipboardData;
    if (!clip) return;
    const text = clip.getData('text/plain');
    const html = clip.getData('text/html');

    if (text) {
        e.preventDefault();
        const body = escapeHTMLText(text.replace(/\r\n?/g, '\n'))
            .replace(/ {2,}/g, m => ' ' + '&nbsp;'.repeat(m.length - 1))
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, body);
        return;
    }
    if (!html) return;
    e.preventDefault();

    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, link, meta, iframe, object, embed').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(a => {
            const keep = (el.tagName === 'IMG' && (a.name === 'src' || a.name === 'alt')) || (el.tagName === 'A' && a.name === 'href');
            if (!keep || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
        });
    });
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach(c => c.remove());

    document.execCommand('insertHTML', false, doc.body.innerHTML);
}, true);

// ── 내 작업 ─────────────────────────────────────
// 작업 내용을 이름을 붙여 여러 개 보관하고, 목록에서 골라 불러온다. 저장 형식은 JSON 파일 저장과 같다.
// 저장 위치: 구글 로그인이 되어 있으면 클라우드(Firebase, cloud.js), 아니면 이 브라우저(localStorage).
// 브라우저 저장은 다른 기기와 공유되지 않으므로 백업은 JSON 저장을 함께 쓴다.
const WORKS_KEY = 'dreammaker.works.v1';

function readWorks() {
    try {
        const list = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]');
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function writeWorks(list) {
    try {
        localStorage.setItem(WORKS_KEY, JSON.stringify(list));
        return true;
    } catch (e) {
        alert('이 브라우저에 저장하지 못했어요(저장 공간이 부족하거나 저장이 막혀 있어요). 저장 버튼으로 JSON 파일에 백업해 주세요.');
        return false;
    }
}

const cloudOn = () => !!(window.cloudWorks && window.cloudWorks.configured && window.cloudWorks.user);

async function worksList() {
    return cloudOn() ? await window.cloudWorks.list() : readWorks();
}

async function worksPut(work) {
    if (cloudOn()) {
        await window.cloudWorks.put(work);
        return true;
    }
    const list = readWorks();
    const i = list.findIndex(w => w.id === work.id);
    if (i >= 0) list[i] = work; else list.push(work);
    return writeWorks(list);
}

async function worksRemove(id) {
    if (cloudOn()) {
        await window.cloudWorks.remove(id);
        return true;
    }
    return writeWorks(readWorks().filter(w => w.id !== id));
}

function workDefaultName() {
    return document.getElementById('docTitle')?.value.trim() || infoFallbackTitle() || '이름 없는 작업';
}

function showWorksMsg(text, ok) {
    const msg = document.getElementById('works-msg');
    msg.textContent = text;
    msg.className = 'works-msg ' + (ok ? 'ok' : 'err');
}

function worksError(err) {
    showWorksMsg('작업을 처리하지 못했어요: ' + (err && err.message ? err.message : err), false);
}

// 클라우드 로그인 상태 줄. firebase-config.js에 설정이 없으면 보이지 않는다.
function renderCloudStatus() {
    const box = document.getElementById('works-cloud');
    const cloud = window.cloudWorks;
    box.innerHTML = '';
    if (!cloud || !(cloud.configured || cloud.error)) {
        box.hidden = true;
        return;
    }
    box.hidden = false;
    const text = document.createElement('div');
    text.className = 'works-cloud-text';
    const actions = document.createElement('div');
    actions.className = 'works-actions';
    const addBtn = (label, handler) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn-icon-text';
        b.textContent = label;
        b.addEventListener('click', handler);
        actions.appendChild(b);
    };

    if (cloud.error && !cloud.configured) {
        text.textContent = '클라우드에 연결하지 못했어요. 지금은 이 브라우저에만 저장돼요.';
    } else if (!cloud.user) {
        text.textContent = '구글 계정으로 로그인하면 여러 기기·브라우저에서 같은 작업 목록을 쓸 수 있어요. (지금은 이 브라우저에만 저장돼요)';
        addBtn('구글로 로그인', async () => {
            try { await cloud.signIn(); } catch (e) { worksError(e); }
        });
    } else {
        text.textContent = `${cloud.user.email || cloud.user.name || '로그인됨'} — 작업이 클라우드에 저장돼요.`;
        addBtn('로그아웃', async () => {
            try { await cloud.signOut(); } catch (e) { worksError(e); }
        });
        const local = readWorks();
        if (local.length > 0) {
            addBtn(`이 브라우저의 작업 ${local.length}개를 클라우드로 옮기기`, moveLocalWorksToCloud);
        }
    }
    box.append(text, actions);
}

async function moveLocalWorksToCloud() {
    const local = readWorks();
    if (!local.length) return;
    if (!confirm(`이 브라우저에 저장된 작업 ${local.length}개를 클라우드로 옮길까요? 옮긴 뒤 이 브라우저의 저장본은 지워져요.`)) return;
    try {
        for (const w of local) await window.cloudWorks.put(w);
        localStorage.removeItem(WORKS_KEY);
        showWorksMsg(`작업 ${local.length}개를 클라우드로 옮겼어요.`, true);
        renderCloudStatus();
        await renderWorks();
    } catch (e) {
        worksError(e);
    }
}

async function renderWorks() {
    const box = document.getElementById('works-list');
    let list;
    try {
        list = (await worksList()).sort((a, b) => b.savedAt - a.savedAt);
    } catch (e) {
        worksError(e);
        return;
    }
    box.innerHTML = '';
    if (list.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'works-empty';
        empty.textContent = '저장된 작업이 없어요.';
        box.appendChild(empty);
        return;
    }
    list.forEach(w => {
        const row = document.createElement('div');
        row.className = 'works-row';
        row.dataset.id = w.id;
        const info = document.createElement('div');
        info.className = 'works-info';
        const name = document.createElement('div');
        name.className = 'works-name';
        name.textContent = w.name;
        const time = document.createElement('div');
        time.className = 'works-time';
        time.textContent = new Date(w.savedAt).toLocaleString('ko-KR');
        info.append(name, time);
        const actions = document.createElement('div');
        actions.className = 'works-actions';
        [['불러오기', 'load'], ['덮어쓰기', 'overwrite'], ['이름 변경', 'rename'], ['삭제', 'delete']].forEach(([label, act]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn-icon-text' + (act === 'delete' ? ' works-danger' : '');
            b.dataset.act = act;
            b.textContent = label;
            actions.appendChild(b);
        });
        row.append(info, actions);
        box.appendChild(row);
    });
}

function openWorks() {
    document.getElementById('works-name').value = workDefaultName();
    showWorksMsg('', true);
    renderCloudStatus();
    renderWorks();
    document.getElementById('works-popup').classList.remove('hidden');
}

function closeWorks() {
    document.getElementById('works-popup').classList.add('hidden');
}

async function saveCurrentWork() {
    const name = document.getElementById('works-name').value.trim() || workDefaultName();
    try {
        const list = await worksList();
        const same = list.find(w => w.name === name);
        if (same && !confirm(`"${name}" 이름의 작업이 이미 있어요. 현재 작업 내용으로 덮어쓸까요?`)) return;
        const work = same || { id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name };
        work.data = collectSaveData();
        work.savedAt = Date.now();
        if (await worksPut(work)) {
            await renderWorks();
            showWorksMsg(`"${name}"을(를) 저장했어요.`, true);
        }
    } catch (e) {
        worksError(e);
    }
}

document.getElementById('works-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('.works-row').dataset.id;
    try {
        const list = await worksList();
        const work = list.find(w => w.id === id);
        if (!work) return;

        switch (btn.dataset.act) {
            case 'load':
                if (!confirm(`현재 작업 내용이 "${work.name}"(으)로 바뀝니다. 계속할까요?`)) return;
                applyLoadedData(work.data);
                generateHTML();
                closeWorks();
                break;
            case 'overwrite':
                if (!confirm(`"${work.name}"을(를) 현재 작업 내용으로 덮어쓸까요?`)) return;
                work.data = collectSaveData();
                work.savedAt = Date.now();
                if (await worksPut(work)) {
                    await renderWorks();
                    showWorksMsg(`"${work.name}"을(를) 덮어썼어요.`, true);
                }
                break;
            case 'rename': {
                const next = (prompt('새 이름을 입력하세요:', work.name) || '').trim();
                if (!next || next === work.name) return;
                if (list.some(w => w.id !== id && w.name === next)) {
                    alert('같은 이름의 작업이 이미 있어요.');
                    return;
                }
                work.name = next;
                if (await worksPut(work)) await renderWorks();
                break;
            }
            case 'delete':
                if (!confirm(`"${work.name}"을(를) 삭제할까요? 되돌릴 수 없어요.`)) return;
                if (await worksRemove(id)) {
                    await renderWorks();
                    showWorksMsg(`"${work.name}"을(를) 삭제했어요.`, true);
                }
                break;
        }
    } catch (err) {
        worksError(err);
    }
});

document.getElementById('works-popup').addEventListener('click', (e) => {
    if (e.target === document.getElementById('works-popup')) closeWorks();
});

// 로그인 상태가 바뀌면(로그인·로그아웃·연결 완료) 팝업의 상태 줄과 목록을 새로 그린다.
window.addEventListener('cloudauth', () => {
    if (document.getElementById('works-popup').classList.contains('hidden')) return;
    renderCloudStatus();
    renderWorks();
});

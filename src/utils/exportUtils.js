// src/utils/exportUtils.js

/**
 * Cleanly escapes and converts an array of objects into CSV format and triggers download.
 * @param {string} filename - Output filename (e.g. "billing_report.csv")
 * @param {Array<Object>} data - Data rows to export
 * @param {Array<{ key: string, label: string, formatter?: (val: any, row: any) => string }>} columns - Column definitions
 */
export const exportToCSV = (filename, data = [], columns = []) => {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  // If columns are not specified, extract keys from the first object
  const activeCols = columns.length > 0
    ? columns
    : Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));

  // Build CSV Header
  const headerRow = activeCols.map(col => `"${String(col.label || col.key).replace(/"/g, '""')}"`).join(',');

  // Build CSV Data Rows
  const dataRows = data.map(row => {
    return activeCols.map(col => {
      let val;
      if (typeof col.formatter === 'function') {
        val = col.formatter(row[col.key], row);
      } else {
        val = row[col.key];
      }

      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }

      // Escape quotes
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports data as a formatted JSON file.
 * @param {string} filename - Output filename
 * @param {any} data - Data to export
 */
export const exportToJSON = (filename, data) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers safe window printing with optional container focus.
 * @param {string} [containerId] - Optional element ID to scroll into view or mark
 */
export const triggerPrint = (containerId = null) => {
  if (containerId) {
    const el = document.getElementById(containerId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  setTimeout(() => {
    window.print();
  }, 100);
};

/**
 * Generates standard timestamped filename.
 * @param {string} prefix - e.g. "patient_roster"
 * @param {string} extension - e.g. "csv" or "pdf"
 */
export const getTimestampedFilename = (prefix, extension = 'csv') => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
};

/**
 * Client-side automatic PDF generator for CMS-1500 forms using html2pdf.js.
 *
 * NOTE: The caller (CmsPreviewPage) is responsible for setting zoom to 1 and
 * waiting for the browser to repaint BEFORE calling this function. This ensures
 * the form element in the DOM has no CSS transform applied, so html2canvas
 * captures it at true 1:1 pixel dimensions with perfect alignment.
 *
 * @param {string|HTMLElement} elementOrId - Element or ID of element to convert
 * @param {string} filename - Target PDF filename
 */
export const exportToPDF = async (elementOrId, filename = 'cms1500_claim.pdf') => {
  let movedContainer = null;
  let origLeft     = null;
  let origZIndex   = null;

  try {
    // Lazy-load both libraries (they're in node_modules as standalone packages)
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF }   = await import('jspdf');

    const rootEl = typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

    if (!rootEl) throw new Error('Target element for PDF generation not found');

    // ── Move hidden container into the capturable viewport area ──────────────
    // html2canvas virtual window spans x=0..windowWidth. position:fixed elements
    // at left:-9999px are OUTSIDE this range and captured as blank.
    // Temporarily bring the container to left:0 with sky-high z-index so:
    //   (a) It is within x=0..windowWidth
    //   (b) It is on top of the sidebar/navbar so nothing overlaps the form
    // ─────────────────────────────────────────────────────────────────────────
    movedContainer = rootEl;
    origLeft   = rootEl.style.left;
    origZIndex = rootEl.style.zIndex;
    rootEl.style.left   = '0px';
    rootEl.style.zIndex = '99999';

    // Two rAFs: first schedules the style change, second waits for the browser paint
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Locate the actual CMS form (direct .cms-claim-page child or the root itself)
    const targetEl = rootEl.querySelector('.cms-claim-page') || rootEl;

    // ── Swap <input>/<textarea>/<select> → <span> ────────────────────────────
    // html2canvas does NOT render form control values; text must be in the DOM
    const inputs       = Array.from(targetEl.querySelectorAll('input, textarea, select'));
    const replacements = [];

    inputs.forEach(inp => {
      const val      = inp.value || inp.getAttribute('value') || '';
      const isTa     = inp.tagName === 'TEXTAREA';
      const computed = window.getComputedStyle(inp);

      const span = document.createElement('span');
      span.className            = inp.className;
      span.style.display        = isTa ? 'block' : 'inline-block';
      span.style.whiteSpace     = isTa ? 'pre-wrap' : 'nowrap';
      span.style.verticalAlign  = 'baseline';
      span.style.fontSize       = computed.fontSize;
      span.style.fontFamily     = computed.fontFamily;
      span.style.color          = computed.color;
      span.style.lineHeight     = inp.style.lineHeight || computed.lineHeight;
      span.style.padding        = computed.padding;
      span.style.margin         = computed.margin;
      // Shift text slightly up specifically for the PDF canvas capture 
      // because spans render slightly lower than native inputs in html2canvas
      span.style.position       = 'relative';
      span.style.top            = '-2px';
      span.textContent          = val;

      if (inp.parentNode) {
        inp.parentNode.replaceChild(span, inp);
        replacements.push({ parent: span.parentNode, span, original: inp });
      }
    });

    // ── Capture the form element at 2× resolution ────────────────────────────
    const canvas = await html2canvas(targetEl, {
      scale       : 2,          // 2× sharpness (192dpi effective at 96dpi screen)
      useCORS     : true,
      allowTaint  : true,
      logging     : false,
      scrollY     : 0,          // form is position:fixed at top:0 — no scroll offset
      scrollX     : 0,
      windowWidth : window.innerWidth,  // real viewport so layout renders at natural size
    });

    // ── Restore <input>/<textarea>/<select> ──────────────────────────────────
    replacements.forEach(({ parent, span, original }) => {
      if (parent && span.parentNode === parent) parent.replaceChild(original, span);
    });

    // ── Build jsPDF page sized EXACTLY to the captured canvas ────────────────
    // canvas.width/height are at scale:2 (double the element's CSS pixels).
    // Dividing by (scale × 96dpi) converts back to inches.
    const pdfW = canvas.width  / (2 * 96);  // e.g. 1632 / 192 = 8.5 in
    const pdfH = canvas.height / (2 * 96);  // e.g. 2070 / 192 = 10.78 in

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit       : 'in',
      format     : [pdfW, pdfH],
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    // Place the image to fill the whole page — no margin, no scaling artifact
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);

  } catch (err) {
    console.error('Failed to generate PDF:', err);
    throw err;
  } finally {
    // ALWAYS restore the container to its off-screen position
    if (movedContainer && origLeft !== null) {
      movedContainer.style.left   = origLeft;
      movedContainer.style.zIndex = origZIndex;
    }
  }
};

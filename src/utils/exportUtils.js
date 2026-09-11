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
 * Produces a clean 1-page US Letter portrait PDF matching exact visual layout and colors.
 * @param {string|HTMLElement} elementOrId - Element or ID of element to convert
 * @param {string} filename - Target PDF filename
 */
export const exportToPDF = async (elementOrId, filename = 'cms1500_claim.pdf') => {
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    const rootEl = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    
    if (!rootEl) {
      throw new Error('Target element for PDF generation not found');
    }

    // Locate inner .cms-claim-page or fallback to rootEl
    const targetEl = rootEl.querySelector?.('.cms-claim-page') || rootEl;

    const opt = {
      margin: 0,
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 816,
        onclone: (clonedDoc, element) => {
          const origInputs = targetEl.querySelectorAll('input, textarea, select');
          const clonedInputs = element.querySelectorAll('input, textarea, select');
          origInputs.forEach((inp, i) => {
            const clonedInp = clonedInputs[i];
            if (clonedInp) {
              const val = inp.value || inp.getAttribute('value') || '';
              const span = clonedDoc.createElement('span');
              span.className = clonedInp.className;
              
              const isRight = clonedInp.classList.contains('text-right');
              const isLeft = clonedInp.classList.contains('text-left');
              const justifyVal = isRight ? 'flex-end' : isLeft ? 'flex-start' : 'center';

              span.style.display = 'inline-flex';
              span.style.alignItems = 'center';
              span.style.justifyContent = justifyVal;
              span.style.width = '100%';
              span.style.height = '100%';
              span.style.lineHeight = '1';
              span.style.whiteSpace = 'pre-wrap';
              span.style.overflow = 'hidden';
              span.textContent = val;

              if (clonedInp.parentNode) {
                clonedInp.parentNode.replaceChild(span, clonedInp);
              }
            }
          });
        }
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    return await html2pdf().set(opt).from(targetEl).save();
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    throw err;
  }
};


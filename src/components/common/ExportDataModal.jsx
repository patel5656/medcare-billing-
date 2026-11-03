// src/components/common/ExportDataModal.jsx
import React, { useState } from 'react';
import { 
  X, Download, FileSpreadsheet, FileText, Code2, Printer, 
  Check, CheckSquare, Square, Layers, ShieldCheck, Sparkles, Filter 
} from 'lucide-react';
import { exportToCSV, exportToJSON, getTimestampedFilename, triggerPrint } from '../../utils/exportUtils';
import { useUIStore } from '../../store/uiStore';

export const ExportDataModal = ({
  isOpen,
  onClose,
  title = "Export Data",
  subtitle = "Choose format and fields to export clinical and financial records",
  data = [],
  availableColumns = [],
  defaultFilename = "export",
  printableContainerId = null,
}) => {
  const { addToast } = useUIStore();
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' | 'json' | 'pdf'
  const [selectedColKeys, setSelectedColKeys] = useState(() => 
    availableColumns.map(c => c.key)
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleColumn = (key) => {
    if (selectedColKeys.includes(key)) {
      if (selectedColKeys.length === 1) {
        addToast('At least one column must be selected', 'warning');
        return;
      }
      setSelectedColKeys(selectedColKeys.filter(k => k !== key));
    } else {
      setSelectedColKeys([...selectedColKeys, key]);
    }
  };

  const selectAllColumns = () => {
    setSelectedColKeys(availableColumns.map(c => c.key));
  };

  const deselectAllColumns = () => {
    if (availableColumns.length > 0) {
      setSelectedColKeys([availableColumns[0].key]);
    }
  };

  const handleExecuteExport = async () => {
    if (!data || data.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === 'pdf') {
        if (printableContainerId) {
          triggerPrint(printableContainerId);
        } else {
          window.print();
        }
        addToast('Print dialog triggered for PDF generation', 'info');
        setIsExporting(false);
        onClose();
        return;
      }

      if (exportFormat === 'csv') {
        const activeColumns = availableColumns.filter(c => selectedColKeys.includes(c.key));
        const filename = getTimestampedFilename(defaultFilename, 'csv');
        exportToCSV(filename, data, activeColumns);
        addToast(`Exported ${data.length} records to ${filename}`, 'success');
      } else if (exportFormat === 'json') {
        const filename = getTimestampedFilename(defaultFilename, 'json');
        // Filter keys if columns are defined
        const filteredData = data.map(item => {
          const out = {};
          selectedColKeys.forEach(k => {
            out[k] = item[k];
          });
          return out;
        });
        exportToJSON(filename, filteredData);
        addToast(`Exported JSON backup to ${filename}`, 'success');
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Export error:', err);
      addToast(err.message || 'Export failed', 'error');
      setIsExporting(false);
    }
  };

  const activeColumns = availableColumns.filter(c => selectedColKeys.includes(c.key));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">{title}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Format Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* CSV Option */}
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${exportFormat === 'csv' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  {exportFormat === 'csv' && <span className="w-2 h-2 rounded-full bg-teal-600"></span>}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">CSV Sheet</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Excel &amp; Spreadsheet</p>
                </div>
              </button>

              {/* PDF Option */}
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${exportFormat === 'pdf' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <Printer className="w-4 h-4" />
                  </div>
                  {exportFormat === 'pdf' && <span className="w-2 h-2 rounded-full bg-teal-600"></span>}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">PDF Print</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Official Document</p>
                </div>
              </button>

            </div>
          </div>

          {/* Column Fields Selector (For CSV and JSON) */}
          {exportFormat !== 'pdf' && availableColumns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Include Fields ({selectedColKeys.length}/{availableColumns.length})
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllColumns}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={deselectAllColumns}
                    className="text-slate-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                {availableColumns.map(col => {
                  const isSelected = selectedColKeys.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleColumn(col.key)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-900 font-bold shadow-2xs border border-teal-300'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{col.label || col.key}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary & Record Count */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{data.length} Total Records</p>
                <p className="text-[10px] text-slate-500">
                  {exportFormat === 'pdf' 
                    ? 'Includes active view styling & typography' 
                    : `Active fields: ${selectedColKeys.length}`}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase font-mono">
              Ready
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {exportFormat === 'pdf' ? (
              <>
                <Printer className="w-4 h-4" /> Print / Save PDF
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

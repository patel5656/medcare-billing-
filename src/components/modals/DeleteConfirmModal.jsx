// src/components/modals/DeleteConfirmModal.jsx
import React from 'react';
import { Modal } from './Modal';
import { Trash2, AlertTriangle } from 'lucide-react';

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  subtitle = "Confirm deletion",
  itemName = "",
  isDeleting = false,
  buttonText = "Delete",
  typeText = "item",
  warningText = "This item will be permanently removed from the database. This action cannot be undone."
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={AlertTriangle}
      iconColor="text-rose-600"
      iconBg="bg-rose-50"
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Deleting...' : buttonText}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-left py-1">
        <p className="text-xs text-slate-600 font-medium">
          Are you sure you want to delete <strong className="text-slate-900 font-extrabold">{itemName || `this ${typeText}`}</strong>?
        </p>
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-1">
          <p className="font-bold flex items-center gap-1">
            ⚠️ Warning: Permanent Action
          </p>
          <p className="text-rose-700">
            {warningText}
          </p>
        </div>
      </div>
    </Modal>
  );
};

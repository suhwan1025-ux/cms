import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  title = "확인", 
  message, 
  confirmText = "확인", 
  cancelText = "취소",
  onConfirm, 
  onCancel,
  type = "default" // default, warning, danger
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="confirm-dialog-overlay" onClick={handleOverlayClick}>
      <div className={`confirm-dialog ${type}`}>
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <div className="confirm-dialog-icon">
            {type === 'warning' && '⚠️'}
            {type === 'danger' && '🗑️'}
            {type === 'default' && '❓'}
          </div>
          <p className="confirm-dialog-message">{message}</p>
        </div>
        
        <div className="confirm-dialog-footer">
          <button 
            className="confirm-dialog-btn cancel-btn" 
            onClick={handleCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-dialog-btn confirm-btn ${type}`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 
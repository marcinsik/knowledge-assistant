import { CheckCircle, X, XCircle } from 'lucide-react';
import React from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface SimpleToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

const toastStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  padding: '14px 18px 14px 16px',
  opacity: 1,
  transform: 'translateX(0)',
  transition: 'opacity 0.3s, transform 0.3s',
  pointerEvents: 'auto',
  marginBottom: 8,
  minWidth: 320,
  maxWidth: 400,
};

const getColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { borderColor: '#bbf7d0', background: '#f0fdf4', icon: <CheckCircle className="w-5 h-5 text-green-500" /> };
    case 'error':
      return { borderColor: '#fecaca', background: '#fef2f2', icon: <XCircle className="w-5 h-5 text-red-500" /> };
    default:
      return { borderColor: '#bae6fd', background: '#f0f9ff', icon: null };
  }
};

const SimpleToast: React.FC<SimpleToastProps> = ({ id, type, message, onClose }) => {
  const { borderColor, background, icon } = getColors(type);
  return (
    <div style={{ ...toastStyle, borderColor, background }}>
      {icon}
      <div style={{ flex: 1, marginLeft: 12 }}>
        <p style={{ fontSize: '1rem', color: '#222', margin: 0, fontWeight: 500 }}>{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        style={{
          marginLeft: 16,
          background: 'none',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          padding: 2,
          borderRadius: 4,
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SimpleToast;

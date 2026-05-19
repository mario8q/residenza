export default function Modal({ open, onClose, title, children }) {
  // Si open es explícito, usarlo; sino, usar renderizado condicional
  if (open === false) return null;
  
  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && onClose) {
        onClose();
      }
    }}>
      <div className="modal">
        {title && <div className="modal-title">{title}</div>}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

/** @returns {(options: { title?: string, message: string, confirmLabel?: string, danger?: boolean } | string) => Promise<boolean>} */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    const requestOptions = typeof options === 'string' ? { message: options } : options;
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setRequest(requestOptions);
    });
  }, []);

  const close = useCallback((accepted) => {
    resolveRef.current?.(accepted);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request ? <ConfirmDialog {...request} onClose={close} /> : null}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = false, onClose }) {
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={() => onClose(false)}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        <p className="dialog__message">{message}</p>
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="button button--ghost" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={`button${danger ? ' button--danger' : ''}`}
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

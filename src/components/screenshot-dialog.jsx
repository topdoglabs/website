import { useEffect, useRef } from "react";

export const ScreenshotDialog = ({ title, onDismiss, children }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog
      className="modal"
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [...dialogRef.current.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')];
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onDismiss(); }}
    >
      <div className="modal-content">
        <button className="modal-close" type="button" onClick={onDismiss} aria-label="Close image">✕</button>
        {children}
      </div>
    </dialog>
  );
};

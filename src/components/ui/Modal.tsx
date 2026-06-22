import { X } from 'lucide-react';
import { Button } from './Button';

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="nexo-card max-h-[92vh] w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
          <Button type="button" variant="secondary" className="h-12 w-12 p-0" onClick={onClose} aria-label="Cerrar" title="Cerrar">
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="max-h-[calc(92vh-5rem)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

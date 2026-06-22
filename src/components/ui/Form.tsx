import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { HelpMark } from './HelpMark';

type FieldProps = {
  label: string;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
};

export function Field({ label, error, helpText, children }: FieldProps) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center gap-2">
        <span className="nexo-label">{label}</span>
        {helpText && <HelpMark text={helpText} />}
      </span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="nexo-input" {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="nexo-input" {...props} />;
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="nexo-input min-h-24 resize-y" {...props} />;
}

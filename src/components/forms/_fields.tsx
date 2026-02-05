"use client";

import * as React from "react";

/** Helpers visuales (sin librerías, sin eventos raros) */
function Label({
  children,
}: {
  children: React.ReactNode;
}) {
  return <label className="grid gap-1 text-sm">{children}</label>;
}

function Req({ required }: { required?: boolean }) {
  return required ? <span className="opacity-70">*</span> : null;
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
}) {
  return (
    <Label>
      <span className="font-medium">
        {label} <Req required={required} />
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="form-input"
      />
    </Label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  required?: boolean;
}) {
  return (
    <Label>
      <span className="font-medium">
        {label} <Req required={required} />
      </span>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value as T)}
        className="form-select"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Label>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <Label>
      <span className="font-medium">
        {label} <Req required={required} />
      </span>
      <textarea
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="form-textarea"
      />
    </Label>
  );
}

export function FileField({
  label,
  accept,
  onChange,
  required,
  helper,
}: {
  label: string;
  accept?: string;
  onChange: (f?: File) => void;
  required?: boolean;
  helper?: string;
}) {
  return (
    <Label>
      <span className="font-medium">
        {label} <Req required={required} />
      </span>
      {helper ? <span className="text-xs opacity-75">{helper}</span> : null}
      <input
        type="file"
        accept={accept}
        required={required}
        onChange={(e) => onChange(e.target.files?.[0])}
        className="form-file"
      />
    </Label>
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="submit" disabled={loading} className="btn btn-primary w-full md:w-auto disabled:opacity-60">
      {loading ? "Enviando..." : children}
    </button>
  );
}

"use client";

import * as React from "react";

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
    <label className="grid gap-1 text-sm">
      <span className="font-medium">
        {label} {required ? <span className="opacity-70">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border bg-white/85 px-3 outline-none focus:ring-2"
        style={{
          borderColor: "var(--congreso-border)",
        }}
      />
    </label>
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
    <label className="grid gap-1 text-sm">
      <span className="font-medium">
        {label} {required ? <span className="opacity-70">*</span> : null}
      </span>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 rounded-xl border bg-white/85 px-3 outline-none focus:ring-2"
        style={{ borderColor: "var(--congreso-border)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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
    <label className="grid gap-1 text-sm">
      <span className="font-medium">
        {label} {required ? <span className="opacity-70">*</span> : null}
      </span>
      <textarea
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-28 rounded-xl border bg-white/85 p-3 outline-none focus:ring-2"
        style={{ borderColor: "var(--congreso-border)" }}
      />
    </label>
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
    <label className="grid gap-1 text-sm">
      <span className="font-medium">
        {label} {required ? <span className="opacity-70">*</span> : null}
      </span>
      {helper ? <span className="text-xs opacity-75">{helper}</span> : null}
      <input
        type="file"
        accept={accept}
        required={required}
        onChange={(e) => onChange(e.target.files?.[0])}
        className="rounded-xl border bg-white/85 p-2"
        style={{ borderColor: "var(--congreso-border)" }}
      />
    </label>
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
    <button
      type="submit"
      disabled={loading}
      className="mt-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
      style={{
        background: "var(--congreso-secondary)",
        color: "var(--congreso-text-on-dark)",
      }}
    >
      {loading ? "Enviando..." : children}
    </button>
  );
}

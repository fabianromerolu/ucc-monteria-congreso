"use client";

import * as React from "react";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm">{children}</label>;
}

function Req({ required }: { required?: boolean }) {
  return required ? <span className="opacity-70">*</span> : null;
}

export function Divider({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
      <p className="font-semibold">{title}</p>
      {desc ? <p className="mt-1 text-sm opacity-80">{desc}</p> : null}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className="relative inline-flex h-6 w-11 items-center rounded-full border border-black/10 bg-black/10 px-1 transition"
        aria-hidden
      >
        <span
          className={[
            "h-4 w-4 rounded-full bg-white shadow transition",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="form-input disabled:opacity-50"
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
  disabled,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <Label>
      <span className="font-medium">
        {label} <Req required={required} />
      </span>
      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="form-select disabled:opacity-50"
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <Label>
      <span className="font-medium">
        {label} <Req required={required} />
      </span>
      <textarea
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="form-textarea disabled:opacity-50"
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

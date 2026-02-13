import type { ReactNode } from "react";
import { AdminFormField, type AdminFormFieldProps } from "./AdminFormField";

interface AdminFormSectionProps {
  title: string;
  children: ReactNode;
}

export function AdminFormSection({ title, children }: AdminFormSectionProps) {
  return (
    <section className="space-y-2 rounded bg-white">
      <h2 className="fw-l tx-16 border-b border-neutral-200 p-4">{title}</h2>
      <div className="px-4 pt-2 pb-6">{children}</div>
    </section>
  );
}

// Helper component that combines section with field
interface AdminFormSectionWithFieldProps {
  title: string;
  fieldProps: AdminFormFieldProps;
  error?: string;
}

export function AdminFormSectionWithField({
  title,
  fieldProps,
  error,
}: AdminFormSectionWithFieldProps) {
  return (
    <AdminFormSection title={title}>
      <AdminFormField {...fieldProps} error={error} />
    </AdminFormSection>
  );
}

import type { ReactNode } from "react";
import { AdminFormField, type AdminFormFieldProps } from "./AdminFormField";

interface AdminFormSectionProps {
  title: string;
  children: ReactNode;
}

export function AdminFormSection({ title, children }: AdminFormSectionProps) {
  return (
    <section className="space-y-2 p-4 rounded bg-white">
      <h2 className="fw-l tx-16">{title}</h2>
      {children}
    </section>
  );
}

// Helper component that combines section with field
interface AdminFormSectionWithFieldProps {
  title: string;
  fieldProps: AdminFormFieldProps;
}

export function AdminFormSectionWithField({
  title,
  fieldProps,
}: AdminFormSectionWithFieldProps) {
  return (
    <AdminFormSection title={title}>
      <AdminFormField {...fieldProps} />
    </AdminFormSection>
  );
}

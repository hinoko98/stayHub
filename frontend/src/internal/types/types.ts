import type { ReactNode } from "react";

export type SessionUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  status: string;
};

export type Session = {
  token: string;
  user: SessionUser;
};

export type ListResponse<T> = {
  items: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "password" | "textarea" | "select" | "checkbox" | "datetime-local" | "date";
  required?: boolean;
  requiredOnCreate?: boolean;
  requiredOnEdit?: boolean;
  hiddenOnEdit?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  defaultValue?: string | number | boolean;
  helpText?: string;
};

export type ColumnConfig<T> = {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
};

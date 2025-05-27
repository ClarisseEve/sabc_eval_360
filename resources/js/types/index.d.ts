export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  region?: string;
  department?: string;
  avatar?: string;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
  active?: boolean;
}

export interface SharedData {
  auth: {
    user: User | null;
  };
  ziggy: {
    url: string;
    port: number | null;
    defaults: Record<string, any>;
    routes: Record<string, any>;
  };
  [key: string]: any; // Index signature pour satisfaire la contrainte PageProps
}

declare global {
  function route(name: string, params?: Record<string, any>, absolute?: boolean): string;
}

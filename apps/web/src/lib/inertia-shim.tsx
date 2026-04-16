/**
 * Inertia.js compatibility shim for NestJS migration.
 *
 * Provides drop-in replacements for the most-used @inertiajs/react APIs
 * backed by React Router DOM + fetch/JWT so that existing page components
 * require minimal changes.
 *
 * Usage:  replace  import { router, usePage, … } from '@inertiajs/react'
 *         with     import { router, usePage, … } from '@/lib/inertia-shim'
 */
import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Link as RRLink, useNavigate, useLocation } from 'react-router-dom';
import type { LinkProps as RRLinkProps } from 'react-router-dom';
import api from '@/Services/api';

// ─── Page props store (replaces Inertia shared data) ─────────────────────────
interface PageStore {
  props: Record<string, any>;
  url: string;
  component: string;
}

const PageContext = createContext<PageStore>({
  props: {},
  url: '',
  component: '',
});

export const PagePropsProvider: React.FC<{
  initialProps?: Record<string, any>;
  children: React.ReactNode;
}> = ({ initialProps = {}, children }) => {
  const location = useLocation();
  const [store, setStore] = useState<PageStore>({
    props: initialProps,
    url: location.pathname,
    component: '',
  });

  // Keep URL in sync
  useEffect(() => {
    setStore((prev) => ({ ...prev, url: location.pathname }));
  }, [location.pathname]);

  return <PageContext.Provider value={store}>{children}</PageContext.Provider>;
};

// ─── usePage() shim ──────────────────────────────────────────────────────────
export function usePage<T = Record<string, any>>(): {
  props: T & { auth?: { user: any }; errors?: Record<string, string>; flash?: Record<string, string> };
  url: string;
  component: string;
} {
  const ctx = useContext(PageContext);
  return ctx as any;
}

// ─── router shim ─────────────────────────────────────────────────────────────
// A stateless helper that mirrors Inertia's router.visit / router.post / etc.
// Components that need navigation should use this OR useNavigate() directly.
let _navigate: ReturnType<typeof useNavigate> | null = null;
type NavigateHandler = (to: string, options?: { replace?: boolean }) => void;

/** Must be called once inside the Router tree (e.g. in App root) */
export function useInitRouter() {
  const nav = useNavigate();
  useEffect(() => {
    _navigate = nav;
  }, [nav]);
}

function ensureNavigate(): NavigateHandler {
  if (!_navigate) {
    // Fallback to location change
    return (to: string) => {
      globalThis.location.href = to;
    };
  }
  return (to: string, options?: { replace?: boolean }) => {
    _navigate?.(to, options);
  };
}

type RouterOptions = {
  method?: string;
  data?: any;
  replace?: boolean;
  preserveScroll?: boolean;
  preserveState?: boolean;
  onSuccess?: (page?: any) => void;
  onError?: (errors: Record<string, string>) => void;
  onFinish?: () => void;
};

export const router = {
  visit(url: string, options: RouterOptions = {}) {
    const nav = ensureNavigate();
    if (options.replace) {
      nav(url, { replace: true });
    } else {
      nav(url);
    }
    options.onSuccess?.();
    options.onFinish?.();
  },

  async get(url: string, data?: any, options: RouterOptions = {}) {
    try {
      const res = await api.get(url, { params: data });
      options.onSuccess?.(res.data);
    } catch (err: any) {
      options.onError?.(err.response?.data?.errors || {});
    } finally {
      options.onFinish?.();
    }
  },

  async post(url: string, data?: any, options: RouterOptions = {}) {
    try {
      const res = await api.post(url, data);
      options.onSuccess?.(res.data);
      // If the URL looks like a page route (not /api/...), navigate there
      if (!url.startsWith('/api')) {
        const nav = ensureNavigate();
        nav(url, { replace: options.replace });
      }
    } catch (err: any) {
      options.onError?.(err.response?.data?.errors || { _: err.message });
    } finally {
      options.onFinish?.();
    }
  },

  async put(url: string, data?: any, options: RouterOptions = {}) {
    try {
      const res = await api.put(url, data);
      options.onSuccess?.(res.data);
    } catch (err: any) {
      options.onError?.(err.response?.data?.errors || {});
    } finally {
      options.onFinish?.();
    }
  },

  async patch(url: string, data?: any, options: RouterOptions = {}) {
    try {
      const res = await api.patch(url, data);
      options.onSuccess?.(res.data);
    } catch (err: any) {
      options.onError?.(err.response?.data?.errors || {});
    } finally {
      options.onFinish?.();
    }
  },

  async delete(url: string, options: RouterOptions = {}) {
    try {
      const res = await api.delete(url);
      options.onSuccess?.(res.data);
    } catch (err: any) {
      options.onError?.(err.response?.data?.errors || {});
    } finally {
      options.onFinish?.();
    }
  },

  reload(options?: RouterOptions) {
    globalThis.location.reload();
  },
};

// ─── useForm() shim ─────────────────────────────────────────────────────────
export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [data, setData_] = useState<T>({ ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const setData = useCallback(
    (key: keyof T | T, value?: any) => {
      if (typeof key === 'object') {
        setData_(key);
      } else {
        setData_((prev) => ({ ...prev, [key]: value }));
      }
    },
    [],
  );

  const reset = useCallback(
    (...keys: (keyof T)[]) => {
      if (keys.length === 0) {
        setData_({ ...initialValues });
      } else {
        setData_((prev) => {
          const next = { ...prev };
          keys.forEach((k) => {
            (next as any)[k] = (initialValues as any)[k];
          });
          return next;
        });
      }
      setErrors({});
    },
    [initialValues],
  );

  const clearErrors = useCallback((...keys: (keyof T)[]) => {
    if (keys.length === 0) {
      setErrors({});
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  }, []);

  const isRouterOptions = (value: any): value is RouterOptions => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const optionKeys: Array<keyof RouterOptions> = [
      'method',
      'data',
      'replace',
      'preserveScroll',
      'preserveState',
      'onSuccess',
      'onError',
      'onFinish',
    ];

    return optionKeys.some((key) => key in value);
  };

  const submit = useCallback(
    async (
      method: 'get' | 'post' | 'put' | 'patch' | 'delete',
      url: string,
      payload?: any,
      options?: RouterOptions,
    ) => {
      setProcessing(true);
      setErrors({});
      try {
        const requestData = payload ?? data;
        let res;
        if (method === 'get' || method === 'delete') {
          res = await api[method](url, method === 'get' ? { params: requestData } : undefined);
        } else {
          res = await api[method](url, requestData);
        }
        setRecentlySuccessful(true);
        setTimeout(() => setRecentlySuccessful(false), 2000);
        options?.onSuccess?.(res.data);
        return res.data;
      } catch (err: any) {
        const serverErrors = err.response?.data?.errors || err.response?.data?.message;
        if (typeof serverErrors === 'object') {
          setErrors(serverErrors);
        } else if (typeof serverErrors === 'string') {
          setErrors({ _: serverErrors } as any);
        }
        options?.onError?.(serverErrors || {});
        throw err;
      } finally {
        setProcessing(false);
        options?.onFinish?.();
      }
    },
    [data],
  );

  const post = useCallback(
    (url: string, dataOrOptions?: any, maybeOptions?: RouterOptions) =>
      submit('post', url, isRouterOptions(dataOrOptions) ? undefined : dataOrOptions, isRouterOptions(dataOrOptions) ? dataOrOptions : maybeOptions),
    [submit],
  );

  const put = useCallback(
    (url: string, dataOrOptions?: any, maybeOptions?: RouterOptions) =>
      submit('put', url, isRouterOptions(dataOrOptions) ? undefined : dataOrOptions, isRouterOptions(dataOrOptions) ? dataOrOptions : maybeOptions),
    [submit],
  );

  const patch = useCallback(
    (url: string, dataOrOptions?: any, maybeOptions?: RouterOptions) =>
      submit('patch', url, isRouterOptions(dataOrOptions) ? undefined : dataOrOptions, isRouterOptions(dataOrOptions) ? dataOrOptions : maybeOptions),
    [submit],
  );

  const get = useCallback(
    (url: string, dataOrOptions?: any, maybeOptions?: RouterOptions) =>
      submit('get', url, isRouterOptions(dataOrOptions) ? undefined : dataOrOptions, isRouterOptions(dataOrOptions) ? dataOrOptions : maybeOptions),
    [submit],
  );

  const deleteMethod = useCallback(
    (url: string, options?: RouterOptions) => submit('delete', url, options),
    [submit],
  );

  return {
    data,
    setData,
    errors,
    processing,
    recentlySuccessful,
    reset,
    clearErrors,
    post,
    put,
    patch,
    get,
    delete: deleteMethod,
    submit,
    transform: (cb: (data: T) => T) => setData_(cb(data)),
  };
}

// ─── Head shim ───────────────────────────────────────────────────────────────
export const Head: React.FC<{ title?: string; children?: React.ReactNode }> = ({ title, children }) => {
  useEffect(() => {
    if (title) {
      const appName = import.meta.env.VITE_APP_NAME || 'SABC Eval360';
      document.title = `${title} - ${appName}`;
    }
  }, [title]);
  return null;
};

// ─── Link shim ───────────────────────────────────────────────────────────────
interface InertiaLinkProps extends Omit<RRLinkProps, 'to'> {
  href: string;
  method?: 'get' | 'post' | 'put' | 'delete';
  data?: any;
  preserveScroll?: boolean;
  preserveState?: boolean;
  as?: string;
}

export const Link: React.FC<InertiaLinkProps> = ({
  href,
  method = 'get',
  data,
  children,
  preserveScroll,
  preserveState,
  as,
  ...rest
}) => {
  if (method !== 'get') {
    // For non-GET links, use a button/anchor that calls the router
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      (router as any)[method](href, data);
    };
    const Component = as || 'a';
    return (
      <Component href={href} onClick={handleClick} {...(rest as any)}>
        {children}
      </Component>
    );
  }

  return (
    <RRLink to={href} {...rest}>
      {children}
    </RRLink>
  );
};

// ─── createInertiaApp shim (no-op for compatibility) ─────────────────────────
export function createInertiaApp(_opts: any) {
  // No-op — the real app uses createBrowserRouter now
}

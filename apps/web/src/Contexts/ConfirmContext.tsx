import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/Components/UI/Dialog/Dialog';
import { Button } from '@/Components/UI/Button/Button';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'destructive' pour les actions irréversibles (suppression…). Défaut : 'default'. */
  variant?: 'default' | 'destructive';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // Un second confirm() écraserait le resolver du premier, dont l'appelant
    // resterait bloqué indéfiniment sur son await: on le tranche à false.
    resolver.current?.(false);
    resolver.current = null;
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  // Même précaution au démontage du provider.
  useEffect(() => {
    return () => {
      resolver.current?.(false);
      resolver.current = null;
    };
  }, []);

  const settle = useCallback((value: boolean) => {
    setOpen(false);
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : settle(false))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{options?.title}</DialogTitle>
            {options?.description ? <DialogDescription>{options.description}</DialogDescription> : null}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => settle(false)}>
              {options?.cancelLabel ?? 'Annuler'}
            </Button>
            <Button
              variant={options?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm doit être utilisé à l’intérieur d’un <ConfirmProvider>');
  }
  return ctx;
};

export default ConfirmContext;

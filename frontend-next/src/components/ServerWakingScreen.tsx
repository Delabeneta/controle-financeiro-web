'use client';

import { useEffect, useState } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface Props {
  waking: boolean;
  failed: boolean;
  onRetry: () => void;
  onBackToLogin: () => void;
}

export function ServerWakingScreen({ waking, failed, onRetry, onBackToLogin }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!waking || failed) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [waking, failed]);

  // Instante antes do efeito inicial rodar: só o spinner
  if (!waking && !failed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
        {failed ? (
          <>
            <WifiOff className="w-10 h-10 mx-auto text-destructive" />
            <h1 className="text-lg font-semibold">Não foi possível conectar</h1>
            <p className="text-sm text-gray-600">
              O servidor não respondeu. Verifique sua conexão e tente novamente.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={onRetry}>Tentar novamente</Button>
              <Button variant="outline" onClick={onBackToLogin}>Ir para o login</Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
            <h1 className="text-lg font-semibold">Iniciando o servidor…</h1>
            <p className="text-sm text-gray-600">
              {seconds < 6
                ? 'Conectando…'
                : 'O servidor estava em repouso e está acordando. Isso costuma levar de 30 a 60 segundos.'}
            </p>
            {seconds >= 20 && (
              <Button variant="outline" onClick={onBackToLogin} className="mt-2">
                Ir para o login
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
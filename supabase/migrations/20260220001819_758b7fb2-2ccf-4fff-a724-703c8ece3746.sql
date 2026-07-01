
-- Função para limpar automaticamente chamadas presas
CREATE OR REPLACE FUNCTION public.cleanup_stuck_calls()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ended_count INTEGER;
BEGIN
  -- Terminar chamadas em "ringing" há mais de 90 segundos
  UPDATE public.calls
  SET 
    status = 'ended',
    ended_at = now(),
    end_reason = 'no_answer',
    updated_at = now()
  WHERE status = 'ringing'
    AND created_at < now() - INTERVAL '90 seconds';

  -- Terminar chamadas em "ongoing" sem actividade há mais de 4 horas
  UPDATE public.calls
  SET 
    status = 'ended',
    ended_at = now(),
    end_reason = 'completed',
    duration_seconds = CASE 
      WHEN started_at IS NOT NULL THEN EXTRACT(EPOCH FROM (now() - started_at))::int
      ELSE NULL
    END,
    updated_at = now()
  WHERE status = 'ongoing'
    AND updated_at < now() - INTERVAL '4 hours';

  GET DIAGNOSTICS ended_count = ROW_COUNT;

  -- Actualizar participantes das chamadas encerradas que ainda estão em estado activo
  UPDATE public.call_participants cp
  SET status = 'left', left_at = now()
  FROM public.calls c
  WHERE cp.call_id = c.id
    AND c.status = 'ended'
    AND cp.status IN ('ringing', 'connected')
    AND cp.left_at IS NULL;

  RETURN ended_count;
END;
$$;

-- Índice para acelerar as queries de limpeza
CREATE INDEX IF NOT EXISTS idx_calls_status_created_at 
  ON public.calls(status, created_at) 
  WHERE status IN ('ringing', 'ongoing');

CREATE INDEX IF NOT EXISTS idx_calls_status_updated_at 
  ON public.calls(status, updated_at) 
  WHERE status = 'ongoing';

-- Índice para sinais de chamada por utilizador destinatário (melhora detecção de chamadas)
CREATE INDEX IF NOT EXISTS idx_call_signals_to_user_processed
  ON public.call_signals(to_user_id, processed, created_at DESC)
  WHERE processed = false;

import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MapPin, Loader2, ShieldCheck, Home, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AFRICAN_LOCATIONS } from '@/lib/african-locations';
import { NEIGHBORHOOD_COORDINATES } from '@/lib/neighborhood-coordinates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  current: { country_code: string | null; city: string | null; neighborhood: string | null };
  onChanged: () => void;
}

interface Residency {
  status: 'none' | 'novo' | 'residente' | 'verificado';
  days?: number;
  activity?: number;
  next_change_at?: string;
  can_change_now?: boolean;
}

/** Coordinates for a (country, city, neighborhood), when we know them. */
function lookupCoords(countryCode: string, city: string, name: string) {
  const c = NEIGHBORHOOD_COORDINATES.find(
    (x) => x.countryCode === countryCode && x.city.toLowerCase() === city.toLowerCase(),
  );
  const n = c?.neighborhoods.find((y) => y.name.toLowerCase() === name.toLowerCase());
  return n ? { lat: n.lat, lng: n.lng } : null;
}

const RESIDENCY_BADGE: Record<string, { label: string; className: string; icon: typeof Home }> = {
  novo: { label: 'Novo na banda', className: 'bg-amber-500/15 text-amber-600', icon: Home },
  residente: { label: 'Residente', className: 'bg-sky-500/15 text-sky-600', icon: Home },
  verificado: { label: 'Residente verificado', className: 'bg-emerald-500/15 text-emerald-600', icon: ShieldCheck },
};

/** "Mudei-me" — change the user's banda (neighborhood). One change per 60 days.
 *  Captures the new location so the AFROLOC code regenerates for the new place. */
export function BandaChangeSheet({ open, onOpenChange, current, onChanged }: Props) {
  const [country, setCountry] = useState(current.country_code || 'AO');
  const [city, setCity] = useState(current.city || '');
  const [neighborhood, setNeighborhood] = useState(current.neighborhood || '');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [residency, setResidency] = useState<Residency | null>(null);

  useEffect(() => {
    if (!open) return;
    setCountry(current.country_code || 'AO');
    setCity(current.city || '');
    setNeighborhood(current.neighborhood || '');
    setGps(null);
    supabase.rpc('banda_residency', {}).then(({ data }) => setResidency((data as Residency) ?? null));
  }, [open, current]);

  const countryData = useMemo(() => AFRICAN_LOCATIONS.find((l) => l.countryCode === country), [country]);
  const cities = countryData?.cities ?? [];
  const neighborhoods = cities.find((c) => c.name === city)?.neighborhoods ?? [];

  const changingBanda = neighborhood.trim() !== (current.neighborhood || '').trim()
    || city.trim() !== (current.city || '').trim();
  const blockedByCooldown = changingBanda && residency?.can_change_now === false;
  const nextChange = residency?.next_change_at
    ? new Date(residency.next_change_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const useGps = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 }),
      );
      setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      toast.success('Localização captada.');
    } catch {
      toast.error('Não foi possível obter a localização.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (!neighborhood || !city) {
      toast.info('Escolhe cidade e bairro.');
      return;
    }
    setSaving(true);
    try {
      const coords = gps ?? lookupCoords(country, city, neighborhood);
      const { data, error } = await supabase.rpc('change_banda', {
        p_name: neighborhood,
        p_city: city,
        p_country: country,
        p_lat: coords?.lat ?? null,
        p_lng: coords?.lng ?? null,
        p_neighborhood: neighborhood,
      });
      if (error) throw error;
      const res = data as { ok: boolean; reason?: string; next_change_at?: string };
      if (!res.ok) {
        if (res.reason === 'cooldown') {
          const d = res.next_change_at
            ? new Date(res.next_change_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
            : '';
          toast.error(`Só podes mudar de banda a partir de ${d}.`);
        } else {
          toast.error('Não foi possível mudar de banda.');
        }
        return;
      }
      toast.success(changingBanda ? 'Mudaste de banda! 🏡' : 'Localização atualizada.');
      onChanged();
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível mudar de banda.');
    } finally {
      setSaving(false);
    }
  };

  const badge = residency && residency.status !== 'none' ? RESIDENCY_BADGE[residency.status] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> A minha banda</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Current banda + residency */}
          <div className="rounded-2xl bg-secondary/50 p-4 space-y-2">
            <div className="text-sm text-muted-foreground">Banda atual</div>
            <div className="text-base font-semibold">
              {current.neighborhood || '—'}{current.city ? ` · ${current.city}` : ''}
            </div>
            {badge && (
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', badge.className)}>
                <badge.icon className="w-3.5 h-3.5" /> {badge.label}
              </span>
            )}
            {residency?.status === 'residente' && (
              <p className="text-[11px] text-muted-foreground">
                Participa na banda (publica, entra em lives) para te tornares <b>residente verificado</b>.
              </p>
            )}
          </div>

          {/* Cooldown notice */}
          {residency?.can_change_now === false && nextChange && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 text-amber-700 p-3 text-xs">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Mudaste de banda há pouco. Podes voltar a mudar a partir de <b>{nextChange}</b>.</span>
            </div>
          )}

          {/* Mudei-me — new location */}
          <div className="space-y-3 pt-1">
            <Label className="text-sm font-medium">Mudei-me — para onde?</Label>

            <div className="grid grid-cols-1 gap-3">
              <Select value={country} onValueChange={(v) => { setCountry(v); setCity(''); setNeighborhood(''); }}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="País" /></SelectTrigger>
                <SelectContent className="z-[9999] max-h-64">
                  {AFRICAN_LOCATIONS.map((l) => (
                    <SelectItem key={l.countryCode} value={l.countryCode}>{l.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={city} onValueChange={(v) => { setCity(v); setNeighborhood(''); }}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Cidade" /></SelectTrigger>
                <SelectContent className="z-[9999] max-h-64">
                  {cities.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!city}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Bairro / banda" /></SelectTrigger>
                <SelectContent className="z-[9999] max-h-64">
                  {neighborhoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button" variant="outline"
              className={cn('w-full h-11 rounded-xl', gps && 'border-green-500 text-green-600')}
              onClick={useGps} disabled={locating}
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 mr-1" />}
              {gps ? 'Localização captada ✓' : 'Usar a minha localização (mais preciso)'}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              A tua localização gera o teu código AFROLOC. Sem GPS, usamos o centro do bairro escolhido.
            </p>
          </div>

          <Button
            className="w-full h-12 rounded-xl"
            onClick={save}
            disabled={saving || blockedByCooldown || !neighborhood || !city}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (changingBanda ? 'Confirmar mudança' : 'Guardar')}
          </Button>
          {blockedByCooldown && (
            <p className="text-[11px] text-center text-muted-foreground">Em período de espera até {nextChange}.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

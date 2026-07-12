-- ============================================================================
-- Angola — alargar o mapa banda→(província, município, comuna) a mais cidades
-- suportadas pelo Yamilook: Benguela, Huambo, Lubango + completar Luanda.
-- Mesma regra: banda que É município mapeia a si; sub-municipal → município-pai
-- (a banda vira comuna). PROV = segmento da província; MUN/COM = slug3(nome).
-- Nota: em Benguela/Huambo alguns "bairros" do Yamilook são MUNICÍPIOS próprios
-- (Lobito, Catumbela, Caála, Bailundo); em Huíla não há município "Huíla"
-- (é comuna de Lubango). best_effort=true nos limites incertos.
-- ============================================================================

insert into public.afroloc_banda_division
  (country_code, city, banda_norm, prov_seg, mun_slug, com_slug, is_municipality, best_effort) values
  -- ── Benguela (província AO-BGU) ──────────────────────────────────────────
  ('AO','Benguela','centro',          'BGU','BEN','CEN', false, false),
  ('AO','Benguela','lobito',          'BGU','LOB','LOB', true,  false),  -- município próprio
  ('AO','Benguela','catumbela',       'BGU','CAT','CAT', true,  false),  -- município próprio
  ('AO','Benguela','bairro 11',       'BGU','BEN','BAI', false, false),
  ('AO','Benguela','bairro da graça', 'BGU','BEN','BAI', false, false),
  -- ── Huambo (província AO-HUA) ────────────────────────────────────────────
  ('AO','Huambo','centro',     'HUA','HUA','CEN', false, false),
  ('AO','Huambo','caála',      'HUA','CAA','CAA', true,  false),  -- município próprio
  ('AO','Huambo','bailundo',   'HUA','BAI','BAI', true,  false),  -- município próprio
  ('AO','Huambo','bom pastor', 'HUA','HUA','BOM', false, false),
  ('AO','Huambo','académica',  'HUA','HUA','ACA', false, false),
  -- ── Lubango (província AO-HUI; município-capital = Lubango) ───────────────
  ('AO','Lubango','centro',   'HUI','LUB','CEN', false, false),
  ('AO','Lubango','huíla',    'HUI','LUB','HUI', false, false),  -- comuna de Lubango, não município
  ('AO','Lubango','mapunda',  'HUI','LUB','MAP', false, false),
  ('AO','Lubango','lucrécia', 'HUI','LUB','LUC', false, false),
  -- ── Luanda — completar os bairros restantes do ficheiro de coordenadas ────
  ('AO','Luanda','cazenga',    'LUA','CAZ','CAZ', true,  false),  -- município próprio
  ('AO','Luanda','maculusso',  'LUA','ING','MAC', false, false),  -- Ingombota
  ('AO','Luanda','vila alice', 'LUA','MAI','VIL', false, false),  -- Maianga
  ('AO','Luanda','prenda',     'LUA','MAI','PRE', false, false),  -- Maianga
  ('AO','Luanda','marçal',     'LUA','RAN','MAR', false, true),   -- Rangel (limite Sambizanga)
  ('AO','Luanda','são paulo',  'LUA','RAN','SAO', false, true),   -- Rangel (limite Sambizanga)
  ('AO','Luanda','golf 2',     'LUA','KIL','GOL', false, false),  -- Kilamba Kiaxi
  ('AO','Luanda','zona verde', 'LUA','TAL','ZON', false, true),   -- Talatona (limite Belas)
  ('AO','Luanda','zango',      'LUA','VIA','ZAN', false, false),  -- Viana
  ('AO','Luanda','dangereux',  'LUA','SAM','DAN', false, true)    -- Sambizanga (bairro precário)
on conflict (country_code, city, banda_norm) do update set
  prov_seg=excluded.prov_seg, mun_slug=excluded.mun_slug, com_slug=excluded.com_slug,
  is_municipality=excluded.is_municipality, best_effort=excluded.best_effort;

notify pgrst, 'reload schema';

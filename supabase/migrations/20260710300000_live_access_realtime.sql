-- live_access não estava no realtime → o painel "Pedidos" do anfitrião
-- (que escuta live_access) nunca era notificado de novos pedidos. Ligar.
alter publication supabase_realtime add table public.live_access;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_banda_fk
  FOREIGN KEY (banda_id) REFERENCES public.bandas(id);

ALTER TABLE public.palcos
  ADD CONSTRAINT palcos_banda_fk
  FOREIGN KEY (banda_id) REFERENCES public.bandas(id);
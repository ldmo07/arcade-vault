-- SPEC 07: Caída (Tetris) pasa a ser jugable
update public.games set playable = true where id = 'caida';

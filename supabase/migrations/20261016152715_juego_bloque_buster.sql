-- SPEC 08: Bloque Buster (Arkanoid) pasa a ser jugable
update public.games set playable = true where id = 'bloque-buster';

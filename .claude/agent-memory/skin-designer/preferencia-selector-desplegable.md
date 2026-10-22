---
name: preferencia-selector-desplegable
description: El usuario quiere el selector de skins como lista desplegable (select), no como chips
metadata:
  type: feedback
---

El selector de skins es una lista desplegable (`<select>` nativo con `<label>` "Skin", clase `.skin-select`), no 3 `.chip`. Lo pidió el usuario el 2026-10-22, después de ver la primera versión con chips en asteroides.

**Why:** preferencia explícita del usuario; el contrato del agente decía "3 `.chip`", pero la petición del usuario manda (`references/skin-contract.md` ya está actualizado).
**How to apply:** en los siguientes juegos no recrear chips. Basta con `skins: true` en el registro, porque `GamePlayer` ya pinta el desplegable (alto ≥ 44 px, etiquetas con tilde, `blur` al cambiar).

Relacionado: [[trampas-motores]]

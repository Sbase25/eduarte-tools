# Eduarte Tools

Een Chrome-extensie die het Eduarte-studentenportaal 
fijner maakt om te gebruiken:
automatisch inloggen, donkere modus, een eigen kleurenthema, en een
glasmorfisme-preset. Geïnspireerd door [Study Tools voor
Magister](https://github.com/QkeleQ10/Study-Tools).

## Functies

- **Automatisch inloggen** op de Microsoft ADFS-inlogpagina, met optioneel
  automatisch verzenden (geen klik nodig).
- **Donkere modus** — herschrijft Eduarte's eigen CSS-tokens
  (`--color-bg`, `--color-text-primary`, ...) in plaats van een grove
  kleuromkering, dus het blijft er native uitzien.
- **Accentkleur** — kies je eigen kleur voor knoppen en links.
- **Moderne stijl** — rondere hoeken, zachte schaduwen, subtiele
  hover-/laadanimaties, gebouwd op Eduarte's eigen `--border-radius-*`
  schaal zodat het overal tegelijk werkt (kaarten, tabellen, tabs).
- **"Human"-thema** — een donker glaseffect met een vervagende
  achtergrondfoto, geïnspireerd op het gelijknamige thema van Study Tools
  voor Magister (door Nick Verbruggen).
- **Eigen thema** — kies 4 basiskleuren (achtergrond, oppervlak, tekst,
  randen); de rest wordt automatisch afgeleid.

## Installatie

1. Download of clone deze repository.
2. Open `chrome://extensions` in Chrome of Edge.
3. Zet **Ontwikkelaarsmodus** aan (rechtsboven).
4. Klik **Uitgepakte extensie laden** en kies deze map.
5. Klik op het extensie-icoon, vul je gegevens in bij **Inloggen**, en
   stel je uiterlijk in bij **Uiterlijk** / **Eigen thema**.

Gegevens worden alleen lokaal in je browser opgeslagen
(`chrome.storage.local`) en nergens naartoe verzonden.

## Waarom dit bestaat

Eduarte's studentenportaal draait op een server-gerenderde Java/Wicket-app
zonder een publieke JSON-API zoals Magister die heeft, dus een volledige
herbouw zoals Study Tools' "Start"-dashboard is (nog) niet gedaan. Deze
extensie richt zich op wat wél robuust en breed toepasbaar is: theming via
Eduarte's eigen CSS-tokensysteem.

## Bijdragen

Heb je toegang tot een andere Eduarte-omgeving en werkt iets niet? Open een
issue met de relevante HTML (Rechtsklik → Inspecteren → Copy outerHTML) zodat
selectors gericht aangepast kunnen worden.

## Licentie

MIT — zie [LICENSE](LICENSE).

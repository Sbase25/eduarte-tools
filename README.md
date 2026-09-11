
<img width="32" height="32" alt="image" src="https://github.com/user-attachments/assets/da601ae4-1599-4e6c-a09d-42d0209f5c85" />



# Eduarte Tools

Een Chrome-extensie die het Eduarte-studentenportaal 
fijner maakt om te gebruiken:
automatisch inloggen op meerdere Eduarte-omgevingen, donkere modus, een
eigen kleurenthema, een cijfercalculator en een glasmorfisme-preset. Geïnspireerd door [Study Tools voor
Magister](https://github.com/QkeleQ10/Study-Tools).

## Functies

- **Automatisch inloggen** op Eduarte/ADFS- en Microsoft-inlogpagina's van
  verschillende Eduarte- en Educus-omgevingen, met optioneel automatisch
  verzenden (geen klik nodig).
- **Cijfercalculator** — berekent het gewogen gemiddelde, de mediaan en welk
  cijfer je met een bepaalde weging nodig hebt voor je doelgemiddelde.
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





### Chrome Web Store

1. Maak een ontwikkelaarsaccount aan op
   [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Kies **New item** en upload een ZIP met de bestanden uit deze map.
3. Vul beschrijving, screenshots, pictogrammen, categorie en privacygegevens in.
4. Geef bij **Single purpose** en datagebruik aan dat loginvoorkeuren lokaal in
   `chrome.storage.local` worden opgeslagen.
5. Sla op en stuur de extensie ter beoordeling in.

Gebruik voor iedere nieuwe versie een hoger versienummer in `manifest.json` en
upload opnieuw. Upload alleen de extensiebestanden; voeg geen `.git`-map toe.

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


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
- **Start Dashboard Weer- & Begroeting Widget** — live temperatuur, weersicoon,
  neerslagkans en tijdgebonden begroeting direct op je Eduarte startpagina.
- **Uitgebreide Thema Presets** — kies direct uit Donker, Blauw, Paars, Smaragd,
  Sunset, OLED Zwart, Nord, Cyberpunk of Licht.
- **Eigen achtergrond & Glassmorphism** — stel je eigen wallpaper URL in met
  aanpasbare achtergrondvervaging (blur) en overlay-intensiteit.
- **Typografie / Lettertypen** — kies uit strakke fonts zoals Inter, Roboto, Poppins,
  Lexend of JetBrains Mono.
- **Donkere modus & Accentkleuren** — herschrijft Eduarte's eigen CSS-tokens
  (`--color-bg`, `--color-text-primary`, ...) met dynamische accenten en custom CSS ondersteuning.
- **"Human"-thema** — het iconische donkere glaseffect met achtergrondfoto,
  geïnspireerd op Study Tools voor Magister (door Nick Verbruggen).
- **Eigen thema** — kies 4 basiskleuren (achtergrond, oppervlak, tekst,
  randen); de rest wordt automatisch afgeleid.
- **Huiswerk & Deadlines Widget** — houd zelf je huiswerk en deadlines bij
  (vak, omschrijving, datum) met kleurcodering naar urgentie, direct op het
  dashboard.
- **CSV-export cijfers** — exporteer je ingevoerde cijfers en wegingen vanuit
  de Cijfercalculator als CSV-bestand (Excel-compatibel) met één klik.
- **Aanpasbare Sneltoetsen** — spring met een zelf ingestelde toetscombinatie
  (bijv. Ctrl+A → Agenda, Ctrl+R → Resultaten) direct naar een Eduarte-pagina.
- **Aan/uit-zetbare Widgets** — Pomodoro Focus Timer, Snelle Cijfercalculator,
  Snelkoppelingen en Dagelijkse Studie-Tip, elk apart in- of uit te schakelen.
- **Meldingen-badge op extensie-icoon** — toont het aantal ongelezen items dat
  Eduarte zelf al toont (bijv. bij Berichten) als cijfer op het extensie-icoon.
  Best-effort: de detectie is generiek en kan per schoolomgeving verschillen.

## Installatie

1. Download of clone deze repository.
2. Open `chrome://extensions` in Chrome of Edge.
3. Zet **Ontwikkelaarsmodus** aan (rechtsboven).
4. Klik **Uitgepakte extensie laden** en kies deze map.
5. Klik op het extensie-icoon, vul je gegevens in bij **Inloggen**, en
   stel je uiterlijk in bij **Uiterlijk** / **Eigen thema**.

Gegevens worden alleen lokaal in je browser opgeslagen
(`chrome.storage.local`) en nergens naartoe verzonden.



## Ontwikkelen aan de popup

De instellingenpopup is een echte **Vue 3 + Material 3 Expressive**-app,
net als Study Tools voor Magister. De broncode staat in `popup-app/` en
wordt gebouwd naar de kant-en-klare, gecommitte map `popup-dist/` — de
extensie laadt altijd `popup-dist/index.html`, dus je hoeft niets te
bouwen om de extensie zelf te gebruiken.

Wil je aan de popup zelf werken?

```bash
cd popup-app
npm install
npm run dev      # lokale preview met hot reload
npm run build    # bouwt naar ../popup-dist
```

Vergeet niet om na wijzigingen `npm run build` te draaien en de output in
`popup-dist/` mee te committen.

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

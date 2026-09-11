
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

## Installatie

1. Download of clone deze repository.
2. Open `chrome://extensions` in Chrome of Edge.
3. Zet **Ontwikkelaarsmodus** aan (rechtsboven).
4. Klik **Uitgepakte extensie laden** en kies deze map.
5. Klik op het extensie-icoon, vul je gegevens in bij **Inloggen**, en
   stel je uiterlijk in bij **Uiterlijk** / **Eigen thema**.

Gegevens worden alleen lokaal in je browser opgeslagen
(`chrome.storage.local`) en nergens naartoe verzonden.

## Publiceren

### GitHub

Maak eerst een repository aan en voer in deze projectmap uit:

```bash
git add .
git commit -m "Prepare Eduarte Tools"
git branch -M main
git remote add origin https://github.com/<gebruikersnaam>/<repository>.git
git push -u origin main
```

Bij een volgende wijziging is alleen `git add .`, `git commit -m "..."` en
`git push` nodig.

### Chrome Web Store

De eerste publicatie en de winkelvermelding moeten eenmalig via het
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
worden ingesteld. Vul daar de beschrijving, screenshots, categorie en
privacygegevens in en sla de winkelvermelding op.

Daarna publiceert GitHub Actions nieuwe versies automatisch via de officiële
Chrome Web Store API. Voeg in GitHub bij **Settings → Secrets and variables →
Actions** deze secrets toe:

```text
CWS_EXTENSION_ID
CWS_PUBLISHER_ID
CWS_CLIENT_ID
CWS_CLIENT_SECRET
CWS_REFRESH_TOKEN
```

Verhoog voor iedere nieuwe release het versienummer in `manifest.json` en push
naar `main`. De workflow in `.github/workflows/chrome-webstore.yml` maakt
automatisch een schone ZIP en uploadt die via de API. `CWS_PUBLISHER_ID` is
het publisher-ID uit het Chrome Web Store-dashboard en verschilt van de
extension-ID. Google kan daarna nog een handmatige review uitvoeren voordat
de nieuwe versie zichtbaar wordt.

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

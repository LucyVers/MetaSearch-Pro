# DOKUMENTATION - METADATA-PROJEKTET

**Ägare:** Lucy Sonberg  
**Projekt:** PDF Metadata Extraction Web Application  
**Status:** Privat projekt - får inte användas utan tillåtelse  
**Datum:** 2025-08-17  

---

## SENASTE ÄNDRINGAR (NYAST FÖRST)

### 2025-08-17 - Slutlig .gitignore implementation med best practice

**Vad jag gjorde:**
- Implementerade generiska .gitignore-regler för att dölja personliga filer
- Skyddade personliga utvecklingsfiler utan att avslöja filnamn
- Behöll viktiga filer synliga (README.md, DOKUMENTATION.md)

**SLUTLIG .GITIGNORE STRUKTUR:**
```bash
# Development and personal files
*.md
!README.md
!DOKUMENTATION.md

# Data files (excluding package files)
*.json
!package.json
!package-lock.json
```

**SÄKERHETSRESULTAT:**
- ✅ Personliga utvecklingsfiler är dolda och skyddade
- ✅ README.md och DOKUMENTATION.md syns fortfarande
- ✅ Ingen ser vad jag har för personliga filer
- ✅ Följer best practice för integritet

**LÄRDOMAR:**
- Generiska regler är säkrare än specifika filnamn
- Undantag (!) behövs för viktiga filer
- Best practice skyddar både filer och integritet
- Professionella utvecklare tänker på säkerhet från början

### 2025-08-17 - Säkerhetsförbättring av .gitignore

**Vad jag gjorde:**
- Gjorde .gitignore mer generisk för att dölja specifika filnamn
- Skyddade personliga filer utan att avslöja vad de heter
- Följde säkerhetsprincipen "need to know"

**SÄKERHETSFÖRBÄTTRING:**
Istället för specifika filnamn använder nu generiska regler:
```bash
# NYTT (döljer filnamn)
*.md                    # Alla .md filer (utom README, DOKUMENTATION)
*.json                  # Alla JSON-filer (utom package-filer)
frontend/*/             # Alla undermappar (utom specifika filer)
```

**FÖRDELAR:**
- **Säkerhet:** Ingen ser vad jag har för personliga filer
- **Flexibilitet:** Fungerar för framtida filer också
- **Professionellt:** Följer "need to know"-principen
- **Skydd:** Alla personliga filer är skyddade

### 2025-08-17 - Filrensning och förberedelse för första commit

**Vad jag gjorde:**
- Analyserade alla filer i projektet för att identifiera vad som ska committas
- Uppdaterade .gitignore för att exkludera oönskade filer
- Planerade professionell första commit

**FILANALYS - VAD SOM SKA INTE COMMITTAS:**
- Personliga utvecklingsfiler (privat)
- Gamla projektfiler från tidigare projekt
- Genererad data, inte kod
- Gammal testfil
- Systemfiler

**FILER SOM SKA COMMITTAS:**
- **index.js** - Huvudapplikation (backend)
- **package.json** - Projektkonfiguration
- **package-lock.json** - Exakta dependency-versioner
- **frontend/index.html** - Webbapplikation
- **frontend/main.js** - Frontend-logik
- **frontend/style.css** - Styling
- **DOKUMENTATION.md** - Projektets dokumentation
- **TODO-LISTA FÖR METADATA-PROJEKTET** - Projektplanering
- **.gitignore** - Git-konfiguration

**PROFESSIONELLA PRINCIPER:**
- **Kod vs Data:** Committa bara kod, inte genererad data
- **Personligt vs Publikt:** Personliga filer ska vara privata
- **Storlek:** Undvik stora filer som inte behövs
- **Rent Repository:** Endast relevant kod för projektet

### 2025-08-17 - Repository skapande och .gitignore uppdatering

**Vad jag gjorde:**
- Skapade GitHub repository: `https://github.com/LucyVers/pdf-metadata-project.git`
- Uppdaterade .gitignore med professionella best practices
- Valde koncis repository description (248/350 karaktärer)

**REPOSITORY INFORMATION:**
- **Namn:** pdf-metadata-project
- **URL:** https://github.com/LucyVers/pdf-metadata-project.git
- **Description:** "PDF metadata extraction web app built with Node.js and Express. Extracts titles, file sizes, PDF versions, and handles dates robustly. Features download links and professional UI with progressive disclosure. Great for learning metadata extraction and REST API development."

**GITIGNORE UPPDATERINGAR:**
Lade till professionella ignore-regler:
- **Dependencies:** npm-debug.log*, yarn-debug.log*
- **OS files:** .DS_Store?, ._*, .Spotlight-V100, .Trashes
- **IDE files:** .vscode/, .idea/, *.swp, *.swo
- **Environment:** .env, .env.local, etc.
- **Logs:** logs/, *.log
- **Runtime:** pids/, *.pid, *.seed
- **Coverage:** coverage/
- **Temporary:** tmp/, temp/

**LÄRDOMAR:**
- Koncis kommunikation är viktigt för min utveckling
- Professionell .gitignore skyddar mot oavsiktliga commits
- Repository description ska vara informativ men kortfattad
- Best practices följs från början

### 2025-08-17 - Planering för nästa nivå och Git branches förberedelse

**Vad jag gjorde:**
- Planerade nästa fas av projektet med 5 avancerade funktioner
- Uppdaterade TODO-listan med strukturerad implementeringsplan
- Diskuterade Git branches-träning med musikfiler som test
- Förberedde för grupparbetet med systematisk approach

**NÄSTA NIVÅ - 5 AVANCERADE FUNKTIONER:**

**Prioritet 1: Sökfunktion**
- Sök i titlar, författare, innehåll
- Filtrera efter filstorlek, datum, PDF-version
- Realtidssökning och sortering
- Sökhistorik

**Prioritet 2: Avancerad metadata-extraktion**
- Text-sammanfattning (första 200 tecken)
- Automatisk nyckelord-extraktion
- Språkdetektering
- Automatisk kategorisering

**Prioritet 3: Multi-filtyp stöd**
- JPG-bilder (EXIF-data)
- MP3-filer (ID3-taggar)
- CSV-filer (kolumner, rader)
- Enhetlig sökning över alla filtyper

**Prioritet 4: Användarupplevelse (UX)**
- Dark/Light mode växling
- Responsiv design för mobil/tablet
- Drag & drop för filuppladdning
- Export-funktioner

**Prioritet 5: Git branches träning**
- Skapa test-branch för musikfiler
- Lära sig branch-hantering säkert
- Träna merge-konflikter
- Skapa backup-strategi

**IMPLEMENTERINGSPLAN:**
- **FAS 1:** Sökfunktion (Backend API → Frontend → Filtrering → Testning)
- **FAS 2:** Avancerad metadata (Sammanfattning → Nyckelord → Språk → Kategori)
- **FAS 3:** Multi-filtyp (JPG → MP3 → CSV → Enhetlig sökning)
- **FAS 4:** UX-förbättringar (Dark mode → Responsiv → Drag & drop → Export)
- **FAS 5:** Git branches (Musik-branch → Hantering → Konflikter → Backup)

**GIT BRANCHES STRATEGI:**
- Använda musikfiler som test för att lära sig branches
- Skapa säker miljö för att träna utan risk
- Bygga självförtroende innan grupparbetet
- Dokumentera alla steg för framtida referens

**FÖR GRUPPARBETET:**
Denna plan förbereder mig för:
- Komplexa applikationer med många funktioner
- Systematisk utveckling och testning
- Git branches och teamarbete
- Professionell dokumentation och struktur

### 2025-08-17 - Slutförande av förbättrad PDF-metadata extraktion

**Vad jag gjorde:**
- Implementerade alla tre förbättringar (Options A, B, C) framgångsrikt
- Förbättrade datumhantering för att undvika "Invalid Date" fel
- Uppdaterade frontend för att visa alla nya metadata
- Testade systemet med 20 PDF-filer

**SLUTRESULTAT - Alla förbättringar fungerar perfekt:**

**Option A - Extraherade titlar:**
- ✅ PDF-filer som saknar titel får nu meningsfulla titlar från text-innehållet
- ✅ Exempel: "Broadcast Technicians page 1 of 3 A CareerZone Occupational Brief..."
- ✅ Exempel: "Global Health Contact List for the Africa Region - 3/21/05"
- ✅ Exempel: "Testimony of Chris Field, Carnegie Institution for Science..."
- ✅ Rensar specialtecken och begränsar till 100 tecken

**Option B - Filstorlek:**
- ✅ Visar filstorlek i användarvänligt format (KB/MB)
- ✅ Exempel: "12 KB", "149 KB", "3.58 MB", "751 KB"
- ✅ Automatisk konvertering från bytes

**Option C - PDF-version:**
- ✅ Visar teknisk information om PDF-format
- ✅ Exempel: "1.3", "1.4", "1.5", "1.6"
- ✅ Fallback till "Unknown" om version saknas

**Förbättrad datumhantering:**
- ✅ Hanterar olika PDF-datumformat korrekt
- ✅ Visar "Unknown" istället för "Invalid Date"
- ✅ Mer professionell display

**PROFESSIONELLA RESULTAT:**
1. **Bättre användarupplevelse** - Titlar som beskriver innehållet
2. **Mer information** - Filstorlek och PDF-version
3. **Korrekt datumhantering** - Inga fler "Invalid Date" fel
4. **Konsekvent engelska** - Alla kommentarer på engelska
5. **Robust kod** - Hanterar olika PDF-format och fel

**TESTRESULTAT:**
- Testat med 20 PDF-filer av olika storlekar och format
- Alla förbättringar fungerar som förväntat
- Systemet är stabilt och professionellt

**FÖR GRUPPARBETET:**
Detta projekt har lärt mig:
- Hur man extraherar metadata från olika filtyper
- Hur man hanterar saknade data professionellt
- Hur man förbättrar användarupplevelsen steg för steg
- Best practices för kodning (engelska kommentarer, felhantering)
- Hur man dokumenterar och uppdaterar TODO-listor

**NÄSTA STEG FÖR GRUPPARBETET:**
Samma principer kan användas för:
- **Bilder:** Extrahera EXIF-data, dimensioner, färgprofil
- **Ljud:** Extrahera bitrate, längd, format, taggar
- **CSV:** Extrahera kolumner, rader, datatyper
- **Sökfunktion:** Kombinera alla filtyper i en gemensam sökning

---

## TIDIGARE ARBETE (HISTORIK)

### 2025-08-16 - Backend-uppdatering för PDF-filer
Jag uppdaterade index.js för att hantera PDF-filer istället för JPG-filer:
- Ändrade från `exifr` till `pdf-parse-fork` import
- Ändrade från `./frontend/images/` till `./frontend/pdfs/` mapp
- Ändrade från `.jpg/.jpeg` till `.pdf` filfilter
- Uppdaterade metadata-läsning till `pdfParse(fs.readFileSync())`
- Installerade `express` som saknades

### 2025-08-16 - Filhantering och säkerhet
Jag implementerade proffsutvecklare best practices för filhantering:
- Uppdaterade .gitignore för att ignorera PDF-filer och pdfs-mappen
- Skapade README.md i pdfs-mappen med instruktioner
- Följde principen att aldrig pusha stora filer till GitHub
- Dokumenterade hur andra utvecklare ska få tag på testdata

**VAD VI INTE GÖR (Viktigt!)**
- ALDRIG pusha stora filer till GitHub
- ALDRIG ladda ner hundratals filer direkt i projektet
- ALDRIG spara testdata permanent i koden

**VAD PROFFSUTVECKLARE GÖR**
- Använder .gitignore för att ignorera stora filer
- Skapar testdata-mappar som inte pushas
- Använder exempel-filer för utveckling
- Dokumenterar hur andra ska få tag på testdata

**VARFÖR DETTA ÄR VIKTIGT:**
1. **GitHub limits** - 100MB filgräns per fil
2. **Performance** - Stora filer gör projektet långsamt
3. **Organization** - Separera kod från data
4. **Säkerhet** - Känslig data ska inte i kod
5. **Teamarbete** - Andra utvecklare ska kunna arbeta enkelt

### 2025-08-15 - Installation av PDF-bibliotek
Jag installerade `pdf-parse-fork` biblioteket med kommandot `npm install pdf-parse-fork`.
Detta bibliotek hjälper oss att läsa metadata från PDF-filer, precis som `exifr` gör för JPG-bilder.
Installationen lyckades och lade till 2 paket till projektet.

### 2025-08-15 - Anpassning av JPG-app till PDF-app
Jag förstod att jag ska anpassa min befintliga JPG-metadata-app till att hantera PDF-filer istället. 
Min handledare förklarade att vi ska:
1. Installera PDF-biblioteket `pdf-parse-fork`
2. Skapa en mapp för PDF-filer
3. Uppdatera backend-koden för att läsa PDF-metadata
4. Uppdatera frontend för att visa PDF-information och nedladdningslänkar
5. Testa att allt fungerar

### 2025-08-15 - Projektuppsättning
Jag gick in i den nya mappen `pdf-metadata-project` och körde `npm init -y` för att skapa en package.json-fil.
Jag redigerade sedan package.json och lade till `"type": "module"` som läraren instruerade.
Detta gör att vi kan använda moderna JavaScript-moduler (import/export) istället för den gamla require-syntaxen.

### 2025-08-15 - Planering
Jag ska skapa ett nytt projekt för att extrahera metadata från PDF-filer istället för JPG-filer.

Skapande av nytt PDF-projekt
Jag skapade en ny mapp som heter `pdf-metadata-project` bredvid lärarens exempel. Nu har jag:
- Lärarens exempel: `Lucy-ovning-node-metadata-foto-combo` (behålls som referens)
- Mitt nya projekt: `pdf-metadata-project` (där jag ska skapa PDF-funktionalitet)

Jag förstod att jag ska skapa ett helt nytt projekt från början, inte ändra i lärarens exempel.

### 2025-08-14 - Projektstart
Jag har laddat ner projektet "combo.zip" och öppnat det i VSC. Projektet innehåller en Node.js-applikation för att extrahera metadata från JPG-bilder.

### Installation av beroenden
Jag körde `npm install` i projektmappen för att installera alla nödvändiga paket. Installationen lyckades utan problem.

### Start av servern
Jag startade servern genom att köra `node index.js`. Servern startade och körs på http://localhost:3000.

### Test av API
Jag testade REST-API:et genom att anropa http://localhost:3000/api/metadata. API:et returnerade metadata från två JPG-filer:
- chopped-up.jpeg (iPhone 15 Pro)
- yellow-leaves.jpg (iPhone 15 Pro)

### Problem med localhost
Jag kunde inte se webbsidan på localhost:3000. Möjliga orsaker:
- Servern kanske inte startade korrekt
- Port 3000 kanske är upptagen
- Webbläsaren kanske inte kan nå localhost

### Lösning av localhost-problem
Jag kontrollerade att servern fortfarande körde med `ps aux | grep node` och såg att processen var aktiv.
Jag testade servern med `curl -I http://localhost:3000` och fick HTTP 200 OK, vilket betyder att servern fungerar.
Jag öppnade webbläsaren manuellt med kommandot `open http://localhost:3000` och nu fungerar webbsidan.

### 2025-08-14 - Skapande av dokumentation
Reglerna inkluderar:
- Säkerhetsregler för att stänga av servrar när vi avslutar
- Kommunikationsregler för att använda enkelt språk
- Projekt hantering för att hålla todo-listan uppdaterad
- Lärande fokus för att bygga kunskaper steg för steg

---

## 📚 ORDLISTA - TEKNISKA TERMER

### Grundläggande termer:
- **Node.js:** Runtime environment för server-side JavaScript
- **npm (Node Package Manager):** Verktyg för att installera och hantera JavaScript-bibliotek/paket
- **Express:** Populärt Node.js web application framework för att bygga REST APIs
- **fs (File System):** Node.js inbyggda modul för att interagera med filsystemet (läsa/skriva filer)
- **exifr:** JavaScript-bibliotek tidigare använt för att extrahera EXIF-metadata från bildfiler (JPG, PNG)
- **pdf-parse-fork:** npm-modul vald för att extrahera metadata från PDF-filer
- **REST API:** Arkitekturstil för nätverksapplikationer, använder standard HTTP-metoder
- **API Route:** En specifik endpoint på en webbserver (t.ex. /api/metadata) som hanterar requests
- **Backend (Server-side):** Den del av applikationen som körs på servern, hanterar datalogik och API-requests
- **Frontend (Client-side):** Den del av applikationen som körs i användarens webbläsare, ansvarig för användargränssnitt och visning av data
- **Metadata:** Data som ger information om annan data (t.ex. skapandedatum, författare, titel på en PDF)
- **JSON (JavaScript Object Notation):** Ett lättviktigt data-interchange format använt för att skicka data mellan backend och frontend
- **fetch API:** Ett modernt JavaScript interface för att göra nätverksrequests (t.ex. till en API endpoint)
- **DOM Manipulation:** Använda JavaScript (document.createElement, innerHTML, document.querySelector) för att skapa och modifiera HTML-element på webbsidan
- **CSS (Cascading Style Sheets):** Språk för att styla utseendet på webbsidor (färger, layout, typsnitt)
- **Git och .gitignore:** Versionshanteringssystem och en fil som används för att specificera avsiktligt untrackade filer som Git ska ignorera
- **Process Management Commands:** pkill, ps aux, lsof, netstat för att hantera och inspektera körande processer och öppna portar

### Avancerade termer:
- **ES Modules:** Modern JavaScript-modulsystem med import/export syntax
- **Async/Await:** Modern JavaScript-syntax för att hantera asynkrona operationer
- **Middleware:** Funktioner som körs mellan HTTP-request och response i Express
- **Static File Serving:** Att servera statiska filer (HTML, CSS, JS, bilder) direkt från webbservern
- **Error Handling:** Processen att hantera och hantera fel på ett elegant sätt
- **Data Parsing:** Processen att konvertera data från ett format till ett annat (t.ex. PDF till JSON)
- **File System Operations:** Operationer för att läsa, skriva och hantera filer på disk
- **HTTP Status Codes:** Standardiserade koder som indikerar resultatet av en HTTP-request
- **Content-Type:** HTTP-header som specificerar typen av data som skickas
- **CORS (Cross-Origin Resource Sharing):** Säkerhetsmekanism för webbläsare
- **Environment Variables:** Variabler som lagrar konfigurationsdata utanför koden
- **Package.json:** Konfigurationsfil för Node.js-projekt som definierar beroenden och scripts
- **Dependencies:** Externa bibliotek som projektet behöver för att fungera
- **Dev Dependencies:** Externa bibliotek som endast behövs under utveckling
- **Semantic Versioning:** Standardiserat system för versionshantering (MAJOR.MINOR.PATCH)
- **Repository:** Plats där kod lagras och versionshanteras (t.ex. på GitHub)
- **Branch:** Separat linje av utveckling i Git
- **Commit:** En punkt i Git-historiken som representerar en ändring
- **Push/Pull:** Git-kommandon för att synkronisera kod med remote repository
- **Merge:** Processen att kombinera ändringar från olika branches
- **Conflict Resolution:** Processen att lösa konflikter när Git inte kan automatiskt merga ändringar

### UX och Design-termer:
- **Progressive Disclosure:** Designprincip där information visas stegvis, bara när den behövs
- **Graceful Degradation:** Förmågan att hantera fel och saknad data på ett elegant sätt
- **User-Centric Design:** Designfilosofi som fokuserar på användarens behov och upplevelse
- **Information Architecture:** Strukturering och organisering av information för användbarhet
- **Usability:** Mätbarhet av hur enkelt och effektivt användare kan använda ett system
- **User Experience (UX):** Användarens totala upplevelse av att interagera med en produkt
- **User Interface (UI):** Visuella element som användare interagerar med
- **Responsive Design:** Design som anpassar sig till olika skärmstorlekar och enheter
- **Accessibility:** Förmågan för personer med funktionsnedsättningar att använda systemet
- **Performance:** Hur snabbt och effektivt systemet fungerar
- **Scalability:** Förmågan att hantera ökad belastning och data
- **Maintainability:** Hur enkelt koden kan underhållas och uppdateras
- **Code Quality:** Standarder för ren, läsbar och effektiv kod
- **Best Practices:** Rekommenderade metoder och standarder inom branschen
- **Industry Standards:** Allmänt accepterade riktlinjer och konventioner

# Multi-File Metadata Extraction Web Application

**Ägare:** Lucy Sonberg  
**Status:** Privat projekt - får inte användas utan tillåtelse  
**Licens:** UNLICENSED (privat)  
**Datum:** 2025-08-26  

## 📋 PROJEKTÖVERSIKT

En Node.js-baserad webbapplikation som extraherar och visar metadata från flera filtyper: PDF-filer, JPG-bilder, MP3-ljudfiler och PowerPoint-presentationer. Applikationen innehåller nedladdningslänkar, sökfunktion och professionell användarupplevelse.

## ✨ FUNKTIONER

### **Multi-File Support:**
- **PDF Metadata Extraction:** Extraherar titel, författare, skapare, datum, sidor, PDF-version
- **JPG EXIF Data:** Extraherar kamera, datum, GPS-koordinater, dimensioner, fotograf
- **MP3 ID3 Tags:** Extraherar artist, album, genre, längd, år, albumtitel
- **PowerPoint Metadata:** Extraherar titel, företag, slides, ord, revision, skapandedatum

### **🎵 INTERAKTIVA MEDIA-FUNKTIONER:**
- **HTML5 MP3-Spelare:** Professionell ljudspelare med 30-sekunders preview
- **Bildgalleri med Lightbox:** Fullskärms-visning med zoom, navigation och keyboard shortcuts
- **PDF-Preview System:** Thumbnail-visning och fullskärms PDF viewer med sidnavigation

### **🔍 AVANCERADE SÖKFUNKTIONER:**
- **Multi-typ Filtrering:** Sök efter specifika filtyper (PDF, JPG, MP3, PPT)
- **GPS-sökning:** Hitta JPG-bilder baserat på plats
- **Debounced Search:** Optimerad sökning med fördröjning
- **Live Results:** Omedelbara sökresultat med professionell UI

### **🎨 PROFESSIONELL ANVÄNDARUPPLEVELSE:**
- **SONBERG STUDIO Design:** Modern, responsiv design med gradient-tema
- **Responsiv Layout:** Fungerar perfekt på alla enheter
- **Keyboard Navigation:** Piltangenter för bildgalleri och PDF-navigation
- **Accessibility:** Screen reader support och ARIA-labels

### **⚡ TEKNISKA FÖRBÄTTRINGAR:**
- **SOLID-principer:** Professionell kodstruktur enligt enterprise-standarder
- **Automatisk Metadata-hantering:** Intelligent hantering av saknade eller felaktiga metadata
- **Robust Felhantering:** Graceful degradation vid problem med filer
- **Performance Optimization:** Lazy loading och effektiv rendering

## 🚀 INSTALLATION

```bash
# Installera dependencies
npm install

# Starta servern
node index.js

# Öppna i webbläsaren
open http://localhost:3000
```

## 📁 PROJEKTSTRUKTUR

```
MetaSearch-Pro/
├── index.js                    # Backend server med Express.js
├── models.js                   # MySQL databas-modeller (Sequelize)
├── package.json               # Projektkonfiguration och dependencies
├── data/
│   └── ppt-metadata.json     # PowerPoint metadata (1001 poster)
├── frontend/
│   ├── index.html            # Webbapplikation med PDF.js CDN
│   ├── main.js              # Frontend-logik (SOLID-principer)
│   ├── style.css            # Styling med SONBERG STUDIO tema
│   ├── about.html           # Om oss-sida
│   ├── contact.html         # Kontaktsida
│   ├── pdfs/                # PDF-filer (ignoreras av Git)
│   ├── jpgs/                # JPG-bilder (ignoreras av Git)
│   ├── mp3s/                # MP3-filer (ignoreras av Git)
│   └── ppts/                # PowerPoint-filer (ignoreras av Git)
├── DOKUMENTATION.md          # Detaljerad projekt-dokumentation
├── TODO-LISTA FÖR METADATA-PROJEKTET  # Projektplanering och status
└── README.md                 # Denna fil - projektöversikt
```

## 🔧 TEKNISK STACK

- **Backend:** Node.js, Express.js, MySQL med Sequelize ORM
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 med CSS Grid/Flexbox
- **PDF Processing:** PDF.js (CDN), pdf-parse-fork för metadata
- **Image Processing:** exif-parser, exif-reader, Canvas API för thumbnails
- **Audio Processing:** music-metadata, HTML5 Audio API
- **PowerPoint Processing:** JSON-baserad metadata (Library of Congress)
- **File System:** Node.js fs module med chokidar för filövervakning
- **Architecture:** SOLID-principer, RESTful API, Responsive Design

## 🎯 INTERAKTIVA FUNKTIONER

### **🎵 MP3-SPELARE:**
- **HTML5 Audio API:** Professionell ljudspelare med custom kontroller
- **30-sekunders Preview:** Begränsad spellängd för copyright-skydd
- **Playback Controls:** Play/pause, hastighetskontroll, progress bar
- **Responsiv Design:** Anpassar sig efter skärmstorlek

### **📸 BILDGALLERI MED LIGHTBOX:**
- **Fullskärms-visning:** Professionell lightbox-upplevelse
- **Zoom-funktionalitet:** Inbyggd zoom för detaljgranskning
- **Keyboard Navigation:** Piltangenter för navigation mellan bilder
- **EXIF Metadata Display:** Toggle för att visa/väja kamera-information
- **Responsiv Grid:** Automatisk anpassning efter skärmstorlek

### **📄 PDF-PREVIEW SYSTEM:**
- **PDF.js Integration:** Thumbnail previews av första sidan
- **Fullskärms Viewer:** Professionell PDF-viewer med zoom-kontroller
- **Sidnavigation:** ◀ Föregående / Nästa ▶ knappar
- **Keyboard Support:** Piltangenter för sidnavigation
- **Zoom Controls:** 🔍+ 🔍- för in/ut-zooming

## 📊 METADATA SOM EXTRAHERAS

### **PDF-filer:**
- **Titel:** Från PDF metadata eller extraherad från text
- **Författare:** Från PDF metadata eller extraherad från text
- **Skapare:** Program som skapade PDF:en
- **Skapandedatum:** När PDF:en skapades
- **Ändringsdatum:** När PDF:en senast ändrades
- **Sidor:** Antal sidor i PDF:en
- **Filstorlek:** I användarvänligt format
- **PDF Version:** Teknisk version av PDF-formatet

### **JPG-bilder:**
- **Kamera:** Tillverkare och modell
- **Dimensioner:** Bildstorlek i pixlar
- **Datum:** När bilden togs
- **GPS-koordinater:** Plats där bilden togs
- **Fotograf:** Från EXIF-data

### **MP3-filer:**
- **Artist:** Musiker eller grupp
- **Album:** Albumtitel
- **Genre:** Musikgenre
- **Längd:** Speltid i sekunder
- **År:** Utgivningsår

### **PowerPoint-filer:**
- **Titel:** Från metadata eller intelligent extraktion
- **Företag:** Skapande organisation
- **Slides:** Antal presentationer
- **Ord:** Antal ord i presentationen
- **Revision:** Revisionsnummer
- **Skapandedatum:** När presentationen skapades

## 🛡️ SÄKERHET

- **Privat projekt:** Får inte användas utan tillåtelse
- **Gitignore:** Skyddar personliga filer och testdata
- **Best practices:** Följer professionella utvecklingsstandarder

## 💼 BUSINESS VALUE & ROI

### **🎯 PROBLEM SOM LÖSES:**
- **Tidsbrist:** Manuell filhantering tar timmar per dag
- **Informationsförlust:** Viktiga dokument går förlorade i arkivet
- **Ineffektiv sökning:** "Var är kontraktet från mars?" = 2 timmars letning
- **Säkerhetsrisker:** Dokument delas via email/cloud utan kontroll

### **✅ LÖSNINGAR:**
- **⚡ Instant Sökning:** 2 timmar → 30 sekunder
- **🔍 Fullständig Översikt:** Alla dokument indexerade och sökbara
- **🤝 Säker Delning:** Kontrollerad åtkomst till metadata
- **📊 Proaktiv Insights:** Automatisk kategorisering och taggning

### **💰 ROI-BERÄKNING:**
```
Företag med 10,000 dokument:
- Manuell hantering: 20 timmar/vecka × 800 kr/timme = 16,000 kr/vecka
- Med MetaSearch-Pro: 2 timmar/vecka × 800 kr/timme = 1,600 kr/vecka
- Årlig besparning: 14,400 kr/vecka × 52 veckor = 748,800 kr/år
- Systemkostnad: 50,000 kr (utveckling) + 5,000 kr/månad (SaaS)
- Netto-vinst första året: 748,800 kr - 110,000 kr = 638,800 kr
```

### **🚀 FRAMTIDA MÖJLIGHETER:**
- **AI-Integration:** Automatisk kategorisering och sammanfattningar


## 📝 LICENS

Detta är ett privat projekt som ägs av Lucy Sonberg. Projektet får inte användas, kopieras eller distribueras utan uttrycklig tillåtelse från ägaren.

## 👤 KONTAKT

**Ägare:** Lucy Sonberg  
**Projekt:** Metadata Extraction Web Application  
**Status:** Privat utvecklingsprojekt

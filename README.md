# Multi-File Metadata Extraction Web Application

**Ägare:** Lucy Sonberg  
**Status:** Privat projekt - får inte användas utan tillåtelse  
**Licens:** UNLICENSED (privat)  
**Datum:** 2025-08-26  

## 📋 PROJEKTÖVERSIKT

En Node.js-baserad webbapplikation som extraherar och visar metadata från flera filtyper: PDF-filer, JPG-bilder, MP3-ljudfiler och PowerPoint-presentationer. Applikationen innehåller nedladdningslänkar, sökfunktion och professionell användarupplevelse.

## ✨ FUNKTIONER

### **Multi-File Support:**
- **PDF Metadata Extraction:** Extraherar titel, författare, skapare, datum, sidor
- **JPG EXIF Data:** Extraherar kamera, datum, GPS-koordinater, dimensioner
- **MP3 ID3 Tags:** Extraherar artist, album, genre, längd, år
- **PowerPoint Metadata:** Extraherar titel, företag, slides, ord, revision

### **Advanced Features:**
- **Enhanced Title Extraction:** Extraherar titlar från text-innehåll om metadata saknas
- **Intelligent PPT Title Fix:** Fixar felaktig metadata ("Slide 1", "7264", "Arial 32")
- **File Size Calculation:** Visar filstorlek i användarvänligt format (KB/MB)
- **Robust Date Parsing:** Hanterar olika datumformat
- **Search Functionality:** Sökning över alla filtyper med debounce
- **Download Links:** Nedladdningslänkar för alla filtyper
- **Progressive Disclosure:** Visar endast tillgänglig metadata
- **Professional UI:** Modern och responsiv design

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
├── index.js                    # Backend server
├── package.json               # Projektkonfiguration
├── data/
│   └── ppt-metadata.json     # PowerPoint metadata (1001 poster)
├── frontend/
│   ├── index.html            # Webbapplikation
│   ├── main.js              # Frontend-logik
│   ├── style.css            # Styling
│   ├── pdfs/                # PDF-filer (ignoreras av Git)
│   ├── jpgs/                # JPG-bilder (ignoreras av Git)
│   ├── mp3s/                # MP3-filer (ignoreras av Git)
│   └── ppts/                # PowerPoint-filer (ignoreras av Git)
├── DOKUMENTATION.md          # Projektets dokumentation
└── TODO-LISTA FÖR METADATA-PROJEKTET  # Projektplanering
```

## 🔧 TEKNISK STACK

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **PDF Processing:** pdf-parse-fork
- **Image Processing:** exif-parser, exif-reader
- **Audio Processing:** music-metadata
- **PowerPoint Processing:** JSON-baserad metadata (Library of Congress)
- **File System:** Node.js fs module

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

## 📝 LICENS

Detta är ett privat projekt som ägs av Lucy Sonberg. Projektet får inte användas, kopieras eller distribueras utan uttrycklig tillåtelse från ägaren.

## 👤 KONTAKT

**Ägare:** Lucy Sonberg  
**Projekt:** PDF Metadata Extraction Web Application  
**Status:** Privat utvecklingsprojekt

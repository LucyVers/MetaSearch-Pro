# PDF Metadata Extraction Web Application

**Ägare:** Lucy Sonberg  
**Status:** Privat projekt - får inte användas utan tillåtelse  
**Licens:** UNLICENSED (privat)  
**Datum:** 2025-08-17  

## 📋 PROJEKTÖVERSIKT

En Node.js-baserad webbapplikation som extraherar och visar metadata från PDF-filer. Applikationen innehåller nedladdningslänkar och professionell användarupplevelse.

## ✨ FUNKTIONER

- **PDF Metadata Extraction:** Extraherar titel, författare, skapare, datum, sidor
- **Enhanced Title Extraction:** Extraherar titlar från text-innehåll om metadata saknas
- **File Size Calculation:** Visar filstorlek i användarvänligt format (KB/MB)
- **PDF Version Detection:** Visar PDF-format version
- **Robust Date Parsing:** Hanterar olika PDF-datumformat
- **Download Links:** Nedladdningslänkar för alla PDF-filer
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
pdf-metadata-project/
├── index.js                    # Backend server
├── package.json               # Projektkonfiguration
├── frontend/
│   ├── index.html            # Webbapplikation
│   ├── main.js              # Frontend-logik
│   ├── style.css            # Styling
│   └── pdfs/                # PDF-filer (ignoreras av Git)
├── DOKUMENTATION.md          # Projektets dokumentation
└── TODO-LISTA FÖR METADATA-PROJEKTET  # Projektplanering
```

## 🔧 TEKNISK STACK

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **PDF Processing:** pdf-parse-fork
- **File System:** Node.js fs module

## 📊 METADATA SOM EXTRAHERAS

- **Titel:** Från PDF metadata eller extraherad från text
- **Författare:** Från PDF metadata eller extraherad från text
- **Skapare:** Program som skapade PDF:en
- **Skapandedatum:** När PDF:en skapades
- **Ändringsdatum:** När PDF:en senast ändrades
- **Sidor:** Antal sidor i PDF:en
- **Filstorlek:** I användarvänligt format
- **PDF Version:** Teknisk version av PDF-formatet

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

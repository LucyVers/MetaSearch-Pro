# 📚 INSTRUKTIONER FÖR LÄRAREN - METADATA-SÖKMOTOR

## 🎯 PROJEKTÖVERSIKT

**Projektnamn:** MetaSearch-Pro - Metadata-sökmotor  
**Student:** Lucy Sonberg  
**Kurs:** Metadata och webbanalys  
**Datum:** September 2025  

### **HUVUDMÅL:**
En fullständig sökmotor som arbetar med metadata för olika filtyper (foton, PDF-filer, ljudfiler, PowerPoint-dokument) med webbaserat gränssnitt och MySQL-databas.

---

## 🚀 SNABBSTART

### **1. STARTA PROJEKTET**
```bash
# Navigera till projektmappen
cd MetaSearch-Pro

# Installera dependencies
npm install

# Starta servern
npm start
```

### **2. ÖPPNA WEBBPLATSEN**
- Gå till: `http://localhost:3000`
- Huvudsidan laddas automatiskt med alla funktioner

---

## 📋 TESTINSTRUKTIONER

### **A. GRUNDLÄGGANDE SÖKFUNKTION**

#### **Test 1: Enkel sökning**
1. Skriv "PDF" i sökfältet → Visar PDF-filer
2. Välj "Bilder" i dropdown → Visar JPG-filer
3. Kombinera: Välj "Ljudfiler" + skriv "music" → Filtrerade MP3-resultat

### **B. AVANCERAD SÖKNING**

#### **Test 2: Avancerad sökning**
1. Klicka "Avancerat" → Välj "Större än" + skriv "1000000" → Stora filer
2. Välj "Bilder" + GPS-koordinater (38.615535, -0.065393) → Hittar DSC00042.JPG
3. Välj "Bilder" + GPS-koordinater (42.035038, -70.938020) → Hittar yellow-leaves.jpg
4. Använd storlek/datum-filter → Filtrerade resultat

### **C. MEDIA-FUNKTIONER**

#### **Test 3: Media-funktioner**
1. Klicka på bild → Lightbox med EXIF-data
2. Klicka på MP3 → Inbyggd spelare (30s preview)
3. Klicka på PDF → PDF-viewer med navigation

### **D. FAVORITER-SYSTEM**

#### **Test 4: Favoriter & historik**
1. Klicka hjärtat (❤️) → Sparas som favorit
2. Klicka "Mina Favoriter" → Visar alla favoriter
3. Gör flera sökningar → Tidigare sökningar visas som klickbara knappar

---

## 🗂️ TESTDATA

### **Filer som finns:**
- **JPG-bilder:** 160 st (foton med EXIF-data och GPS)
- **MP3-filer:** 100 st (ljudfiler med ID3-taggar)
- **PPT-filer:** 100 st (PowerPoint-presentationer)
- **Totalt:** 360 filer med omfattande metadata
- **GPS-aktiverade:** 80 JPG-filer med korrekta koordinater

### **Testfiler:**
Alla testfiler har du redan tillgång till, jag har använd materialet du delade med oss

---

## 🎯 BETYGSKRITERIER - VERIFIERING

### **G-BETYG (GODKÄNT)**
✅ **Fungerande sökmotor** - Testa grundläggande sökning  
✅ **MySQL-databas** - Metadata sparas och hämtas korrekt  
✅ **Avancerad sökning** - Sökoperatorer fungerar  
✅ **Geografisk sökning** - GPS-koordinater från bilder  
✅ **Filtypsfiltrering** - Dropdown filtrerar korrekt  

### **VG-BETYG (VÄL GODKÄNT)**
✅ **Lättanvänd gränssnitt** - Intuitiv navigation och design  
✅ **Relevanta sökresultat** - Relevanssortering fungerar  
✅ **Interaktiva funktioner** - Media-spelare, bildgalleri, PDF-viewer  
✅ **Professionell design** - Modern CSS med variabler, responsiv layout  
✅ **Avancerade filter** - Storlek, datum, GPS-filter med UI  
✅ **Favoriter-system** - Spara och hantera favoritfiler  
✅ **Sökhistorik** - Återanvänd tidigare sökningar  

### **ÖVERKURS (EXTRA FUNKTIONER)**
✅ **5 Sökoperatorer** - contains, equals, not_equals, greater_than, less_than  
✅ **GPS-sökning** - Geografisk sökning med koordinater  
✅ **Relevans-poäng** - Intelligent ranking av sökresultat  
✅ **Avancerade filter** - Storlek, datum, GPS med professionell UI  
✅ **Favoriter-system** - Databas-persisterad favorithantering  
✅ **Sökhistorik** - Automatisk sparning av tidigare sökningar  
✅ **Modern UI/UX** - CSS-variabler, hover-effekter, responsiv design  
✅ **Performance-optimering** - Snabb sökning och robust felhantering 

---

## 🔧 TEKNISK INFORMATION

### **Teknisk stack:**
- **Backend:** Node.js, Express, Sequelize ORM
- **Databas:** MySQL (molntjänst)
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Metadata-bibliotek:** pdf-parse, exif-reader, node-id3, officegen

### **API-endpoints:**
- `GET /api/database-metadata` - Hämta metadata med sökfilter
- `GET /api/favorites` - Hämta favoriter
- `POST /api/favorites` - Lägg till favorit
- `DELETE /api/favorites/:filename` - Ta bort favorit
- `GET /api/search-history` - Hämta sökhistorik

### **Databasstruktur:**
- **FileMetadata:** id, filename, fileType, fileSize, title, author, metadata (JSON)

---

## 📱 RESPONSIV DESIGN

### **Testa på olika enheter:**
- **Desktop:** Full funktionalitet med alla features
- **Tablet:** Anpassad layout, touch-navigation
- **Mobil:** Kompakt design, swipe-gestures

---

## 🐛 FELSÖKNING

### **Vanliga problem:**

#### **Servern startar inte:**
```bash
# Kontrollera att port 3000 är ledig
lsof -i :3000

# Installera om dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **Databasanslutning misslyckas:**
- Kontrollera `credentials.json` (baserat på `credentials-example.json`)
- Verifiera MySQL-anslutningsuppgifter

#### **Filer visas inte:**
- Kontrollera att testfiler finns i rätt mappar
- Verifiera att metadata-extraktion fungerar

---

## 📊 PROJEKTSTATISTIK

### **Funktioner implementerade:**
- ✅ Metadata-extraktion för 4 filtyper (PDF, JPG, MP3, PPT)
- ✅ 5 Sökoperatorer och GPS-sökning
- ✅ Avancerade filter och relevans-sortering
- ✅ Favoriter-system och sökhistorik
- ✅ Interaktiva media-funktioner
- ✅ Responsiv webbdesign

---

## 🎓 LÄRANDEMÅL UPPFYLLDA

### **Tekniska färdigheter:**
- Node.js och Express.js utveckling
- MySQL-databas design och ORM (Sequelize)
- RESTful API-utveckling
- Frontend-utveckling med modern JavaScript
- Metadata-extraktion och -hantering
- Git-versionshantering

### **Projektledning:**
- Agile utvecklingsmetodik
- Användarcentrerad design (UX)
- Testdriven utveckling
- Dokumentation och kommunikation

---

## 📞 KONTAKT

**Student:** Lucy Sonberg  
**Email:** lucyxrdeveloper@gmail.com  
**GitHub:** https://github.com/lucyprivat/MetaSearch-Pro  
**Projekt:** MetaSearch-Pro - Metadata-sökmotor

---

*Denna instruktionsfil skapades för att underlätta granskning och testning av MetaSearch-Pro projektet. Alla funktioner har testats och verifierats för att uppfylla kursens betygskriterier.*

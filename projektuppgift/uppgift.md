# PROJEKTUPPGIFT: METADATA-SÖKMOTOR

## 📋 ÖVERSIKT
**Betygsgrundande gruppinlämningsuppgift** för team på 4-5 personer

### 🎯 VAD SKA NI SKAPA?
En sökmotor som:
- Kan 'matas' med filer (foton, PDF-filer, ljudfiler, PowerPoint-dokument)
- Extraherar filers metadata och lagrar i databas
- Webbaserat gränssnitt för sökning i metadata
- Möjlighet att titta på/ladda hem filer från sökresultat

---

## 👥 USER STORIES

### 1. **Systemägare - MySQL-databas**
> Som systemägare vill jag ha en MySQL-databas som på ett bra sätt kan lagra metadata om olika typer av filer så att det går att söka upp en fil via en sökning i metadatan.

### 2. **Systemägare - Metadata-extraktion**
> Som systemägare vill jag att det finns ett system för att utifrån mappar med filer extrahera metadata om filerna och spara metadatan relaterad till filnamn/sökväg i databasen.

### 3. **Besökare - Webbaserat gränssnitt**
> Som besökare vill jag att det finns ett webbaserat gränssnitt för sökning i metadatan, så att det blir lätt för mig att söka och se resultat.

### 4. **Besökare - Filtypsfilter**
> Som besökare vill jag kunna välja vad jag vill söka (en viss filtyp) så att systemet förstår vilken typ av data jag vill söka efter.

### 5. **Besökare - Flexibel sökning**
> Som besökare vill jag kunna söka på både filnamn och olika metadata så att jag lätt kan hitta det jag söker efter.

### 6. **Besökare - Avancerad sökning**
> Som besökare vill jag kunna söka på ett bra sätt i metadatan (t.ex. om något är lika med, inte lika med, större än, mindre än, ungefär lika med för text) ett visst värde, så att det blir enkelt för mig att förfina min sökning.

### 7. **Besökare - Geografisk sökning**
> Som besökare vill jag kunna söka geografiskt när metadatan innehåller geografisk information (latitud och longitud).

### 8. **Besökare & Systemägare - Testdata**
> Som besökare och systemägare vill jag att systemet har en mängd testdata (icke copyright-skyddad) så att jag kan testa att systemet fungerar som det ska.

---

## 🛠️ TEKNIKER SOM SKA ANVÄNDAS

### 1. **Node.js - Metadata-extraktion**
> För att extrahera metadata från filer (tillsammans med olika tillägg)

### 2. **Node.js - Webbserver & REST-API**
> För att skapa en webbserver med REST-API mot databas och som även serverar frontend-filer

### 3. **MySQL (molntjänst)**
> För att lagra metadatan

### 4. **Webbaserad frontend**
> HTML, CSS och JavaScript

### 5. **Git**
> För versionshantering av kod i git-repository

---

## 📊 BETYGSSÄTTNING

### **G (Godkänd)**
- En fungerande sökmotor

### **VG (Väl Godkänd)**
- En fungerande sökmotor som är lättanvänd
- Returnerar sökresultat ordnade efter hur bra/relevanta de är

### **Individuell bedömning baseras på:**
- Hur aktivt du har deltagit i arbetet
- Hur stor andel av kod/commits du har skrivit i ert gemensamma git-repository

---

## ⚠️ VIKTIGA OBSERVATIONER

### **Gitignore-regler:**
1. **node_modules** (går alltid att återskapa genom `npm install`)
2. **Alla mappar med binära filer** (PDF, MP3, JPG, PowerPoint etc.)
3. **Binära filer** - spara gemensamt t.ex. på Google Drive och ge instruktioner för hur man klistrar in i lokalt repo
4. **VIKTIGT: Inloggningsinfo** - Ha INTE användarnamn, lösenord, host, port etc. på GitHub. Lagra i gitignorerad JSON-fil eller .env-filer

---

## 📅 DEADLINE
Fredag den 19/9 2025 

---

## 🎯 NÄSTA STEG
- [ ] Analysera vad vi redan har gjort
- [ ] Identifiera vad som återstår
- [ ] Skapa detaljerad plan
- [ ] Uppdatera TODO-lista

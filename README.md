# THE FLOOR – HOME EDITION · Multiplayer

Versiune multiplayer online a jocului HTML original. Păstrează tabla, categoriile, banca de 476 de întrebări, sistemul de teritorii, modul de cucerire și regulile duelurilor cu 60 de secunde pentru fiecare concurent.

## Cum funcționează
- Gazda creează o cameră și primește un cod de 5 caractere.
- Prietenii deschid linkul aplicației și introduc codul (sau folosesc linkul de invitație copiat de gazdă).
- Toți văd aceeași partidă în timp real, fiecare de pe propriul dispozitiv.
- Numai gazda poate apăsa butoanele și controla partida.
- Serverul transmite starea camerei și păstrează ultimul snapshot pentru invitații care se conectează ulterior.

## Rulare locală
Necesită Node.js 20+.

```bash
npm install
npm start
```

Deschide `http://localhost:3000`. Pentru test multiplayer local, deschide aceeași adresă în două browsere/dispozitive din aceeași rețea (pe LAN folosește IP-ul calculatorului gazdă).

## Publicare pe GitHub și Render
1. Creează un repository GitHub nou și încarcă toate fișierele din acest folder (`server.js`, `package.json`, `render.yaml`, `public/`, `README.md`).
2. În Render alege **New + → Blueprint** și conectează repository-ul pentru a folosi `render.yaml`.
3. Dacă preferi să creezi manual serviciul, alege **New + → Web Service** și setează:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`
   - Instance Type: Free (pentru test)
4. După deploy, deschide URL-ul `https://...onrender.com` și creează o cameră.

## Note tehnice
- Socket.IO este folosit pentru sincronizarea în timp real.
- Browserul gazdei este autoritatea jocului; serverul verifică faptul că doar socketul gazdei poate publica snapshot-uri.
- Camerele și starea lor sunt ținute în memoria procesului. Pe planul gratuit Render, serviciul intră în sleep după 15 minute fără trafic HTTP sau mesaje WebSocket primite; o conexiune activă cu trafic periodic îl menține activ. Totuși, Render poate reporni serviciul, iar o repornire/deploy șterge camerele active. Nu închide/reporni serviciul în timpul unei partide.
- Această primă versiune este host-controlled: invitații văd jocul și cronometrele, dar nu pot răspunde din propriile dispozitive. Gazda operează răspunsurile pe ecranul principal. Pentru ca fiecare concurent să răspundă de pe propriul telefon, ar fi necesară o a doua variantă de control.

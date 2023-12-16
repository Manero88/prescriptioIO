
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const port = 3000;
const connection = require('./database');
const session = require('express-session');
const saltRounds = 10;
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

app.use(bodyParser.urlencoded({limit: '10mb', extended: true }));
app.use(bodyParser.json({limit: '10mb'}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'pz2*8mY!c<tYy%|]D`q9rvDS56g%V[',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Route voor de hoofdpagina (loginpagina)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route voor de registratiepagina
app.get('/registreren', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registratie.html'));
});

// Route voor registratieverzoeken
app.post('/registreer', (req, res) => {
  console.log("Registratieverzoek ontvangen:", req.body);

  const { titel, naam, email, praktijk, wachtwoord } = req.body;

  // Hash het wachtwoord
  bcrypt.hash(wachtwoord, saltRounds, function(err, hash) {
    if (err) {
      console.error('Fout bij het hashen van wachtwoord:', err);
      res.status(500).send('Er is een fout opgetreden bij het hashen van het wachtwoord.');
      return;
    }

    console.log("Wachtwoord gehasht:", hash);


    const userQuery = 'INSERT INTO users (titel, naam, email, praktijk) VALUES (?, ?, ?, ?)';
    connection.query(userQuery, [titel, naam, email, praktijk], (userError, userResults) => {
      if (userError) {
        console.error('Fout bij het opslaan in users tabel:', userError);
        if(userError.code === 'ER_DUP_ENTRY') {
         
          res.json({ success: false, message: 'Deze gebruiker bestaat al.' });
        } else {
          res.status(500).send('Er is een fout opgetreden bij het registreren van de gebruiker.');
        }
        return;
      }

      console.log("Gebruiker opgeslagen met ID:", userResults.insertId); 

      const userId = userResults.insertId;
      const accountQuery = 'INSERT INTO account (userID, gebruikersnaam, wachtwoordHash, accountStatus, aangemaaktOp, bijgewerktOp) VALUES (?, ?, ?, "actief", NOW(), NOW())';

      // Gebruik de hash als het wachtwoordHash
      connection.query(accountQuery, [userId, email, hash], (accountError, accountResults) => {
        if (accountError) {
          console.error('Fout bij het aanmaken van account:', accountError);
          res.status(500).send('Er is een fout opgetreden bij het aanmaken van het account.');
          return;
        }

        console.log("Account succesvol aangemaakt voor gebruiker:", userId);
        res.json({ success: true, message: 'Account succesvol aangemaakt!' });
      });
    });
  });
});

app.post('/login', (req, res) => {
    const { gebruikersnaam, wachtwoord } = req.body;

    console.log('Ontvangen inlogverzoek voor gebruiker:', gebruikersnaam);

    const query = 'SELECT userID, wachtwoordHash FROM account WHERE gebruikersnaam = ?';
    connection.query(query, [gebruikersnaam], function(err, results) {
        if (err) {
            console.error('Databasefout:', err);
            res.status(500).send('Serverfout bij het ophalen van gebruikers');
            return;
        }
        if (results.length === 0) {
            console.log('Gebruikersnaam niet gevonden.');
            res.json({ success: false, message: 'Gebruikersnaam niet gevonden.' });
            return;
        }
        bcrypt.compare(wachtwoord, results[0].wachtwoordHash, function(err, result) {
            if (err) {
                console.error('Fout bij het vergelijken van wachtwoorden:', err);
                res.status(500).send('Serverfout bij het verifiëren van het wachtwoord');
                return;
            }
            if (result) {
                req.session.userId = results[0].userID;
                console.log('Inloggen geslaagd voor gebruiker:', gebruikersnaam);
                res.json({ success: true });
            } else {
                console.log('Onjuist wachtwoord voor gebruiker:', gebruikersnaam);
                res.json({ success: false, message: 'Wachtwoord onjuist.' });
            }
        });
    });
});

// Uitloggen route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Fout bij het vernietigen van de sessie:', err);
            res.status(500).send('Serverfout bij uitloggen');
            return;
        }
        res.redirect('/login.html');
        console.log('Succesvol uitgelogd');
    });
});

// Route om gebruikersgegevens op te halen
app.get('/getUserData', (req, res) => {
    if (!req.session.userId) {
        res.status(401).send('Niet geautoriseerd');
        return;
    }

    const loggedInUserId = req.session.userId;

    const query = 'SELECT titel, naam, praktijk, profilPic FROM users WHERE userID = ?';
    connection.query(query, [loggedInUserId], function(err, results) {
        if (err) {
            console.error('Databasefout:', err);
            res.status(500).send('Serverfout bij het ophalen van gebruikersgegevens');
            return;
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('Gebruiker niet gevonden');
        }
    });
});

// Route om gegevens te updaten
app.post('/updateProfile', (req, res) => {
    if (!req.session.userId) {
        res.status(401).send('Niet geautoriseerd');
        return;
    }

    const { title, name, practice } = req.body;
    const userId = req.session.userId;

    const query = 'UPDATE users SET titel = ?, naam = ?, praktijk = ? WHERE userID = ?';
    connection.query(query, [title, name, practice, userId], function(err, result) {
        if (err) {
            console.error('Databasefout:', err);
            res.status(500).send('Er is een fout opgetreden bij het bijwerken van het profiel.');
            return;
        }
        res.json({ success: true, message: 'Profiel succesvol bijgewerkt.' });
    });
});

// Sla profielfoto op
app.post('/upload', (req, res) => {
    const { image } = req.body;
    const userId = req.session.userId;

    const query = 'UPDATE users SET profilPic = ? WHERE userID = ?';
    connection.query(query, [image, userId], function(err, result) {
        if (err) {
            console.error('Databasefout:', err);
            res.status(500).send('Er is een fout opgetreden bij het opslaan van de afbeelding.');
        } else {
            res.json({ success: true, message: 'Afbeelding succesvol opgeslagen.' });
        }
    });
});


//Recept.js

// Route om het recept op te slaan in de db en een QR code te genereren en een pdf te maken.
app.post('/verwerkRecept', (req, res) => {
    const receptData = req.body;
    const { naam, geboortedatum, gebruiker } = req.body;
    const insertQuery = 'INSERT INTO recepten (naam, voorletters, geboortedatum, adres, huisnr, toev, postcode, woonplaats, recept, bezorgen, datumAanmaak, tijdstipAanmaak, gebruikerID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?)';
    connection.query(insertQuery, [receptData.naam, receptData.voorletters, receptData.geboortedatum, receptData.adres, receptData.huisnr, receptData.toev, receptData.postcode, receptData.woonplaats, receptData.recept, receptData.bezorgen, req.session.gebruikersnaam], function(err, result) {
        if (err) {
            console.error('Fout bij het opslaan in database:', err);
            res.status(500).send('Serverfout bij het opslaan van de gegevens');
            return;
        }

        // QR Code genereren
        QRCode.toDataURL(Object.values(receptData).join(", "), function (err, url) {
            if (err) {
                res.status(500).send("Fout bij het genereren van QR-code");
                return;
            }

            // PDF genereren
            const doc = new PDFDocument();
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(pdfData),
                    'Content-Type': 'application/pdf',
                    'Content-disposition': 'attachment;filename=recept.pdf', 
                }).end(pdfData);
            });

            doc.image(url, {
                fit: [100, 100],
                align: 'center',
                valign: 'center'
            });


            doc.fontSize(12).text(`Naam: ${naam}`, 100, 150);
            doc.text(`Geboortedatum: ${geboortedatum}`, 100, 170);
            doc.text(`Voorgeschreven door: ${gebruiker}`, 100, 190);
            doc.end();
        });
    });
});


//verstuurd.js
app.get('/api/recepten', (req, res) => {
    const pagina = parseInt(req.query.pagina) || 1;
    const naamFilter = req.query.naamFilter || '';
    const datumFilter = req.query.datumFilter || '';
    const receptenPerPagina = 10;
    const offset = (pagina - 1) * receptenPerPagina;

    let query = `SELECT * FROM recepten WHERE naam LIKE ? AND (datumAanmaak = ? OR ? = '') LIMIT ? OFFSET ?`;
    connection.query(query, [`%${naamFilter}%`, datumFilter, datumFilter, receptenPerPagina, offset], function(err, results) {
    if (err) {
        console.error('Fout bij het ophalen van recepten:', err);
        res.status(500).send('Serverfout bij het ophalen van de gegevens');
        return;
        }
        res.json(results);
    });
});

// Start de server

app.listen(port, () => {
    console.log(`Server luistert op http://localhost:${port}`);
  });
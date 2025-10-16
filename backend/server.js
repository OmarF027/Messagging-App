const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connessione DB
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  
    database: 'messaging_app'
});

db.connect(err => {
    if (err) throw err;
    console.log('DB connesso!');
});

// AUTENTICAZIONE
// Registrazione
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashed],
        (err, result) => {
            if (err) return res.status(400).send('Errore registrazione');
            res.send('Registrazione avvenuta!');
        }
    );
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).send('Errore DB');
        if (results.length === 0) return res.status(404).send('Utente non trovato');
        
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).send('Password errata');

        res.send({ id: user.id, username: user.username, avatar: user.avatar });
    });
});

// PROFILO
app.put('/profile/:id', (req, res) => {
    const { username, avatar } = req.body;
    const { id } = req.params;
    db.query(
        'UPDATE users SET username = ?, avatar = ? WHERE id = ?',
        [username, avatar, id],
        (err) => {
            if (err) return res.status(500).send('Errore aggiornamento');
            res.send('Profilo aggiornato!');
        }
    );
});

// MESSAGGI

// Invia messaggio
app.post('/messages', (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    db.query(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [sender_id, receiver_id, content],
        (err) => {
            if (err) return res.status(500).send('Errore invio messaggio');
            res.send('Messaggio inviato!');
        }
    );
});

// Leggi messaggi tra due utenti
app.get('/messages/:user1/:user2', (req, res) => {
    const { user1, user2 } = req.params;
    db.query(
        'SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at',
        [user1, user2, user2, user1],
        (err, results) => {
            if (err) return res.status(500).send('Errore caricamento messaggi');
            res.send(results);
        }
    );
});

// ----------------------
app.listen(3000, () => console.log('Server avviato su http://localhost:3000'));

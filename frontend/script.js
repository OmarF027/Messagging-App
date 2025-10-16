const API = 'http://localhost:3000';

// ---- Registrazione ----
async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    alert(await res.text());
}

// ---- Login ----
async function login() {
    const email = document.getElementById('logEmail').value;
    const password = document.getElementById('logPassword').value;

    const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    localStorage.setItem('user', JSON.stringify(data));
    alert('Login effettuato!');
    window.location = 'chat.html';
}

// ---- Invia messaggio ----
async function sendMessage() {
    const sender = JSON.parse(localStorage.getItem('user'));
    const receiver_id = document.getElementById('receiverId').value;
    const content = document.getElementById('messageContent').value;

    await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: sender.id, receiver_id, content })
    });
    alert('Messaggio inviato!');
}

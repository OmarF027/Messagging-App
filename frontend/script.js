const API = 'http://localhost:3000';
let currentUser = null;
let selectedContact = null;
let messageInterval = null;

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('user');
    if (userData) {
        currentUser = JSON.parse(userData);
        
        if (document.getElementById('currentUser')) {
            document.getElementById('currentUser').textContent = `Ciao, ${currentUser.username}`;
        }
        
        if (document.getElementById('profileUsername')) {
            loadProfile();
        }
        
        if (document.getElementById('contactsList')) {
            loadContacts();
            // Polling per nuovi messaggi
            messageInterval = setInterval(loadMessages, 3000);
        }
    } else if (!window.location.pathname.includes('index.html') && 
               window.location.pathname.endsWith('.html')) {
        window.location.href = 'index.html';
    }
});

// ---- REGISTRAZIONE ----
async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const errorElement = document.getElementById('regError');

    if (!username || !email || !password) {
        errorElement.textContent = 'Compila tutti i campi';
        return;
    }

    try {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        if (res.ok) {
            errorElement.textContent = '';
            alert('Registrazione completata! Ora puoi fare login.');
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            const error = await res.text();
            errorElement.textContent = error;
        }
    } catch (error) {
        errorElement.textContent = 'Errore di connessione';
    }
}

// ---- LOGIN ----
async function login() {
    const email = document.getElementById('logEmail').value;
    const password = document.getElementById('logPassword').value;
    const errorElement = document.getElementById('logError');

    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (res.ok) {
            const user = await res.json();
            localStorage.setItem('user', JSON.stringify(user));
            window.location.href = 'chat.html';
        } else {
            errorElement.textContent = 'Email o password errati';
        }
    } catch (error) {
        errorElement.textContent = 'Errore di connessione';
    }
}

// ---- LOGOUT ----
function logout() {
    localStorage.removeItem('user');
    if (messageInterval) clearInterval(messageInterval);
    window.location.href = 'index.html';
}

// ---- CARICA CONTATTI ----
async function loadContacts() {
    try {
        const res = await fetch(`${API}/users`);
        const users = await res.json();
        
        const contactsList = document.getElementById('contactsList');
        contactsList.innerHTML = '';
        
        users.forEach(user => {
            if (user.id !== currentUser.id) {
                const contactDiv = document.createElement('div');
                contactDiv.className = 'contact';
                contactDiv.innerHTML = `
                    <strong>${user.username}</strong>
                    ${user.avatar ? `<img src="${user.avatar}" style="width: 20px; height: 20px; border-radius: 50%; margin-left: 5px;">` : ''}
                `;
                contactDiv.onclick = () => selectContact(user);
                contactsList.appendChild(contactDiv);
            }
        });
    } catch (error) {
        console.error('Errore caricamento contatti:', error);
    }
}

// ---- SELEZIONA CONTATTO ----
function selectContact(user) {
    selectedContact = user;
    document.getElementById('selectedContact').innerHTML = `
        <h3>Chat con ${user.username}</h3>
    `;
    loadMessages();
}

// ---- CARICA MESSAGGI ----
async function loadMessages() {
    if (!selectedContact) return;
    
    try {
        const res = await fetch(`${API}/messages/${currentUser.id}/${selectedContact.id}`);
        const messages = await res.json();
        
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            const isSent = msg.sender_id == currentUser.id;
            messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
            messageDiv.innerHTML = `
                <div><strong>${isSent ? 'Tu' : selectedContact.username}:</strong> ${msg.content}</div>
                <small>${new Date(msg.created_at).toLocaleTimeString()}</small>
            `;
            messagesList.appendChild(messageDiv);
        });
        
        // Scroll automatico all'ultimo messaggio
        messagesList.scrollTop = messagesList.scrollHeight;
    } catch (error) {
        console.error('Errore caricamento messaggi:', error);
    }
}

// ---- INVIA MESSAGGIO ----
async function sendMessage() {
    if (!selectedContact) {
        alert('Seleziona un contatto prima di inviare un messaggio');
        return;
    }
    
    const content = document.getElementById('messageContent').value.trim();
    if (!content) return;

    try {
        await fetch(`${API}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sender_id: currentUser.id, 
                receiver_id: selectedContact.id, 
                content 
            })
        });
        
        document.getElementById('messageContent').value = '';
        loadMessages(); // Ricarica immediatamente i messaggi
    } catch (error) {
        console.error('Errore invio messaggio:', error);
    }
}

// ---- INVIO CON ENTER ----
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ---- PROFILO ----
function loadProfile() {
    document.getElementById('profileUsername').value = currentUser.username;
    if (currentUser.avatar) {
        document.getElementById('profileAvatar').value = currentUser.avatar;
    }
}

async function updateProfile() {
    const username = document.getElementById('profileUsername').value;
    const avatar = document.getElementById('profileAvatar').value;
    const messageElement = document.getElementById('profileMessage');

    try {
        const res = await fetch(`${API}/profile/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, avatar })
        });
        
        if (res.ok) {
            // Aggiorna i dati locali
            currentUser.username = username;
            currentUser.avatar = avatar;
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            messageElement.textContent = 'Profilo aggiornato con successo!';
            setTimeout(() => {
                messageElement.textContent = '';
            }, 3000);
        }
    } catch (error) {
        console.error('Errore aggiornamento profilo:', error);
    }
}
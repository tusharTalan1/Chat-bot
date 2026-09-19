let socket;
let currentUser = null;
let currentRoom = 'global';

const API_URL = '/api/auth';

const initAuth = () => {
  const token = localStorage.getItem('token');
  if (token && window.location.pathname !== '/chat') {
    window.location.href = '/chat';
  } else if (!token && window.location.pathname === '/chat') {
    window.location.href = '/';
  } else if (token && window.location.pathname === '/chat') {
    fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        currentUser = data;
        initChat();
      }
    })
    .catch(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  }
};

const switchTab = (tab) => {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  
  if (loginTab) loginTab.classList.remove('active');
  if (registerTab) registerTab.classList.remove('active');
  
  const activeTab = document.getElementById(`${tab}-tab`);
  if (activeTab) activeTab.classList.add('active');

  const usernameGroup = document.getElementById('username-group');
  if (tab === 'register') {
    if (usernameGroup) usernameGroup.classList.remove('hidden');
    document.getElementById('username').required = true;
    document.getElementById('submit-btn').textContent = 'Register';
  } else {
    if (usernameGroup) usernameGroup.classList.add('hidden');
    document.getElementById('username').required = false;
    document.getElementById('submit-btn').textContent = 'Login';
  }
};

const handleAuth = async (e) => {
  e.preventDefault();
  const isRegister = !document.getElementById('username-group').classList.contains('hidden');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;
  
  const endpoint = isRegister ? '/register' : '/login';
  const payload = isRegister ? { email, password, username } : { email, password };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = '/chat';
    } else {
      showError(data.message || 'Authentication failed');
    }
  } catch (error) {
    showError('Server error, please try again.');
  }
};

const showError = (msg) => {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 3000);
  }
};

const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const initChat = () => {
  document.getElementById('current-username').textContent = currentUser.username;
  
  socket = io({
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('connect_error', (err) => {
    if (err.message === 'Authentication error') {
      logout();
    }
  });

  socket.emit('join_room', currentRoom);

  socket.on('receive_message', (message) => {
    if (message.room === currentRoom) {
      appendMessage(message);
    }
  });
};

const sendMessage = (e) => {
  e.preventDefault();
  const input = document.getElementById('message-input');
  const content = input.value;
  
  if (content.trim() && socket) {
    socket.emit('send_message', {
      room: currentRoom,
      content
    });
    input.value = '';
  }
};

const appendMessage = (message) => {
  const container = document.getElementById('messages-container');
  const isSelf = message.sender._id === currentUser._id;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isSelf ? 'self' : ''}`;
  
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  msgDiv.innerHTML = `
    <div class="message-header">
      <span class="message-author">${isSelf ? 'You' : message.sender.username}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-content">${message.content}</div>
  `;
  
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
};

const joinRoom = (room) => {
  currentRoom = room;
  document.getElementById('messages-container').innerHTML = '';
  if (socket) {
    socket.emit('join_room', room);
  }
};

window.onload = initAuth;

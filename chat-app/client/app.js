let socket;
let currentUser = null;
let currentRoom = sessionStorage.getItem('currentRoom') || 'global';
let currentRoomName = sessionStorage.getItem('currentRoomName') || 'Global Chat';

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
        fetchUsers();
      }
    })
    .catch(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  }
};

const fetchUsers = async () => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = await res.json();
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    users.forEach(user => {
      const li = document.createElement('li');
      li.className = 'room user-item';
      li.id = `user-${user._id}`;
      li.innerHTML = `
        <span class="status-indicator ${user.isOnline ? 'online' : 'offline'}"></span>
        ${user.username}
      `;
      li.onclick = () => {
        const roomName = [currentUser._id, user._id].sort().join('_');
        joinRoom(roomName, user.username);
      };
      usersList.appendChild(li);
    });


    if (currentRoom !== 'global') {
      document.querySelector('#rooms-list .room')?.classList.remove('active');
      const userIds = currentRoom.split('_');
      const otherId = userIds.find(id => id !== currentUser._id);
      if (otherId) {
        const userLi = document.getElementById(`user-${otherId}`);
        if (userLi) userLi.classList.add('active');
      }
    }

  } catch (err) {
    console.error(err);
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
  sessionStorage.removeItem('currentRoom');
  sessionStorage.removeItem('currentRoomName');
  window.location.href = '/';
};

const initChat = () => {
  document.getElementById('current-username').textContent = currentUser.username;
  document.getElementById('room-name').textContent = currentRoomName;
  
  socket = io({
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('connect_error', (err) => {
    if (err.message === 'Authentication error') {
      logout();
    }
  });

  socket.on('connect', () => {

    joinRoom(currentRoom, currentRoomName);
  });

  socket.on('load_messages', (messages) => {
    messages.forEach(msg => appendMessage(msg));
  });

  socket.on('receive_message', (message) => {
    if (message.room === currentRoom) {
      appendMessage(message);
    }
  });

  socket.on('user_status_change', (data) => {
    const userLi = document.getElementById(`user-${data.userId}`);
    if (userLi) {
      const indicator = userLi.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = `status-indicator ${data.isOnline ? 'online' : 'offline'}`;
      }
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

const joinRoom = (room, name) => {
  currentRoom = room;
  currentRoomName = name || 'Global Chat';
  sessionStorage.setItem('currentRoom', currentRoom);
  sessionStorage.setItem('currentRoomName', currentRoomName);

  document.getElementById('messages-container').innerHTML = '';
  document.getElementById('room-name').textContent = currentRoomName;
  
  document.querySelectorAll('.room').forEach(el => el.classList.remove('active'));
  
  if (room === 'global') {
    document.querySelector('#rooms-list .room')?.classList.add('active');
  } else {
    const userIds = room.split('_');
    const otherId = userIds.find(id => id !== currentUser._id);
    if (otherId) {
      const userLi = document.getElementById(`user-${otherId}`);
      if (userLi) userLi.classList.add('active');
    }
  }

  if (socket) {
    socket.emit('join_room', room);
  }
};

window.onload = initAuth;

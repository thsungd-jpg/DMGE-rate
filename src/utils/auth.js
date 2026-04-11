// src/utils/auth.js

// Simple MVP hashing (NOT FOR PRODUCTION SECURITY)
// We just base64 encode it so it's not strictly plaintext in local storage.
function encodePassword(pwd) {
  try {
    return btoa(unescape(encodeURIComponent(pwd)));
  } catch(e) {
    return btoa(pwd); 
  }
}

export function getCurrentUser() {
  const session = localStorage.getItem('rate_current_session');
  if (!session) return null;
  try {
    const { userId } = JSON.parse(session);
    const users = JSON.parse(localStorage.getItem('rate_users_v1') || '[]');
    const user = users.find(u => u.id === userId);
    if (user) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      saveUsers(users);
      return user;
    }
  } catch (err) {
    console.error("Session parse error", err);
  }
  return null;
}

function saveUsers(users) {
  localStorage.setItem('rate_users_v1', JSON.stringify(users));
}

export function login(email, password) {
  const users = JSON.parse(localStorage.getItem('rate_users_v1') || '[]');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const encodedInput = encodePassword(password);
  if (user.passwordHash !== encodedInput) {
    throw new Error("Invalid email or password");
  }

  // Set session
  localStorage.setItem('rate_current_session', JSON.stringify({ userId: user.id }));
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);
  
  return user;
}

export function logout() {
  localStorage.removeItem('rate_current_session');
}

export function register(email, password, name) {
  const users = JSON.parse(localStorage.getItem('rate_users_v1') || '[]');
  
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email is already registered");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const isFirstUser = users.length === 0;

  const newUser = {
    id: "user-" + Date.now() + Math.random().toString(36).substring(2, 8),
    email: email.trim(),
    name: name.trim(),
    passwordHash: encodePassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Auto-login
  localStorage.setItem('rate_current_session', JSON.stringify({ userId: newUser.id }));

  if (isFirstUser) {
    migrateLegacyData(newUser.id);
  }

  return newUser;
}

function migrateLegacyData(userId) {
  const keysToMigrate = [
    'rate_jobs_v3',
    'rate_profile_v3',
    'rate_templates_v1',
    'rate_clients_v1'
  ];

  keysToMigrate.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      localStorage.setItem(`${userId}_${key}`, data);
      // Optional: remove old data
      // localStorage.removeItem(key);
    }
  });
}

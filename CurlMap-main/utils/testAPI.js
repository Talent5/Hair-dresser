// Test API Connectivity Script
// Run this in your mobile app to test backend connection

import { API_CONFIG } from './constants';

export const testAPIConnection = async () => {
  try {
    console.log('Testing API connection to:', API_CONFIG.BASE_URL);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ API Connection Successful!');
      console.log('Response:', data);
      return true;
    } else {
      console.log('❌ API Connection Failed');
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return false;
  }
};

// Test Socket Connection
export const testSocketConnection = () => {
  try {
    console.log('Testing Socket connection to:', API_CONFIG.SOCKET_URL);
    
    const socket = require('socket.io-client')(API_CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket Connection Successful!');
      socket.disconnect();
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket Connection Failed:', error.message);
    });
    
    return socket;
  } catch (error) {
    console.log('❌ Socket Error:', error.message);
    return null;
  }
};
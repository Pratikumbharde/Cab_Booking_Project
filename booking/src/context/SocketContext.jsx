import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get token from localStorage or your auth context
    const token = localStorage.getItem('token');
    
    if (token && !socket) {
      const newSocket = connectSocket(token);
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        setIsConnected(true);
      });
      
      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });
    }

    return () => {
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

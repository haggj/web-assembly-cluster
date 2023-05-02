import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

function App() {
  const [message, setMessage] = useState('');
  //const [socket, setSocket] = useState(null);
  const [socket, setSocket] = useState<Socket>(null);
  const [incomingMessage, setIncomingMessage] = useState('');

  const newSocket = io('http://localhost:3001');
  newSocket.on('message', message => {
    setIncomingMessage(message);
  });
  setSocket(newSocket);

  useEffect(() => {
    async function fetchData() {
      const result = await axios.get('http://localhost:3001/');
      setMessage(result.data);
    }
    fetchData();

    //return () => newSocket.disconnect();
  }, []);

  return (
      <div>
        <h1>{message}</h1>
        <h2>Incoming message: {incomingMessage}</h2>
      </div>
  );
}

export default App;


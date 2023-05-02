import {BrowserRouter, Routes, Route} from 'react-router-dom';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {MasterDashboard} from "./pages/masterDashboard/masterDashboard";
import {Client} from "./pages/client/client";
import HelloWorld from "./pages/helloWorld";
import {NoPage} from "./pages/noPage";

function App() {
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [socketStatus, setSocketStatus] = useState('closed')
  const [incomingMessage, setIncomingMessage] = useState('');

  async function fetchData() {
    const result = await axios.get('http://localhost:3001/hello-world');
    setMessage(result.data);
  }

  function onMessage(message) {
    console.log('Recieved: ', + message)
    setIncomingMessage(message);
  }

  const openWebSocket = () => {
    // open Websocket
    const socket = io('http://localhost:3001');
    socket.on('connect', () => {
      console.log(
          `Opened WebSocket with id: ${socket.id}`,
      );
      socket.emit('message', 'Test Connection success');
    });
    socket.on('message', onMessage)
    setSocket(socket);
    setSocketStatus('Connected')
  };

  const closeWebSocket = () => {
    // disconnect WebSocket session
    if (socket) {
      socket.disconnect();
    }
    setSocket(undefined);
    setSocketStatus('Closed')
    setIncomingMessage('-');
  }


  useEffect(() => {
    fetchData();
  }, []);

  return (
      <>
        <BrowserRouter>
          <Routes>
            <Route path="/">
              <Route index element={<NoPage />} />
              <Route path="master-dashboard" element={<MasterDashboard />} />
              <Route path="client" element={<Client />} />
              <Route path="hello-world" element={<HelloWorld />} />
              <Route path="*" element={<NoPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </>
  );
}

export default App;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function HelloWorld() {
    const [message, setMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [socketStatus, setSocketStatus] = useState('closed')
    const [incomingMessage, setIncomingMessage] = useState('');

    async function fetchData() {
        const result = await axios.get(global.backend + '/hello-world');
        setMessage(result.data);
    }

    function onMessage(message) {
        console.log('Recieved: ', + message)
        setIncomingMessage(message);
    }

    const openWebSocket = () => {
        // open Websocket
        const socket = io(global.backend);
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
        <div>
            <h1>{message}</h1>
            <div>
                <h3>Socket Status: {socketStatus}</h3>
                <button onClick={openWebSocket}>Open Socket</button>
                <button onClick={closeWebSocket}>Close Socket</button>
            </div>
            <h2>Incoming message: {incomingMessage}</h2>
        </div>
);
}

export default HelloWorld;


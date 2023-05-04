import React, { useEffect, useState } from 'react';
import './wasm_exec.js';
import { io } from 'socket.io-client';

export const Client = () => {
    const [message, setMessage] = useState('');
    const [loadedWasm, setLoadedWasm] = useState('Not loaded');
    const [runningJob, setRunningJob] = useState('None');
    const [socket, setSocket] = useState(null);
    const [socketStatus, setSocketStatus] = useState('closed')


    // ------------------------------------- WASM -------------------------------------------------


    // Download WASM file and load it into the JS scope
    const initWebAssembly = async (wasm_path) => {
       let go = new window.Go();
       let result = await WebAssembly.instantiateStreaming(fetch(wasm_path, {cache: "no-store"}), go.importObject);
       go.run(result.instance);
     };

    // Call the WASM function with the provided arguments
    const runWebAssembly = (...args) => {
        return window.wasmFunction(...args);
    }

     // ---------------------------------- Web Sockets ----------------------------------------------

    async function onLoadWasm(message) {
        await initWebAssembly("http://localhost:3001/wasm/" + message);
        setLoadedWasm(message);
    }

    function onRunWasm(message) {
        // message is JSON string of the form {id: string, data: list of arguments}
        let job = JSON.parse(message);
        setRunningJob(job.id);
        let wasm_result = runWebAssembly(...job.data);
        let result = {id: job.id, result: wasm_result};
        //socket.emit('resultwasm', JSON.stringify(result));
        return result;
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
        socket.on('loadwasm', onLoadWasm)
        socket.on('runwasm', onRunWasm)
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
    }

   let testStuff = async() => {

      await onLoadWasm("hashcrack.wasm")
      console.log('loaded wasm');

      const hash = Uint8Array.from([58, 196, 44, 131, 94, 101, 124, 169, 86, 7, 42, 215, 197, 160, 67, 233, 74, 171, 0, 112, 140, 38, 14, 99, 14, 16, 147, 84, 41, 159, 55, 51]);
      let test_input = JSON.stringify({id: "92309", data: [btoa(hash), "hallo", "hi", "ho"]});
      console.log(test_input)

      let result = onRunWasm(test_input);
      console.log(result);
  };

  useEffect(() => {
        testStuff();
        openWebSocket();
    }, []);


    return (
    <div>
        <h1>Client</h1>
        <h3>Socket Status: {socketStatus}</h3>
        <h3>Loaded WASM: {loadedWasm}</h3>
        <h3>Job running: {runningJob}</h3>
    </div>
    );
};

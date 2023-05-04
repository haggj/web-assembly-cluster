import React, { useEffect, useState } from 'react';
import './wasm_exec.js';
import { io } from 'socket.io-client';

export const Client = () => {
    const [loadedWasm, setLoadedWasm] = useState('Not loaded');
    const [runningJob, setRunningJob] = useState('None');
    const [socketStatus, setSocketStatus] = useState('closed')
    let socket = null;


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
        console.log(message + " file loaded")
        // Send empty object to indicate that the WASM file was loaded and client is ready
        socket.emit('resultwasm', JSON.stringify({}));
    }

    function onRunWasm(job) {
        // job is a JS object of the form {id: string, data: list of arguments}
        setRunningJob(job.id);
        console.log("Received job:")
        console.log(job)
        let wasm_result = runWebAssembly(...job.data);
        let result = {id: job.id, result: wasm_result};
        console.log("Result of job:")
        console.log(result)
        socket.emit('resultwasm', result);
    }

    const openWebSocket = () => {
        // open Websocket
        const sock = io('http://localhost:3001');
        sock.on('loadwasm', onLoadWasm)
        sock.on('runwasm', onRunWasm)
        socket = sock;
        setSocketStatus('Connected')
        console.log("WebSocket connection established")
    };

//     const closeWebSocket = () => {
//         // disconnect WebSocket session
//         if (socket) {
//             socket.disconnect();
//         }
//         setSocket(undefined);
//         setSocketStatus('Closed')
//         console.log("WebSocket connection closed")
//     }

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
       if(socket == null){
        openWebSocket();
       }
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

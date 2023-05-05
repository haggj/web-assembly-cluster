import React, { useEffect, useState } from 'react';
import './wasm_exec.js';
import { io } from 'socket.io-client';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import {Link} from "react-router-dom";


export const Client = () => {
    // Infos about the running job
    const [loadedWasm, setLoadedWasm] = useState('');
    const [jobName, setJobName] = useState('');
    const [jobIsRunning, setJobIsRunning] = useState(false);
    let [finishedJobs, setFinishedJobs] = useState(0);

    const [isConnected, setIsConnected] = useState(false)
    let socket = null;
    const sleep = ms => new Promise(r => setTimeout(r, ms));


    // ------------------------------------- WASM -------------------------------------------------


    // Download WASM file and load it into the JS scope
    const initWebAssembly = async (wasm_path) => {
       let go = new window.Go();
       let result = await WebAssembly.instantiateStreaming(fetch(wasm_path, {cache: "no-store"}), go.importObject);
       go.run(result.instance);
     };

    // Call the WASM function with the provided arguments
    const runWebAssembly = async (...args) => {
        return await window.wasmFunction(...args);
    }

     // ---------------------------------- Web Sockets ----------------------------------------------

    async function onLoadWasm(message) {
        await initWebAssembly("http://localhost:3001/wasm/" + message);
        setLoadedWasm(message);
        console.log(message + " file loaded")
        // Send empty object to indicate that the WASM file was loaded and client is ready
        socket.emit('resultwasm', {});
    }

    async function onRunWasm(job) {
        // job is a JS object of the form {id: string, data: list of arguments}
        console.log("Received job:")
        console.log(job)

        setJobName(job.id);
        setJobIsRunning(true);

        await sleep(100);

        const start = Date.now();
        let wasm_result = await runWebAssembly(...job.data);
        const end = Date.now();


        setJobIsRunning(false);
        finishedJobs += 1;
        setFinishedJobs(finishedJobs);

        let result = {id: job.id, result: wasm_result, duration: end-start};
        console.log("Result of job:")
        console.log(result)
        socket.emit('resultwasm', result);
    }

    const openWebSocket = () => {
        // open Websocket
        const sock = io(window.location.origin, {path: '/api/ws'});
        sock.on('loadwasm', onLoadWasm)
        sock.on('runwasm', onRunWasm)
        socket = sock;
        setIsConnected(true)
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

  useEffect(() => {
       if(socket == null){
        openWebSocket();
       }
    }, []);


    return (
    <div style={{margin: '30px'}}>

        <Card style={{maxWidth: '700px'}}>
      <Card.Body >

        <Card.Title>HPC Client</Card.Title>
        <Card.Subtitle>Your device is part of the WebAssembly cluster and is ready to execute jobs.</Card.Subtitle>

        <ListGroup style={{marginTop: '20px'}}>
       <ListGroup.Item active>
        Status of your client
      </ListGroup.Item>
      <ListGroup.Item>
        {isConnected?
           <>
               <img src={require('./connected.gif')} width="40" height="40" style={{marginRight: '10px'}}/>
               Connected to server.
           </>
           :
           <>
               Not connected to server.
           </>
        }
      </ListGroup.Item>
      <ListGroup.Item>
        {jobIsRunning?
           <>
               <img src={require('./computing.gif')} width="35" height="35" style={{marginRight: '15px'}}/>
               Job running: {loadedWasm} - {jobName}
           </>
           :
           <>
               Waiting for jobs.
           </>
        }

      </ListGroup.Item>

      <ListGroup.Item>Finished jobs: {finishedJobs} </ListGroup.Item>
    </ListGroup>
      </Card.Body>
    </Card>

            <Link to="/">Home</Link>

    </div>
    );
};

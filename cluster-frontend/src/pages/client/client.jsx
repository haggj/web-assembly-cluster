import React, {useEffect, useState} from 'react';
import './wasm_exec.js';
import {io} from 'socket.io-client';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import {Link} from "react-router-dom";


export const Client = () => {
    // Status information about the client for UI
    const [loadedWasm, setLoadedWasm] = useState('');
    const [jobName, setJobName] = useState('');
    const [jobIsRunning, setJobIsRunning] = useState(false);
    let [finishedJobs, setFinishedJobs] = useState(0);

    // Variables to maintain the websocket connection to the server
    let socket = null;
    const [isConnected, setIsConnected] = useState(false)

    // Stores the webworker which runs go wasm files
    let worker = null;
    let job_start = null;
    let latest_job = null;


    const workerEventListener =  function(event) {

        const { eventType, eventData, eventId } = event.data;

        if (eventType === "INITIALISED") {
            // Webworker is initialized, inform server that client is ready
            setLoadedWasm(eventData);
            console.log(eventData + " file loaded")
            // Send empty object to indicate that the WASM file was loaded and client is ready
            socket.emit('resultwasm', {});
        } else if (eventType === "RESULT") {
            const job_end = Date.now();

            setJobIsRunning(false);
            finishedJobs += 1;
            setFinishedJobs(finishedJobs);

            let result = {id: latest_job.id, result: eventData, duration: job_end - job_start};
            console.log("Result of job:")
            console.log(result)
            socket.emit('resultwasm', result);
        } else if (eventType === "ERROR") {
            console.log("Error during job:")
            console.log(eventData)
            setJobIsRunning(false);
        }

    }

    async function onLoadWasm(wasm_path) {
        // Initialize a new webworker with the requested go wasm file
        worker = new Worker('api/wasm_worker.js');
        worker.addEventListener('message', workerEventListener)
        let data = {
            root: window.location.origin + "/api/wasm/",
            path: wasm_path
        }
        worker.postMessage({eventType: "INITIALISE", eventData: data});
    }

    async function onRunWasm(job) {
        // job is a JS object of the form {id: string, data: list of arguments}
        console.log("Received job:")
        console.log(job)

        setJobName(job.id.slice(0,10));
        setJobIsRunning(true);
        latest_job = job;

        job_start = Date.now();
        worker.postMessage({eventType: "CALL", eventData: job.data});
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


    useEffect(() => {
        if (socket == null) {
            openWebSocket();
        }
    }, []);


    return (
        <div style={{margin: '30px'}}>

            <Card style={{maxWidth: '700px'}}>
                <Card.Body>

                    <Card.Title>HPC Client</Card.Title>
                    <Card.Subtitle>Your device is part of the WebAssembly cluster and is ready to execute
                        jobs.</Card.Subtitle>

                    <ListGroup style={{marginTop: '20px'}}>
                        <ListGroup.Item active>
                            Status of your client
                        </ListGroup.Item>
                        <ListGroup.Item>
                            {isConnected ?
                                <>
                                    <img src={require('./connected.gif')} width="40" height="40"
                                         style={{marginRight: '10px'}}/>
                                    Connected to server.
                                </>
                                :
                                <>
                                    Not connected to server.
                                </>
                            }
                        </ListGroup.Item>
                        <ListGroup.Item>
                            {jobIsRunning ?
                                <>
                                    <img src={require('./computing.gif')} width="35" height="35"
                                         style={{marginRight: '15px'}}/>
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

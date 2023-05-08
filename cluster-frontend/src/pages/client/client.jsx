import React, {useEffect, useState} from 'react';
import './wasm_exec.js';
import {io} from 'socket.io-client';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Accordion from 'react-bootstrap/Accordion';
import {Link} from "react-router-dom";
import Table from 'react-bootstrap/Table';
var platform = require('platform');


export const Client = () => {
    // Status information about the client for UI
    let [loadedWasm, setLoadedWasm] = useState('');

    // Variables to maintain the websocket connection to the server
    let socket = null;
    let [isConnected, setIsConnected] = useState(false)

    // Stores the webworker which runs go wasm files
    let worker = null;
    let latestJobStart = null;
    let latestJob = null;
    let [latestJobName, setLatestJobName] = useState('');
    let [jobIsRunning, setJobIsRunning] = useState(false);
    let [finishedJobs, setFinishedJobs] = useState([]);

    // Client detection
    let [os, setOs] = useState(null);
    let [browser, setBrowser] = useState(null);



    const workerEventListener = function (event) {

        const {eventType, eventData, eventId} = event.data;

        if (eventType === "INITIALISED") {
            // Webworker is initialized, inform server that client is ready
            loadedWasm = eventData;
            setLoadedWasm(loadedWasm);
            console.log(eventData + " file loaded")
            // Send empty object to indicate that the WASM file was loaded and client is ready
            socket.emit('resultwasm', {});
        } else if (eventType === "RESULT") {
            // Webworker finished job
            const latestJobEnd = Date.now();
            latestJob.duration = latestJobEnd - latestJobStart;
            latestJob.type = loadedWasm;

            setJobIsRunning(false);
            finishedJobs.push(latestJob);
            setFinishedJobs(finishedJobs);

            let result = {id: latestJob.id, result: eventData, duration: latestJob.duration};
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

        setLatestJobName(job.id.slice(0, 10));
        setJobIsRunning(true);
        latestJob = job;

        latestJobStart = Date.now();
        worker.postMessage({eventType: "CALL", eventData: job.data});
    }


    const openWebSocket = () => {
        // open Websocket

        // only rely on websocket to avoid that socket stays open during tab refresh:
        // https://stackoverflow.com/questions/41924713/node-js-socket-io-page-refresh-multiple-connections
        const sock = io(window.location.origin, {path: '/api/ws'});
        sock.on("connect_error", (err) => {
            console.log(`connect_error due to ${err.message}`);
            setIsConnected(false)
        });
        sock.on("connect", (err) => {
            if (socket != null) {
                console.log("Disconnected earlier connection")
                socket.disconnect()
            }
            console.log("WebSocket connection established")
            socket = sock;
            setIsConnected(true)
        });
        sock.on('loadwasm', onLoadWasm)
        sock.on('runwasm', onRunWasm)
    };


    useEffect(() => {
        window.addEventListener("beforeunload", cleanupFunction);
        setOs(platform.os)
        setBrowser(platform.name)
        if (socket === null) {
            openWebSocket();
        }
    }, []);

    const cleanupFunction = () => {
        if (socket !== null){
            console.log("Disconnect socket because unloading...")
            socket.emit("manual_disconnect");
        }
    }


    const monospace = {
        fontFamily: 'monospace',
        backgroundColor: '#eee',
        borderRadius: '5px',
        display: 'inline-block',
        padding: '8px'

    }

    return (
        <div style={{margin: '30px'}}>

            <Card style={{maxWidth: '800px'}}>
                <Card.Body>

                    <Card.Title><h2>HPC Client</h2></Card.Title>
                    <Card.Subtitle>Your device is part of the WebAssembly cluster and is ready to execute
                        jobs.</Card.Subtitle>

                    <ListGroup style={{marginTop: '20px'}}>
                        <ListGroup.Item active>
                            Status of your client
                        </ListGroup.Item>
                        <ListGroup.Item>
                            Client detection:&emsp;&emsp;&emsp;
                            <span style={monospace}>{browser + " @ " + os}</span>
                        </ListGroup.Item>
                        <ListGroup.Item>
                            Connection status:&emsp;&emsp;
                            {isConnected ?
                                <>
                                    Online
                                    <img src={require('./connected.gif')} width="40" height="40"
                                         style={{marginLeft: '0px'}}/>
                                </>
                                :
                                <>
                                    Not connected to server.
                                </>
                            }
                        </ListGroup.Item>
                        <ListGroup.Item>
                            {"Job status  :   "}&emsp;&emsp;&emsp;&emsp;&emsp;
                            {jobIsRunning ?
                                <>
                                    <img src={require('./computing.gif')} width="35" height="35"
                                         style={{marginRight: '15px'}}/>
                                    Running {loadedWasm}{" - "}
                                    <span style={monospace}> {latestJobName} </span>
                                </>
                                :
                                <>
                                    Waiting for jobs.
                                </>
                            }

                        </ListGroup.Item>


                        <ListGroup.Item style={{padding: "0px"}}>
                            <Accordion flush>
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>
                                        Finished jobs:&emsp;&emsp;&emsp;&emsp;
                                        {finishedJobs.length}
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        {finishedJobs.length == 0 ?
                                            <>
                                                Your client has no finished jobs yet.
                                            </>
                                            :
                                            <>
                                                <span>Your client has finished the following jobs.</span>
                                                <p> Average duration: {
                                                    Math.round(finishedJobs.reduce((total, obj) => {
                                                        return total + obj.duration;
                                                    }, 0) / finishedJobs.length)
                                                } ms</p>
                                                <Table bordered hover>
                                                    <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Type</th>
                                                        <th>ID</th>
                                                        <th>Duration</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {finishedJobs.map((e, idx) => (
                                                        <tr>
                                                            <td>{idx + 1}</td>
                                                            <td>{e.type}</td>
                                                            <td><span style={monospace}>{e.id.slice(0, 10)}</span></td>
                                                            <td>{e.duration} ms</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </Table>
                                            </>

                                        }

                                    </Accordion.Body>
                                </Accordion.Item>

                            </Accordion>


                        </ListGroup.Item>
                    </ListGroup>
                </Card.Body>
            </Card>


            <Link to="/">Home</Link>

        </div>
    );
};

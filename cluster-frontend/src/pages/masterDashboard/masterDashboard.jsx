import React, { useEffect, useState } from 'react';
import axios from "axios";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import {Badge, ButtonToolbar, ProgressBar} from "react-bootstrap";
import {Link} from "react-router-dom";
import {io} from "socket.io-client";

export const MasterDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [runningJob, setRunningJob] = useState(undefined)
    let socket = null;

    async function onJobInfo(message) {
        console.log(message)
        setJobs(message)
    }

    const openWebSocket = () => {
        // open Websocket
        const sock = io(window.location.origin, {path: '/api/ws'});
        sock.on('jobInfo', onJobInfo)
        socket = sock;
        console.log("WebSocket connection established")
        socket.emit('isMasterSocket', 'I am a Master Socket!');
    };

    const fetchJobs = async () => {
        const result = await axios.get(window.location.origin + '/api/jobs');
        setJobs(result.data);
    }

    const startJob = async (job) => {
        if (runningJob) {
            console.log(`Can not start ${job}!\n Currently running ${runningJob}`)
        } else {
            console.log(`starting job ${job}...`)
            const result = await axios.post(window.location.origin + '/api/jobs', {'job': job});
            if (result.status === 201) {
                console.log('successfully started job')
                setRunningJob(job)
            } else {
                console.log(`Server returned ${result.status}`)
            }
        }
    }

    const stopJob = async (job) => {
        if (runningJob) {
            if (job === runningJob) {
                console.log(`stopping job ${job}...`)
                const result = await axios.delete(window.location.origin + `/api/jobs/${job}`);
                if (result.status === 200) {
                    console.log('successfully stoped job')
                    setRunningJob(undefined)
                } else {
                    console.log(`Server returned ${result.status}`)
                }
            } else {
                console.log(`Cant stop ${job}! Job ${runningJob} is currently running currently`)
            }
        } else {
            console.log('Cant stop job!\n No Jobs are running currently')
        }
    }

    const resetJob = async (job) => {
        console.log(`reset job ${job}...`)
        const result = await axios.post(window.location.origin + '/api/reset', {'job': job});
        if (result.status === 201) {
            console.log('successfully reset job')
        } else {
            console.log(`Server returned ${result.status}`)
        }
        fetchJobs()
    }

    useEffect(() => {
        fetchJobs();
        if(socket == null){
            openWebSocket();
        }
    }, [])

    return (
        <div style={{margin: '30px'}}>
            <Card style={{maxWidth: '700px'}}>
                <Card.Body>
                    <Card.Title>
                        Master Dashboard
                    </Card.Title>
                    <Card.Title>
                        Jobs
                    </Card.Title>
                    <Card.Body>
                        <Card.Subtitle>
                            Currently Running: {runningJob}
                        </Card.Subtitle>
                        <ListGroup>
                            {jobs.map((job) => {
                                return (
                                    <ListGroup.Item>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="fw-bold">{job.wasmPath}</div>
                                            <Badge bg="secondary">{job.job_status}</Badge>
                                            <ButtonToolbar>
                                                <Button variant="info" onClick={() => startJob(job.wasmPath)}>Start</Button>
                                                <Button variant="danger" style={{marginLeft: '10px'}} onClick={() => stopJob(job.wasmPath)}>Stop</Button>
                                                <Button variant="outline-dark" style={{marginLeft: '30px'}} onClick={() => resetJob(job.wasmPath)}>Reset</Button>
                                            </ButtonToolbar>
                                        </div>
                                        <div style={{marginTop: '15px'}}>
                                            <ProgressBar>
                                                <ProgressBar label={job.done} striped variant="success" min={0} max={job.total} now={job.done} key={1} />
                                                <ProgressBar animated label={job.running} variant="info" min={0} max={job.total} now={job.running} key={2} />
                                            </ProgressBar>
                                        </div>
                                    </ListGroup.Item>)
                            })}
                        </ListGroup>
                    </Card.Body>
                    <Card.Title>
                        Clients
                    </Card.Title>
                    <Card.Body>
                        Client Info here
                    </Card.Body>
                </Card.Body>
            </Card>
            <Link to="/">Home</Link>
        </div>
    );
};

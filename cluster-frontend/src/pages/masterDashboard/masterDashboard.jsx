import React, { useEffect, useState } from 'react';
import axios from "axios";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import {Badge, ButtonToolbar, ProgressBar, Toast, ToastContainer} from "react-bootstrap";
import {Link} from "react-router-dom";
import {io} from "socket.io-client";
import { on } from 'events';

export const MasterDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [clients, setClients] = useState([]);
    const [runningJob, setRunningJob] = useState(undefined)
    const [tostTextSuccess, setToastTextSuccess] = useState('')
    const [showToastSuccess, setShowToastSuccess] = useState(false)
    const [tostTextErrror, setToastTextError] = useState('')
    const [showToastError, setShowToastError] = useState(false)
    let socket = null;

    async function onJobInfo(message) {
        console.log(message)
        setJobs(message)
    }

    async function onClientInfo(message) {
        console.log(message)
        setClients(message)
    }

    const openWebSocket = () => {
        // open Websocket
        const sock = io(window.location.origin, {path: '/api/ws'});
        sock.on('jobInfo', onJobInfo)
        sock.on('clientInfo', onClientInfo)
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
            setToastTextError(`Can not start ${job}!\n Currently running ${runningJob}`)
            setShowToastError(true)
        } else {
            console.log(`starting job ${job}...`)
            const result = await axios.post(window.location.origin + '/api/jobs', {'job': job});
            if (result.status === 201) {
                console.log('successfully started job')
                setRunningJob(job)
                setToastTextSuccess(`Successfully started job ${job}`)
                setShowToastSuccess(true)
            } else {
                console.log(`Server returned ${result.status}`)
                setToastTextError(`Could not START job ${job}! Server returned status ${result.status}`)
                setShowToastError(true)
            }
        }
    }

    const stopJob = async (job) => {
        if (runningJob) {
            if (job === runningJob) {
                console.log(`stopping job ${job}...`)
                const result = await axios.delete(window.location.origin + `/api/jobs/${job}`);
                if (result.status === 200) {
                    console.log('successfully stopped job')
                    setRunningJob(undefined)
                    setToastTextSuccess(`Successfully stopped job ${job}`)
                    setShowToastSuccess(true)
                } else {
                    console.log(`Server returned ${result.status}`)
                    setToastTextError(`Could not STOP job ${job}! Server returned status ${result.status}`)
                    setShowToastError(true)
                }
            } else {
                console.log(`Cant stop ${job}! Job ${runningJob} is currently running currently`)
                setToastTextError(`Cant stop ${job}! Job ${runningJob} is currently running currently`)
                setShowToastError(true)
            }
        } else {
            console.log('Cant stop job!\n No Jobs are running currently')
            setToastTextError('Cant stop job!\n No Jobs are running currently')
            setShowToastError(true)
        }
        fetchJobs()
    }

    const resetJob = async (job) => {
        if (runningJob !== job) {
            console.log(`reset job ${job}...`)
            const result = await axios.post(window.location.origin + '/api/reset', {'job': job});
            if (result.status === 201) {
                console.log('successfully reset job')
                setToastTextSuccess(`Successfully reset job ${job}`)
                setShowToastSuccess(true)
            } else {
                console.log(`Server returned ${result.status}`)
                setToastTextError(`Cant reset job! Server returned status ${result.status}`)
                setShowToastError(true)
            }
        } else {
            setToastTextError(`Cant reset job ${job}!\n It is currently running.`)
            setShowToastError(true)
        }
        fetchJobs()
    }

    const toggleShowToastSuccess = () => setShowToastSuccess(!showToastSuccess)
    const toggleShowToastError = () => setShowToastError(!showToastError)

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
                        <Card.Title>
                            Currently Running: {runningJob ? <Badge bg="info"> {runningJob} </Badge> : <Badge bg="secondary"> No running Job </Badge>}
                        </Card.Title>
                        <ListGroup style={{ marginTop: '20px' }}>
                            {jobs.map((job) => {
                                return (
                                    <ListGroup.Item>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="fw-bold">{job.wasmPath}</div>
                                            <Badge pill bg={(job.job_status === 'pending') ? 'secondary' : (job.job_status === 'done') ? 'success' : 'primary'}>{job.job_status}</Badge>
                                            <ButtonToolbar>
                                                <Button variant="primary" onClick={() => startJob(job.wasmPath)}>Start</Button>
                                                <Button variant="danger" style={{marginLeft: '10px'}} onClick={() => stopJob(job.wasmPath)}>Stop</Button>
                                                <Button variant="outline-dark" style={{marginLeft: '30px'}} onClick={() => resetJob(job.wasmPath)}>Reset</Button>
                                            </ButtonToolbar>
                                        </div>
                                        <div style={{marginTop: '15px' }}>
                                            <ProgressBar>
                                                <ProgressBar label={job.done} striped variant="success" min={0} max={job.total} now={job.done} key={1} />
                                                <ProgressBar animated label={job.running} variant="info" min={0} max={job.total} now={job.running} key={2} />
                                            </ProgressBar>
                                            <p style={{ marginLeft: '45%' }}>{job.done} / {job.total}</p>
                                        </div>
                                    </ListGroup.Item>)
                            })}
                        </ListGroup>
                    </Card.Body>
                    <Card.Title>
                        Clients
                    </Card.Title>
                    <Card.Body>
                        <Card.Subtitle>
                            Currently Connected: {clients.length}
                        </Card.Subtitle>
                        <ListGroup> 
                        {clients.map((client) => {
                            return (
                                <ListGroup.Item>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="fw-bold">{client}</div>
                                    </div>
                                </ListGroup.Item>)
                        })}
                        </ListGroup>
                        Client Info here
                    </Card.Body>
                </Card.Body>
            </Card>
            <Link to="/">Home</Link>
            <ToastContainer className="position-static">
                <Toast show={showToastSuccess} onClose={toggleShowToastSuccess}>
                    <Toast.Header>
                        <img src="holder.js/20x20?text=%20" className="rounded me-2" alt="" />
                        <strong className="me-auto">Job Information</strong>
                        <Badge bg='success'>Information</Badge>
                    </Toast.Header>
                    <Toast.Body>{tostTextSuccess}</Toast.Body>
                </Toast>
            </ToastContainer>
            <ToastContainer>
                <Toast show={showToastError} onClose={toggleShowToastError}>
                    <Toast.Header>
                        <img src="holder.js/20x20?text=%20" className="rounded me-2" alt="" />
                        <strong className="me-auto">Job Information</strong>
                        <Badge bg='warning'>Error</Badge>
                    </Toast.Header>
                    <Toast.Body>{tostTextErrror}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

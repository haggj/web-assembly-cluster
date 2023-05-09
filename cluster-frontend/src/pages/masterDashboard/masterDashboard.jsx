import React, { useEffect, useState } from 'react';
import axios from "axios";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import {Badge, ButtonToolbar, ListGroupItem, ProgressBar, Toast, ToastContainer, Modal, Form} from "react-bootstrap";
import {Link} from "react-router-dom";
import {io} from "socket.io-client";
import { on } from 'events';
import Table from "react-bootstrap/Table";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';


export const MasterDashboard = () => {
    const emptyInit =     {
        batchSize: '',
        timeout: '',
        hash: '',
        name: '',
    }

    const [jobs, setJobs] = useState([]);
    const [clients, setClients] = useState([]);
    const [runningJob, setRunningJob] = useState(undefined)
    const [tostTextSuccess, setToastTextSuccess] = useState('')
    const [showToastSuccess, setShowToastSuccess] = useState(false)
    const [tostTextErrror, setToastTextError] = useState('')
    const [showToastError, setShowToastError] = useState(false)
    const [activeTab, setActiveTab] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState(emptyInit);
    let socket = null;

    async function onJobInfo(message) {
        console.log(message)

        // Assumption: Only one job can run at the same time
        let runningJob = false;
        message.map(job => {
            if (job.job_status === 'running') {
                runningJob = true;
                setRunningJob(job.name)
            }
        })

        // Set runningJob to undefined if no job is running
        if (!runningJob){
            setRunningJob(undefined)
        }
        setJobs(message)
    }

    async function onClientInfo(message) {
        console.log(message)
        setClients(message)
    }

    const openWebSocket = () => {
        // open Websocket
        console.log("GLOBAL BACKEND: " + global.config.backend )
        const sock = io(global.config.backend, {path: '/api/ws'});
        sock.on('jobInfo', onJobInfo)
        sock.on('clientInfo', onClientInfo)
        socket = sock;
        console.log("WebSocket connection established")
        socket.emit('isMasterSocket', 'I am a Master Socket!');
    };

    const fetchJobs = async () => {
        const result = await axios.get(global.config.backend + '/api/jobs');
        setJobs(result.data);
    }

    const startJob = async (job) => {
        if (runningJob) {
            console.log(`Can not start ${job}!\n Currently running ${runningJob}`)
            setToastTextError(`Can not start ${job}!\n Currently running ${runningJob}`)
            setShowToastError(true)
        } else {
            console.log(`starting job ${job}...`)
            const result = await axios.post(global.config.backend + '/api/jobs', {'job': job});
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
                const result = await axios.delete(global.config.backend + `/api/jobs/${job}`);
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
            const result = await axios.post(global.config.backend + '/api/reset', {'job': job});
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
    const toggleShowModal = () => setShowModal(!showModal)

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    }

    const handleFormSubmit = async (event) => {
        event.preventDefault()
        const result = await axios.post(global.config.backend + '/api/jobs/new', formData);
        if (result.status === 201) {
            console.log('successfully created job')
            setToastTextSuccess(`Successfully created job`)
            setShowToastSuccess(true)
        } else {
            console.log(`Server returned ${result.status}`)
            setToastTextError(`Could not CREATE job! Server returned status ${result.status}`)
            setShowToastError(true)
        }
        toggleShowModal()
        setFormData(emptyInit)
        fetchJobs()
    }

    useEffect(() => {
        fetchJobs();
        if(socket == null){
            openWebSocket();
        }
    }, [])

    const monospace = {
        fontFamily: 'monospace',
        backgroundColor: '#eee',
        borderRadius: '5px',
        display: 'inline-block',
        padding: '8px'

    }

    function jobCanReset(job){
        return job.job_status === "pending" || job.job_status === "done"
    }
    function jobCanStop(job){
        return job.job_status === "running"
    }

    function jobCanStart(job){
        return job.job_status === "pending"
    }

    function JobComponent (props) {
        let job = props.job;
        return (
         <>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    Status: <Badge pill bg={(job.job_status === 'pending') ? 'secondary' : (job.job_status === 'done') ? 'success' : 'primary'}>{job.job_status}</Badge>
                </div>
                {job.result?
                    <p>
                        Result:{" "}
                        <span style={monospace}>
                    {job.result}
                    </span>
                    </p>
                    :
                    null
                }

            </div>

                <div style={{marginTop: '15px' }}>
                        <ProgressBar>
                            <ProgressBar label={job.done} striped variant="success" min={0} max={job.total} now={job.done} key={1} />
                            <ProgressBar animated label={job.running} variant="info" min={0} max={job.total} now={job.running} key={2} />
                        </ProgressBar>
                        <p style={{ marginLeft: '45%' }}>{job.done} / {job.total}</p>

                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <ButtonToolbar>
                        <Button disabled={!jobCanStart(job)} variant="primary" onClick={() => startJob(job.name)}>Start</Button>
                        <Button disabled={!jobCanStop(job)} variant="danger" style={{marginLeft: '10px'}} onClick={() => stopJob(job.name)}>Stop</Button>
                        <Button disabled={!jobCanReset(job)} variant="outline-dark" style={{marginLeft: '10px'}} onClick={() => resetJob(job.name)}>Reset</Button>
                    </ButtonToolbar>
                </div>
                <Card.Subtitle style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h5>
                        Job Parameters
                    </h5>
                </Card.Subtitle>

                <Table bordered hover>
                    <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Batch Size:</td>
                        <td>{job.batchSize}</td>
                    </tr>
                    <tr>
                        <td>Timeout:</td>
                        <td>{parseFloat(job.timeout).toFixed(2)} ms</td>
                    </tr>
                    <tr>
                        <td>WASM Path:</td>
                        <td>{job.wasmPath}</td>
                    </tr>
                    <tr>
                        <td>Hash:</td>
                        <td>{job.hash}</td>
                    </tr>
                    </tbody>

                </Table>


                {job.statistics.job_avg_duration ?
                    <>

                    <Card.Subtitle style={{ marginTop: '20px', marginBottom: '20px' }}>
                        <h5>
                            Statistics
                        </h5>
                    </Card.Subtitle>
                    <Table bordered hover>
                        <thead>
                        <tr>
                            <th>Statistic</th>
                            <th>Value</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Average Duration of each Job:</td>
                            <td>{parseFloat(job.statistics.job_avg_duration).toFixed(2)} ms</td>
                        </tr>
                        <tr>
                            <td>Minimum Time: </td>
                            <td>{parseFloat(job.statistics.job_min_duration).toFixed(2)} ms</td>
                        </tr>
                        <tr>
                            <td>Maximum Time:</td>
                            <td>{parseFloat(job.statistics.job_max_duration).toFixed(2)} ms</td>
                        </tr>
                        <tr>
                            <td>Average computation time per password:</td>
                            <td>{parseFloat(job.statistics.pwd_avg_duration).toFixed(2)} ms</td>
                        </tr>
                        <tr>
                            <td>Average latency:</td>
                            <td>{parseFloat(job.statistics.job_avg_latency).toFixed(2)} ms</td>
                        </tr>
                        <tr>
                            <td>Average latency per password:</td>
                            <td>{parseFloat(job.statistics.pwd_avg_latency).toFixed(2)} ms</td>
                        </tr>
                        </tbody>
                    </Table>
                    </>
                    :
                    null
                }
                </>
        )
    }

    const AllJobsCard = () => {
        return (
            <Card className={"shadow"}>
            <Card.Body>

                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <h3>
                        Available Jobs
                    </h3>
                    <Button variant="outline-success" onClick={toggleShowModal}>Add Job</Button>
                </div>

                <div style={{ marginTop: '30px', marginBottom: '30px'}}>
                    Currently Running: {runningJob ? <Badge bg="primary"> {runningJob} </Badge> : <Badge bg="secondary"> No running Job </Badge>}
                </div>


                <Tabs
                    id="uncontrolled-tab-example"
                    activeKey={activeTab}
                    onSelect={(key) => {setActiveTab(key);}}
                    justify
                >
                    {jobs.map((job, index) => {
                        return (
                                <Tab eventKey={index} title={job.name} style={{margin: "30px"}}>
                                        <JobComponent  job={job} />
                                </Tab>
                            )
                    })}
                </Tabs>
            </Card.Body>
            </Card>
        )
    }

    function ClientCard () {
        return (
            <Card className={"shadow"}>
                <Card.Body>
                    <Card.Title>
                        <h3>
                            Connected Clients
                        </h3>
                    </Card.Title>
                    <div style={{marginTop: '20px', marginBottom: '20px'}}>
                        Currently Connected: {clients.length}
                    </div>
                    <Table bordered hover>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>ID</th>
                            <th>Info</th>
                        </tr>
                        </thead>
                        <tbody>
                        {clients.map((client, idx) => (
                            <tr>
                                <td>{idx + 1}</td>
                                <td ><span style={monospace}>{client.id}</span></td>
                                <td>{client.details}</td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

        )
    }



    return (
        <div style={{margin: '30px'}}>
            <h1>Master Dashboard</h1>
            <div className="row">
                <div className="col-sm-6"><AllJobsCard /></div>
                <div className="col-sm-6"><ClientCard /></div>
            </div>

            <Link to="/">Home</Link>
            <ToastContainer className="p-5" position={"bottom-end"}>
                <Toast autohide delay={3000}  show={showToastSuccess} onClose={toggleShowToastSuccess}>
                    <Toast.Header>
                        <strong className="me-auto">Job Information</strong>
                        <Badge bg='success'>Information</Badge>
                    </Toast.Header>
                    <Toast.Body>{tostTextSuccess}</Toast.Body>
                </Toast>
            </ToastContainer>
            <ToastContainer className="p-5" position={"bottom-end"}>
                <Toast autohide delay={3000} show={showToastError} onClose={toggleShowToastError}>
                    <Toast.Header>
                        <strong className="me-auto">Job Information</strong>
                        <Badge bg='warning'>Error</Badge>
                    </Toast.Header>
                    <Toast.Body>{tostTextErrror}</Toast.Body>
                </Toast>
            </ToastContainer>
            <Modal show={showModal} onHide={toggleShowModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Create new Job</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        <Form.Group controlId="formName">
                            <Form.Label>Job name</Form.Label>
                            <Form.Control
                                placeholder="Job name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group controlId="formHash">
                            <Form.Label>Hash</Form.Label>
                            <Form.Control
                                placeholder="Hash value"
                                name="hash"
                                value={formData.hash}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group controlId="formBashSize">
                            <Form.Label>Bash size</Form.Label>
                            <Form.Control
                                placeholder="Batch size"
                                name="batchSize"
                                value={formData.batchSize}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group controlId="formTimeout">
                            <Form.Label>Timeout</Form.Label>
                            <Form.Control
                                placeholder="Timeout"
                                name="timeout"
                                value={formData.timeout}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Button style={{ marginTop: '20px' }} variant="primary" type="submit">
                            Create new Job
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

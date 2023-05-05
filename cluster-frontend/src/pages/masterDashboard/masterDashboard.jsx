import React, { useEffect, useState } from 'react';
import axios from "axios";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import {ButtonToolbar} from "react-bootstrap";

export const MasterDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [runningJob, setRunningJob] = useState(undefined)

    const fetchJobs = async () => {
        const result = await axios.get('http://localhost:3001/jobs');
        setJobs(result.data);
    }

    const startJob = async (job) => {
        if (runningJob) {
            console.log(`Can not start ${job}!\n Currently running ${runningJob}`)
        } else {
            console.log(`starting job ${job}...`)
            const result = await axios.post('http://localhost:3001/jobs', {'job': job});
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
                const result = await axios.delete('http://localhost:3001/jobs', {'job': job});
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

    useEffect(() => {
        fetchJobs();
    }, [])

    return (
        <Card>
            <Card.Title>
                Master Dashboard
            </Card.Title>
            <Card.Subtitle>
                Currently Running: {runningJob}
            </Card.Subtitle>
            <Card.Body>
                <Card.Subtitle>
                    Available Jobs:
                </Card.Subtitle>
                <ListGroup>
                    {jobs.map((job) => {
                        return (
                            <ListGroup.Item>
                                <div className="fw-bold">{job}</div>
                                <ButtonToolbar>
                                    <Button variant="info" onClick={() => startJob(job)}>Start</Button>
                                    <Button variant="danger" onClick={() => stopJob(job)}>Stop</Button>
                                </ButtonToolbar>
                            </ListGroup.Item>)
                    })}
                </ListGroup>
            </Card.Body>
        </Card>
    );
};

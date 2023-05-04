import React, { useEffect, useState } from 'react';
import axios from "axios";

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
        <>
            <h1>Master Dashboard</h1>
            <div>
                <h2>Currently Running: {runningJob}</h2>
                <h2>Available Jobs:</h2>
                <ol>
                    {jobs.map((job) => {
                        return (
                            <li>
                                <h3>{job}</h3>
                                <button onClick={() => startJob(job)}>Start</button>
                                <button onClick={() => stopJob(job)}>Stop</button>
                            </li>)
                    })}
                </ol>
            </div>
        </>

    );
};

const Job = require('./job');
const crypto = require('crypto');
const fs = require('fs');

class PasswordCracker extends Job {
    constructor(initParams) {
        super(initParams);
        this.batchSize = initParams.batchSize;
        this.lines = [];
        this.currentLineIndex = 0;
        this.wasmPath = "hashcrack.wasm";
        this.timeout = initParams.timeout;
        this.hash = initParams.hash;
        this.name = initParams.name;
        this.createJobs();
    }

    readRockYouFile() {
        try {
            const data = fs.readFileSync('rockyou_small.txt', 'utf8');
            this.lines = data.split('\n');
        } catch (err) {
            console.error(err);
        }
    }

    getNextBatch() {
        const startIndex = this.currentLineIndex;
        const endIndex = this.currentLineIndex + this.batchSize - 1;
        const batch = [];

        for (let i = startIndex; i <= endIndex && i < this.lines.length; i++) {
            const line = this.lines[i].trim();
            if (line) {
                const [password] = line.split(':');
                batch.push(password);
            }
        }

        this.currentLineIndex = endIndex + 1;

        return batch;
    }

    check_term(result) {
        console.log("RESULT IS: " + JSON.stringify(result));
        if (result.result.length > 0) {
            this.status = 'done';
            return true;
        }
    }

    createJobs() {
        this.readRockYouFile();
        this.jobs = [];
        let batch = this.getNextBatch();
        while (batch.length > 0) {
            this.jobs.push({id: crypto.randomBytes(20).toString('hex'),
                            hash: Buffer.from(this.hash).toString('base64'),
                            data: batch, 
                            status: 'pending' });
            batch = this.getNextBatch();
        }
    }

    get_statistics() {
        let jobs_done = this.jobs.filter(job => job.status === 'done');
        let durations = [];
        let durations_latency = [];
        for (let i = 0; i < jobs_done.length; i++) {
            const job = jobs_done[i];
            durations.push(job.end - job.start);
            durations_latency.push(job.end - job.start - job.result.duration);
            console.log(job.result.duration);
        }
        console.log(durations_latency);
        let job_avg_duration = durations.reduce((a, b) => a + b, 0) / durations.length;
        let job_avg_latency = durations_latency.reduce((a, b) => a + b, 0) / durations_latency.length;
        this.statistics = {
            job_avg_duration: job_avg_duration,
            job_min_duration: Math.min(...durations),
            job_max_duration: Math.max(...durations),
            job_durations: durations,
            job_avg_latency: job_avg_latency,
            pwd_avg_duration: job_avg_duration / this.batchSize,
            pwd_avg_latency: job_avg_latency / this.batchSize,
        };
        return this.statistics;
    }

}

module.exports = PasswordCracker;

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


}

module.exports = PasswordCracker;

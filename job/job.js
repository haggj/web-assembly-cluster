class Job {
    constructor(initParams) {      
        this.wasmPath = NaN;
        this.timeout = initParams.timeout;
        this.createJobs();
    }
  
    createJobs() {
        this.jobs = [];
    }

    getWasmPath() {
      return this.wasmPath;
    }
  
    getJob() {
        const now = Date.now();
      
        for (let i = 0; i < this.jobs.length; i++) {
          const job = this.jobs[i];
      
          if (job.status !== 'running' && job.status !== 'done') {
            job.status = 'running';
            job.start = now;
            return job;
          }
      
          if (job.status === 'running' && now - job.start > this.timeout) {
            job.start = now;
            return job;
          }
        }

        return null;
    }
  
    receiveResult(result) {
        var job_idx = this.jobs.findIndex(obj => {
            return obj.id === result.id
          })
        this.jobs[job_idx].status = 'done';
        this.jobs[job_idx].result = result.result;
    }
  
    info() {
      return {
        ids: this.jobs.map(job => job.id),
        status: this.jobs.map(job => job.status),
        done: this.jobs.filter(job => job.status === 'done').length,
        running: this.jobs.filter(job => job.status === 'running').length,
        pending: this.jobs.filter(job => job.status === 'pending').length,
        total: this.jobs.length,
      };
    }
  }
  

module.exports = Job;
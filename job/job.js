class Job {
    constructor(initParams) {      
        this.wasmPath = NaN;
        this.timeout = initParams.timeout;
        this.batchSize = initParams.batchSize;
        this.createJobs();
        this.status = 'pending';
        this.statistics = NaN;
        this.name = initParams.name;
        this.result = NaN;
    }
  
    createJobs() {
        this.jobs = [];
    }

    getWasmPath() {
      return this.wasmPath;
    }
  
    getJob() {
        const now = Date.now();
        if (this.status !== 'done') {
          this.status = 'running';

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

          this.status = 'done';
        }

        return null;
    }
  
    receiveResult(result) {
        const now = Date.now();
        var job_idx = this.jobs.findIndex(obj => {
            return obj.id === result.id
          })
        this.jobs[job_idx].status = 'done';
        this.jobs[job_idx].result = result;
        this.check_term(result);
        this.jobs[job_idx].end = now;
    }

    check_term(result) {
      this.status = 'running';
      return false;
    }
  
    info() {
      this.get_statistics();
      return {
        name: this.name,
        wasmPath: this.wasmPath,
        ids: this.jobs.map(job => job.id),
        status: this.jobs.map(job => job.status),
        done: this.jobs.filter(job => job.status === 'done').length,
        running: this.jobs.filter(job => job.status === 'running').length,
        pending: this.jobs.filter(job => job.status === 'pending').length,
        total: this.jobs.length,
        job_status: this.status,
        statistics: this.statistics
      };
    }

    get_statistics() {
      return this.statistics;
    }

  }
  
module.exports = Job;

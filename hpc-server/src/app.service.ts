import { Injectable } from '@nestjs/common';
const PasswordCracker = require('../../job/passwordcracker');

@Injectable()
export class AppService {
  allJobDefinitions: any[] = []
  runningJob = undefined
  jobInitParams = [
    {
      batchSize: 10,
      timeout: 5000,
      hash: 'GRSMbCz1UH+XCNV5Fdt4PCCv0u3By9weAO6vfEZPhPc=',
      name: 'passwordcracker_10',
    },
    {
      batchSize: 20,
      timeout: 5000,
      hash: 'GRSMbCz1UH+XCNV5Fdt4PCCv0u3By9weAO6vfEZPhPc=',
      name: 'passwordcracker_20',
    }
  ]

  constructor() {
    // Adding PasswordCracker Job
    this.jobInitParams.map(init => this.allJobDefinitions.push(new PasswordCracker(init)))
  }

  getHello(): string {
    return 'Hello World!';
  }

  // returns all available JobDefinitions
  getJobs(): string[] {
    if (this.allJobDefinitions.length > 0) {
      const output: string[] = []
      for (let job of this.allJobDefinitions) {
        output.push(job.wasmPath)
      }
      return output
    }
    else {
      return ['No Job Found']
    }
  }

  // Starts a JobDefinition
  runJob(jobInput: string): string {
    // find and set job object
    for (let job of this.allJobDefinitions) {
      if (job.wasmPath === jobInput) {
        console.log(`Start Job ${jobInput}...`)
        // update job status if found
        this.runningJob = job
        return job.wasmPath
      }
    }
    return null
  }

  // stop Job, if its running
  stopJob(job: string): string {
    if (this.runningJob && this.runningJob.wasmPath === job) {
      this.runningJob.status = 'pending'
      this.runningJob = undefined
      console.log(`Stop Job ${job}...`)
      return `Stopped Job ${job}`
    } else {
      return `ERROR: Can not stop Job ${job}, since it is not currently running`
    }
  }

  resetJob(jobInput: string): boolean {
    for (let i = 0; i < this.allJobDefinitions.length; i++) {
      if (this.allJobDefinitions[i].wasmPath === jobInput) {
        console.log(`Reset Job ${jobInput}...`)
        this.allJobDefinitions[i] = new PasswordCracker(this.jobInitParams)

        // reset running job if needed
        if (this.runningJob && this.runningJob.wasmPath === this.allJobDefinitions[i].wasmPath) {
          this.runningJob = this.allJobDefinitions[i]
        }
        return true
      }
    }
    return false
  }

  // handle job result
  handleResult(payload: any) {
    if (this.runningJob) {
      this.runningJob.receiveResult(payload)
    }
  }

  // get next job of running JobDefinition
  getNextJob(): any {
    if (this.runningJob) {
      return this.runningJob.getJob()
    } else {
      return null
    }
  }

  // return wasm path of running job
  getWasmPath(): any {
    if (this.runningJob) {
      return this.runningJob.wasmPath
    } else {
      return null
    }
  }

  // return Infos about all Jobs
  getJobsInfo() {
    const allInfos = []
    for (let job of this.allJobDefinitions) {
      allInfos.push(job.info())
    }
    return allInfos
  }
}

import { Injectable } from '@nestjs/common';
const PasswordCracker = require('../../job/passwordcracker');
const fs = require('fs');

@Injectable()
export class AppService {
  allJobDefinitions: any[] = []
  runningJob = undefined
  jobInitParams = [
    {
      batchSize: 10,
      timeout: 5000,
      hash: 'GRSMbCz1UH+XCNV5Fdt4PCCv0u3By9weAO6vfEZPhPc=',
      name: 'passwordcracker_10_100',
      filePath: 'rockyou_100.txt'
    },
    {
      batchSize: 20,
      timeout: 5000,
      hash: 'GRSMbCz1UH+XCNV5Fdt4PCCv0u3By9weAO6vfEZPhPc=',
      name: 'passwordcracker_20_100',
      filePath: 'rockyou_100.txt'
    },
    {
      batchSize: 20,
      timeout: 5000,
      hash: 'GRSMbCz1UH+XCNV5Fdt4PCCv0u3By9weAO6vfEZPhPc=',
      name: 'passwordcracker_20_1000',
      filePath: 'rockyou_1000.txt'
    },
    {
      batchSize: 20,
      timeout: 15000,
      hash: 'GRSMbCz1UH+XCNV5Fdt4PCCv0u3By9weAO6vfEZPhPc=',
      name: 'Demo Small',
      filePath: 'rockyou_1000.txt'
    },
    {
      batchSize: 20,
      timeout: 15000,
      hash: 'GRSMbCz1UH+XCNV5Fdt4PCCv0u3By9weAO6vfEZPhPc=',
      name: 'Demo Large',
      filePath: 'rockyou_10000.txt'
    }
  ]

  constructor() {
    // Adding PasswordCracker Job
    this.jobInitParams.map(init => this.allJobDefinitions.push(new PasswordCracker(init)))
    this.allJobDefinitions.map(job => console.log(job.info()))
  }

  getHello(): string {
    return 'Hello World!';
  }

  // returns all available JobDefinitions
  getJobs(): string[] {
    if (this.allJobDefinitions.length > 0) {
      const output: string[] = []
      for (let job of this.allJobDefinitions) {
        output.push(job.name)
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
      if (job.name === jobInput) {
        console.log(`Start Job ${jobInput}...`)
        // update job status if found
        this.runningJob = job
        this.runningJob.stopped = false
        this.runningJob.setStartTime()
        return job.wasmPath
      }
    }
    return null
  }

  // stop Job, if its running
  stopJob(job: string): string {
    if (this.runningJob && this.runningJob.name === job) {
      this.runningJob.status = 'pending'
      //this.runningJob = undefined
      this.runningJob.stopped = true
      console.log(`Stop Job ${job}...`)
      return `Stopped Job ${job}`
    } else {
      return `ERROR: Can not stop Job ${job}, since it is not currently running`
    }
  }

  resetJob(jobInput: string): boolean {
    for (let i = 0; i < this.allJobDefinitions.length; i++) {
      if (this.allJobDefinitions[i].name === jobInput) {
        console.log(`Reset Job ${jobInput}...`)
        this.allJobDefinitions[i] = new PasswordCracker(this.jobInitParams.filter(init => init.name === jobInput)[0])

        // reset running job if needed
        if (this.runningJob && this.runningJob.name === this.allJobDefinitions[i].name) {
          this.runningJob = this.allJobDefinitions[i]
        }
        return true
      }
    }
    return false
  }

  // delete a job
  deleteJob(jobName: string): boolean {
    if (this.runningJob && this.runningJob.name === jobName) {
      this.runningJob = undefined;
    }
    this.allJobDefinitions = this.allJobDefinitions.filter(job => job.name !== jobName)
    this.jobInitParams = this.jobInitParams.filter(init => init.name !== jobName)
    return true
  }

  // handle job result
  handleResult(payload: any) {
    if (this.runningJob) {
      this.runningJob.receiveResult(payload)
    }
  }

  // get next job of running JobDefinition
  getNextJob(): any {
    if (this.runningJob.stopped === false) {
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

  // create a new job with incoming InitParams
  createNewJob(initParam: any) {
    console.log(initParam)
    const { batchSize, timeout, hash, name, filePath } = initParam
    if (batchSize && typeof Number(batchSize) === 'number'
        && timeout && typeof Number(timeout) === 'number'
        && hash && typeof hash === 'string'
        && name && typeof name === 'string'
        && filePath && typeof filePath === 'string'
    ){
      if (fs.existsSync(filePath)) {
        const newInitParam = {
          batchSize: Number(batchSize),
          timeout: Number(timeout),
          name: name,
          hash: hash,
          filePath: filePath
        }
        this.jobInitParams.push(newInitParam)
        this.allJobDefinitions.push(new PasswordCracker(newInitParam))
        console.log('success')
      }
    }
  }
}

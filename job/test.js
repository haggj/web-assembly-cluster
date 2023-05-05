const pwdc = require('./passwordcracker');

const initParams = {
  batchSize: 10,
  timeout: 1000,
  hash: '5f4dcc3b5aa765d61d8327deb882cf99'
};

console.log("\n\n\nCreating job...");
const job = new pwdc(initParams);

console.log("Job info:");
console.log(job.info());

console.log("Getting jobs...");
var jobs = [];
for (let i = 0; i < 10; i++) {
  jobs.push(job.getJob());
  if (i == 0) {
    console.log("Job 1: ");
    console.log(jobs[i]);
  }
}

console.log("Job info:");
console.log(job.info());

console.log("Writing dummy results for jobs 2 to 10...");
for (let i = 1; i < 10; i++) {
  const res = {
    id: jobs[i].id,
    result: ''
  }
  job.receiveResult(res);
}

console.log("Job info:");
console.log(job.info());

console.log("Waiting 2 seconds to test timeout...");
wait(2000);

console.log("Getting jobs...");
console.log(job.getJob());
console.log(job.getJob());

console.log("Writing dummy result for job 1...")
const res = {
  id: jobs[0].id,
  result: ''
}
job.receiveResult(res);

console.log("Job info:");
console.log(job.info());

function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
 }
}
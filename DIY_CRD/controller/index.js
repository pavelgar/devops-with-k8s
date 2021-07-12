const k8s = require("@kubernetes/client-node")
const mustache = require("mustache")
const request = require("request")
const JSONStream = require("json-stream")
const fs = require("fs").promises

// Use Kubernetes client to interact with Kubernetes

const timeouts = {}

const kc = new k8s.KubeConfig()

process.env.NODE_ENV === "development"
  ? kc.loadFromDefault()
  : kc.loadFromCluster()

const opts = {}
kc.applyToRequest(opts)

const client = kc.makeApiClient(k8s.CoreV1Api)

const sendRequestToApi = async (api, method = "get", options = {}) =>
  new Promise((resolve, reject) =>
    request[method](
      `${kc.getCurrentCluster().server}${api}`,
      { ...opts, ...options, headers: { ...options.headers, ...opts.headers } },
      (err, res) => (err ? reject(err) : resolve(JSON.parse(res.body)))
    )
  )

const fieldsFromDummySite = (object) => ({
  dummysite_name: object.metadata.name,
  container_name: object.metadata.name,
  job_name: `${object.metadata.name}-job-${object.spec.websiteurl}`,
  namespace: object.metadata.namespace,
  websiteurl: object.spec.websiteurl,
  image: object.spec.image,
})

const fieldsFromJob = (object) => ({
  dummysite_name: object.metadata.labels.dummysite,
  container_name: object.metadata.labels.dummysite,
  job_name: `${object.metadata.labels.dummysite}-job-${object.metadata.labels.websiteurl}`,
  namespace: object.metadata.namespace,
  websiteurl: object.metadata.labels.websiteurl,
  image: object.spec.template.spec.containers[0].image,
})

const getJobYAML = async (fields) => {
  const deploymentTemplate = await fs.readFile("job.mustache", "utf-8")
  return mustache.render(deploymentTemplate, fields)
}

const jobForDummySiteAlreadyExists = async (fields) => {
  const { dummysite_name, namespace } = fields
  const { items } = await sendRequestToApi(
    `/apis/batch/v1/namespaces/${namespace}/jobs`
  )

  return items.find((item) => item.metadata.labels.dummysite === dummysite_name)
}

const createJob = async (fields) => {
  console.log(
    "Scheduling new job for dummysite",
    fields.dummysite_name,
    "to namespace",
    fields.namespace
  )

  const yaml = await getJobYAML(fields)

  return sendRequestToApi(
    `/apis/batch/v1/namespaces/${fields.namespace}/jobs`,
    "post",
    {
      headers: {
        "Content-Type": "application/yaml",
      },
      body: yaml,
    }
  )
}

const removeJob = async ({ namespace, job_name }) => {
  const pods = await sendRequestToApi(`/api/v1/namespaces/${namespace}/pods/`)
  pods.items
    .filter((pod) => pod.metadata.labels["job-name"] === job_name)
    .forEach((pod) => removePod({ namespace, pod_name: pod.metadata.name }))

  return sendRequestToApi(
    `/apis/batch/v1/namespaces/${namespace}/jobs/${job_name}`,
    "delete"
  )
}

const removeDummySite = ({ namespace, dummysite_name }) =>
  sendRequestToApi(
    `/apis/stable.dwk/v1/namespaces/${namespace}/dummysites/${dummysite_name}`,
    "delete"
  )

const removePod = ({ namespace, pod_name }) =>
  sendRequestToApi(`/api/v1/namespaces/${namespace}/pods/${pod_name}`, "delete")

const cleanupForDummySite = async ({ namespace, dummysite_name }) => {
  console.log("Doing cleanup")
  clearTimeout(timeouts[dummysite_name])

  const jobs = await sendRequestToApi(
    `/apis/batch/v1/namespaces/${namespace}/jobs`
  )
  jobs.items.forEach((job) => {
    if (!job.metadata.labels.dummysite === dummysite_name) return
    removeJob({ namespace, job_name: job.metadata.name })
  })
}

const rescheduleJob = (jobObject) => {
  const fields = fieldsFromJob(jobObject)
  if (Number(fields.length) <= 1) {
    console.log("DummySite stopped. Removing...")
    return removeDummySite(fields)
  }

  // Save timeout so if the dummysite is suddenly removed we can prevent execution (removing dummysite removes job)
  timeouts[fields.dummysite_name] = setTimeout(() => {
    removeJob(fields)
    const newLength = Number(fields.length) - 1
    const newFields = {
      ...fields,
      job_name: `${fields.container_name}-job-${newLength}`,
      length: newLength,
    }
    createJob(newFields)
  }, String(fields.websiteurl))
}

const maintainStatus = async () => {
  ;(await client.listPodForAllNamespaces()).body // A bug in the client(?) was fixed by sending a request and not caring about response

  /**
   * Watch DummySites
   */

  const dummysite_stream = new JSONStream()

  dummysite_stream.on("data", async ({ type, object }) => {
    const fields = fieldsFromDummySite(object)

    if (type === "ADDED") {
      if (await jobForDummySiteAlreadyExists(fields)) return // Restarting application would create new 0th jobs without this check
      createJob(fields)
    }
    if (type === "DELETED") cleanupForDummySite(fields)
  })

  request
    .get(
      `${
        kc.getCurrentCluster().server
      }/apis/stable.dwk/v1/dummysites?watch=true`,
      opts
    )
    .pipe(dummysite_stream)

  // Watch Jobs
  const job_stream = new JSONStream()

  job_stream.on("data", async ({ type, object }) => {
    if (!object.metadata.labels.dummysite) return // If it's not dummysite job, don't handle it
    if (type === "DELETED" || object.metadata.deletionTimestamp) return // Don't handle deleted jobs either
    if (!object?.status?.succeeded) return
    rescheduleJob(object)
  })

  request
    .get(`${kc.getCurrentCluster().server}/apis/batch/v1/jobs?watch=true`, opts)
    .pipe(job_stream)
}

maintainStatus()

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
  new Promise((res, rej) =>
    request[method](
      `${kc.getCurrentCluster().server}${api}`,
      { ...opts, ...options, headers: { ...options.headers, ...opts.headers } },
      (err, res) => (err ? rej(err) : res(JSON.parse(res.body)))
    )
  )

const fieldsFromDummySite = (object) => ({
  dummysite_name: object.metadata.name,
  container_name: object.metadata.name,
  dep_name: `${object.metadata.name}-dep-${object.spec.websiteurl}`,
  namespace: object.metadata.namespace,
  websiteurl: object.spec.websiteurl,
  image: object.spec.image,
})

const deploymentFields = (object) => ({
  dummysite_name: object.metadata.labels.dummysite,
  container_name: object.metadata.labels.dummysite,
  dep_name: `${object.metadata.labels.dummysite}-dep-${object.metadata.labels.websiteurl}`,
  namespace: object.metadata.namespace,
  websiteurl: object.metadata.labels.websiteurl,
  image: object.spec.template.spec.containers[0].image,
})

const getDeploymentYAML = async (fields) => {
  const deploymentTemplate = await fs.readFile("deployment.mustache", "utf-8")
  return mustache.render(deploymentTemplate, fields)
}

const deploymentForDummySiteExists = async (fields) => {
  const { dummysite_name, namespace } = fields
  const { items } = await sendRequestToApi(
    `/apis/apps/v1/namespaces/${namespace}/deployments`
  )

  return items.find((item) => item.metadata.labels.dummysite === dummysite_name)
}

const createDeployment = async (fields) => {
  console.log(
    "Scheduling new deployment for dummysite",
    fields.dummysite_name,
    "to namespace",
    fields.namespace
  )

  const yaml = await getDeploymentYAML(fields)

  return sendRequestToApi(
    `/apis/apps/v1/namespaces/${fields.namespace}/deployments`,
    "post",
    {
      headers: {
        "Content-Type": "application/yaml",
      },
      body: yaml,
    }
  )
}

const removeDeployment = async ({ namespace, dep_name }) => {
  const pods = await sendRequestToApi(`/api/v1/namespaces/${namespace}/pods/`)
  pods.items
    .filter((pod) => pod.metadata.labels["deployment-name"] === dep_name)
    .forEach((pod) => removePod({ namespace, pod_name: pod.metadata.name }))

  return sendRequestToApi(
    `/apis/apps/v1/namespaces/${namespace}/deployments/${dep_name}`,
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

  const deployments = await sendRequestToApi(
    `/apis/apps/v1/namespaces/${namespace}/deployments`
  )
  deployments.items.forEach((dep) => {
    if (!dep.metadata.labels.dummysite === dummysite_name) return
    removeDeployment({ namespace, dep_name: dep.metadata.name })
  })
}

const rescheduleDeployment = (deploymentObj) => {
  const fields = deploymentFields(deploymentObj)
  if (Number(fields.length) <= 1) {
    console.log("DummySite stopped. Removing...")
    return removeDummySite(fields)
  }

  // Save timeout so if the dummysite is suddenly removed we can prevent execution
  // (removing a dummysite removes the deployment)
  timeouts[fields.dummysite_name] = setTimeout(() => {
    removeDeployment(fields)
    const newLength = Number(fields.length) - 1
    const newFields = {
      ...fields,
      dep_name: `${fields.container_name}-dep-${newLength}`,
      length: newLength,
    }
    createDeployment(newFields)
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
      if (await deploymentForDummySiteExists(fields)) return
      createDeployment(fields)
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

  const deployment_stream = new JSONStream()

  deployment_stream.on("data", async ({ type, object }) => {
    // If it's not dummysite deployment, don't handle it
    if (!object.metadata.labels.dummysite) return
    // Don't handle deleted deployments either
    if (type === "DELETED" || object.metadata.deletionTimestamp) return
    if (!object?.status?.succeeded) return
    rescheduleDeployment(object)
  })

  request
    .get(
      `${kc.getCurrentCluster().server}/apis/apps/v1/deployments?watch=true`,
      opts
    )
    .pipe(deployment_stream)
}

maintainStatus()

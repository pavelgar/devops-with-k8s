# DevOps with Kubernetes course

## Writing tasks

### Exercise 3.06

Comparison between DBaaS vs DIY

#### DBaaS

**pros**

- Required work to setup is significantly less compared to DIY method
- Easy setup (& use) means less work hours wasted on setting up
- Little work is needed to also maintain the database (again, less wasted work-hours)
- Usually much more resource-efficient setup (as it's in the interest of the cloud provider)
- Usually much more available
- Ready-made addons easily installable
- Cloud provider likely offers a backup solution

**cons**

- Usually higher cost due to the setup and maintenance workload shifting to the cloud provider
- Increases provider lock-in (harder to migrate to different cloud provider)
- Might not cover the desired use-case
- Might lack some new features (older DB version)

#### DIY method

**pros**

- Much more flexible and cofigurable due to having full control over the DB deployment
- Type of database (and its configuration) can be freely decided
- Easier migration from a preexisting DIY setup
- No provider lock-in

**cons**

- DIY setup can introduce hard-to-solve errors
- Often less resource-efficient
- Needs to be maintained
- Extra features need to be added and maintained manually too

### Exercise 3.07

I chose to stick with the DIY method of running Postgres deployment with PersistentVolumeClaim
as that's the first thing I learned how to do during this course and I like doing things
myself as much as reasonably possible.

### Exercise 3.10

![GKE_logs](./docs/GKE_logs.png)

### Exercise 4.03

To count number of pods created by StatefulSets in the "prometheus" namespace:

```
scalar(count(kube_pod_info{created_by_kind="StatefulSet", namespace="prometheus"}))
```

### Exercise 5.03

Terminal output:

```
❯ kubectl get -n todo-application deploy -o yaml | linkerd inject - | kubectl apply -f -

deployment "todo-frontend-dep" injected
deployment "todo-backend-dep" injected
deployment "todo-broadcaster-dep" injected

deployment.apps/todo-frontend-dep configured
deployment.apps/todo-backend-dep configured
deployment.apps/todo-broadcaster-dep configured

~
❯ kubectl apply -k github.com/fluxcd/flagger/kustomize/linkerd
customresourcedefinition.apiextensions.k8s.io/alertproviders.flagger.app created
customresourcedefinition.apiextensions.k8s.io/canaries.flagger.app created
customresourcedefinition.apiextensions.k8s.io/metrictemplates.flagger.app created
serviceaccount/flagger created
clusterrole.rbac.authorization.k8s.io/flagger created
clusterrolebinding.rbac.authorization.k8s.io/flagger created
deployment.apps/flagger created

~ took 2s
❯ kubectl -n linkerd rollout status deploy/flagger
Waiting for deployment "flagger" rollout to finish: 0 of 1 updated replicas are available...
deployment "flagger" successfully rolled out

~
❯ kubectl create ns test && kubectl apply -f https://run.linkerd.io/flagger.yml
namespace/test created
deployment.apps/load created
configmap/frontend created
deployment.apps/frontend created
service/frontend created
deployment.apps/podinfo created
service/podinfo created

~
❯ kubectl -n test rollout status deploy podinfo
Waiting for deployment "podinfo" rollout to finish: 0 of 1 updated replicas are available...
deployment "podinfo" successfully rolled out

~ took 3s
❯ kubectl -n test port-forward svc/frontend 8080
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
^C⏎

~ took 3m
❯ cat <<EOF | kubectl apply -f -
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: podinfo
  namespace: test
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: podinfo
  service:
    port: 9898
  analysis:
    interval: 10s
    threshold: 5
    stepWeight: 10
    maxWeight: 100
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
EOF
canary.flagger.app/podinfo created

~ took 7s
❯ kubectl -n test get ev --watch
LAST SEEN   TYPE      REASON              OBJECT                                  MESSAGE
4m25s       Normal    ScalingReplicaSet   deployment/load                         Scaled up replica set load-7f97579865 to 1
4m25s       Normal    ScalingReplicaSet   deployment/frontend                     Scaled up replica set frontend-6957977dc7 to 1
4m25s       Normal    Injected            deployment/load                         Linkerd sidecar proxy injected
4m25s       Normal    SuccessfulCreate    replicaset/frontend-6957977dc7          Created pod: frontend-6957977dc7-n9llv
4m25s       Normal    Injected            deployment/frontend                     Linkerd sidecar proxy injected
4m25s       Normal    ScalingReplicaSet   deployment/podinfo                      Scaled up replica set podinfo-7bfd46f477 to 1
4m25s       Normal    Injected            deployment/podinfo                      Linkerd sidecar proxy injected
4m24s       Normal    Scheduled           pod/frontend-6957977dc7-n9llv           Successfully assigned test/frontend-6957977dc7-n9llv to k3d-k3s-default-agent-1
4m25s       Normal    SuccessfulCreate    replicaset/load-7f97579865              Created pod: load-7f97579865-6b9ck
4m25s       Normal    SuccessfulCreate    replicaset/podinfo-7bfd46f477           Created pod: podinfo-7bfd46f477-cm6jv
4m24s       Normal    Scheduled           pod/load-7f97579865-6b9ck               Successfully assigned test/load-7f97579865-6b9ck to k3d-k3s-default-agent-0
4m24s       Normal    Scheduled           pod/podinfo-7bfd46f477-cm6jv            Successfully assigned test/podinfo-7bfd46f477-cm6jv to k3d-k3s-default-agent-0
4m25s       Normal    Pulled              pod/frontend-6957977dc7-n9llv           Container image "cr.l5d.io/linkerd/proxy-init:v1.3.11" already present on machine
4m24s       Normal    Created             pod/frontend-6957977dc7-n9llv           Created container linkerd-init
4m24s       Normal    Started             pod/frontend-6957977dc7-n9llv           Started container linkerd-init
4m24s       Normal    Pulled              pod/load-7f97579865-6b9ck               Container image "cr.l5d.io/linkerd/proxy-init:v1.3.11" already present on machine
4m24s       Normal    Pulled              pod/podinfo-7bfd46f477-cm6jv            Container image "cr.l5d.io/linkerd/proxy-init:v1.3.11" already present on machine
4m24s       Normal    Created             pod/podinfo-7bfd46f477-cm6jv            Created container linkerd-init
4m24s       Normal    Created             pod/load-7f97579865-6b9ck               Created container linkerd-init
4m24s       Normal    Started             pod/load-7f97579865-6b9ck               Started container linkerd-init
4m24s       Normal    Started             pod/podinfo-7bfd46f477-cm6jv            Started container linkerd-init
4m24s       Normal    Pulling             pod/frontend-6957977dc7-n9llv           Pulling image "nginx:alpine"
4m23s       Normal    Pulling             pod/podinfo-7bfd46f477-cm6jv            Pulling image "quay.io/stefanprodan/podinfo:1.7.0"
4m23s       Normal    Pulling             pod/load-7f97579865-6b9ck               Pulling image "buoyantio/slow_cooker:1.2.0"
4m16s       Normal    Pulled              pod/load-7f97579865-6b9ck               Successfully pulled image "buoyantio/slow_cooker:1.2.0" in 6.583833689s
4m16s       Normal    Pulled              pod/frontend-6957977dc7-n9llv           Successfully pulled image "nginx:alpine" in 7.413436147s
4m16s       Normal    Created             pod/load-7f97579865-6b9ck               Created container slow-cooker
4m16s       Normal    Created             pod/frontend-6957977dc7-n9llv           Created container nginx
4m16s       Normal    Started             pod/load-7f97579865-6b9ck               Started container slow-cooker
4m16s       Normal    Pulled              pod/load-7f97579865-6b9ck               Container image "cr.l5d.io/linkerd/proxy:stable-2.10.2" already present on machine
4m16s       Normal    Started             pod/frontend-6957977dc7-n9llv           Started container nginx
4m16s       Normal    Pulled              pod/frontend-6957977dc7-n9llv           Container image "cr.l5d.io/linkerd/proxy:stable-2.10.2" already present on machine
4m16s       Normal    Created             pod/frontend-6957977dc7-n9llv           Created container linkerd-proxy
4m16s       Normal    Created             pod/load-7f97579865-6b9ck               Created container linkerd-proxy
4m16s       Normal    Pulled              pod/podinfo-7bfd46f477-cm6jv            Successfully pulled image "quay.io/stefanprodan/podinfo:1.7.0" in 7.196926283s
4m16s       Normal    Started             pod/load-7f97579865-6b9ck               Started container linkerd-proxy
4m16s       Normal    Started             pod/frontend-6957977dc7-n9llv           Started container linkerd-proxy
4m16s       Normal    Created             pod/podinfo-7bfd46f477-cm6jv            Created container podinfod
4m16s       Normal    Started             pod/podinfo-7bfd46f477-cm6jv            Started container podinfod
4m16s       Normal    Pulled              pod/podinfo-7bfd46f477-cm6jv            Container image "cr.l5d.io/linkerd/proxy:stable-2.10.2" already present on machine
4m15s       Normal    Created             pod/podinfo-7bfd46f477-cm6jv            Created container linkerd-proxy
4m15s       Normal    Started             pod/podinfo-7bfd46f477-cm6jv            Started container linkerd-proxy
49s         Warning   Synced              canary/podinfo                          podinfo-primary.test not ready: waiting for rollout to finish: observed deployment generation less then desired generation
49s         Normal    ScalingReplicaSet   deployment/podinfo-primary              Scaled up replica set podinfo-primary-59588c788f to 1
49s         Normal    Injected            deployment/podinfo-primary              Linkerd sidecar proxy injected
49s         Normal    SuccessfulCreate    replicaset/podinfo-primary-59588c788f   Created pod: podinfo-primary-59588c788f-h95dq
49s         Normal    Scheduled           pod/podinfo-primary-59588c788f-h95dq    Successfully assigned test/podinfo-primary-59588c788f-h95dq to k3d-k3s-default-agent-1
49s         Normal    Pulled              pod/podinfo-primary-59588c788f-h95dq    Container image "cr.l5d.io/linkerd/proxy-init:v1.3.11" already present on machine
49s         Normal    Created             pod/podinfo-primary-59588c788f-h95dq    Created container linkerd-init
49s         Normal    Started             pod/podinfo-primary-59588c788f-h95dq    Started container linkerd-init
48s         Normal    Pulling             pod/podinfo-primary-59588c788f-h95dq    Pulling image "quay.io/stefanprodan/podinfo:1.7.0"
43s         Normal    Pulled              pod/podinfo-primary-59588c788f-h95dq    Successfully pulled image "quay.io/stefanprodan/podinfo:1.7.0" in 4.993266467s
43s         Normal    Created             pod/podinfo-primary-59588c788f-h95dq    Created container podinfod
43s         Normal    Started             pod/podinfo-primary-59588c788f-h95dq    Started container podinfod
43s         Normal    Pulled              pod/podinfo-primary-59588c788f-h95dq    Container image "cr.l5d.io/linkerd/proxy:stable-2.10.2" already present on machine
43s         Normal    Created             pod/podinfo-primary-59588c788f-h95dq    Created container linkerd-proxy
43s         Normal    Started             pod/podinfo-primary-59588c788f-h95dq    Started container linkerd-proxy
40s         Normal    Synced              canary/podinfo                          all the metrics providers are available!
40s         Normal    ScalingReplicaSet   deployment/podinfo                      Scaled down replica set podinfo-7bfd46f477 to 0
40s         Normal    SuccessfulDelete    replicaset/podinfo-7bfd46f477           Deleted pod: podinfo-7bfd46f477-cm6jv
40s         Normal    Killing             pod/podinfo-7bfd46f477-cm6jv            Stopping container podinfod
40s         Normal    Killing             pod/podinfo-7bfd46f477-cm6jv            Stopping container linkerd-proxy
39s         Normal    Synced              canary/podinfo                          Initialization done! podinfo.test
^C⏎

~ took 42s
❯ kubectl -n test set image deployment/podinfo podinfod=quay.io/stefanprodan/podinfo:1.7.1
deployment.apps/podinfo image updated

~
❯ kubectl -n test get ev --watch
27s         Normal    ScalingReplicaSet   deployment/podinfo                      Scaled up replica set podinfo-69c49997fd to 1
27s         Normal    Injected            deployment/podinfo                      Linkerd sidecar proxy injected
27s         Normal    SuccessfulCreate    replicaset/podinfo-69c49997fd           Created pod: podinfo-69c49997fd-kxxnz
27s         Normal    Scheduled           pod/podinfo-69c49997fd-kxxnz            Successfully assigned test/podinfo-69c49997fd-kxxnz to k3d-k3s-default-agent-0
26s         Normal    Pulled              pod/podinfo-69c49997fd-kxxnz            Container image "cr.l5d.io/linkerd/proxy-init:v1.3.11" already present on machine
26s         Normal    Created             pod/podinfo-69c49997fd-kxxnz            Created container linkerd-init
26s         Normal    Started             pod/podinfo-69c49997fd-kxxnz            Started container linkerd-init
26s         Normal    Pulling             pod/podinfo-69c49997fd-kxxnz            Pulling image "quay.io/stefanprodan/podinfo:1.7.1"
21s         Normal    Pulled              pod/podinfo-69c49997fd-kxxnz            Successfully pulled image "quay.io/stefanprodan/podinfo:1.7.1" in 4.506448258s
21s         Normal    Created             pod/podinfo-69c49997fd-kxxnz            Created container podinfod
21s         Normal    Started             pod/podinfo-69c49997fd-kxxnz            Started container podinfod
21s         Normal    Pulled              pod/podinfo-69c49997fd-kxxnz            Container image "cr.l5d.io/linkerd/proxy:stable-2.10.2" already present on machine
21s         Normal    Created             pod/podinfo-69c49997fd-kxxnz            Created container linkerd-proxy
21s         Normal    Started             pod/podinfo-69c49997fd-kxxnz            Started container linkerd-proxy
17s         Warning   Synced              canary/podinfo                          canary deployment podinfo.test not ready: waiting for rollout to finish: 0 of 1 updated replicas are available
7s          Normal    Synced              canary/podinfo                          Starting canary analysis for podinfo.test
7s          Normal    Synced              canary/podinfo                          Advance podinfo.test canary weight 10
0s          Normal    Synced              canary/podinfo                          Advance podinfo.test canary weight 20
0s          Normal    Synced              canary/podinfo                          Advance podinfo.test canary weight 30
0s          Normal    Synced              canary/podinfo                          Advance podinfo.test canary weight 40
0s          Normal    Synced              canary/podinfo                          Advance podinfo.test canary weight 50
0s          Normal    Synced              canary/podinfo                          Advance podinfo.test canary weight 60
0s          Normal    Synced              canary/podinfo                          Advance podinfo.test canary weight 70
0s          Normal    Synced              canary/podinfo                          (combined from similar events): Advance podinfo.test canary weight 80
0s          Normal    Synced              canary/podinfo                          (combined from similar events): Advance podinfo.test canary weight 90
0s          Normal    Synced              canary/podinfo                          (combined from similar events): Advance podinfo.test canary weight 100
0s          Normal    Synced              canary/podinfo                          (combined from similar events): Copying podinfo.test template spec to podinfo-primary.test
0s          Normal    ScalingReplicaSet   deployment/podinfo-primary              Scaled up replica set podinfo-primary-7d96d4f85c to 1
0s          Normal    Injected            deployment/podinfo-primary              Linkerd sidecar proxy injected
0s          Normal    SuccessfulCreate    replicaset/podinfo-primary-7d96d4f85c   Created pod: podinfo-primary-7d96d4f85c-b27l4
0s          Normal    Scheduled           pod/podinfo-primary-7d96d4f85c-b27l4    Successfully assigned test/podinfo-primary-7d96d4f85c-b27l4 to k3d-k3s-default-agent-0
0s          Normal    Pulled              pod/podinfo-primary-7d96d4f85c-b27l4    Container image "cr.l5d.io/linkerd/proxy-init:v1.3.11" already present on machine
0s          Normal    Created             pod/podinfo-primary-7d96d4f85c-b27l4    Created container linkerd-init
0s          Normal    Started             pod/podinfo-primary-7d96d4f85c-b27l4    Started container linkerd-init
0s          Normal    Pulled              pod/podinfo-primary-7d96d4f85c-b27l4    Container image "quay.io/stefanprodan/podinfo:1.7.1" already present on machine
0s          Normal    Created             pod/podinfo-primary-7d96d4f85c-b27l4    Created container podinfod
0s          Normal    Started             pod/podinfo-primary-7d96d4f85c-b27l4    Started container podinfod
0s          Normal    Pulled              pod/podinfo-primary-7d96d4f85c-b27l4    Container image "cr.l5d.io/linkerd/proxy:stable-2.10.2" already present on machine
0s          Normal    Created             pod/podinfo-primary-7d96d4f85c-b27l4    Created container linkerd-proxy
0s          Normal    Started             pod/podinfo-primary-7d96d4f85c-b27l4    Started container linkerd-proxy

~ took 1m41s
❯ kubectl -n test get trafficsplit podinfo -o yaml
apiVersion: split.smi-spec.io/v1alpha2
kind: TrafficSplit
metadata:
  creationTimestamp: "2021-07-12T13:51:36Z"
  generation: 12
  name: podinfo
  namespace: test
  ownerReferences:
  - apiVersion: flagger.app/v1beta1
    blockOwnerDeletion: true
    controller: true
    kind: Canary
    name: podinfo
    uid: 61ebb0cb-9a52-43de-924e-5b96fd5f43a2
  resourceVersion: "157263"
  uid: 2df910e4-85d5-4cb3-a6c6-f07f8fe1a499
spec:
  backends:
  - service: podinfo-canary
    weight: "0"
  - service: podinfo-primary
    weight: "100"
  service: podinfo

~
❯ kubectl delete -k github.com/fluxcd/flagger/kustomize/linkerd && kubectl delete ns test
customresourcedefinition.apiextensions.k8s.io "alertproviders.flagger.app" deleted
customresourcedefinition.apiextensions.k8s.io "canaries.flagger.app" deleted
customresourcedefinition.apiextensions.k8s.io "metrictemplates.flagger.app" deleted
serviceaccount "flagger" deleted
clusterrole.rbac.authorization.k8s.io "flagger" deleted
clusterrolebinding.rbac.authorization.k8s.io "flagger" deleted
deployment.apps "flagger" deleted
namespace "test" deleted

~ took 52s
```

### Exercise 5.04

Rancher is better than OpenShift because:

- Rancher tries to support Kubernetes (and docker) instead of just building on top of it.
  This gives more flexibility and doesn't force you into the dreaded vendor lock-in.
  This is a big problem of OpenShift which is developed by RedHat.
- Rancher makes it extremely easy and fast to deploy and manage applications unlike
  OpenShift which seems to require huge amount of knowledge of their specific ecosystem
  before a deployment can be made.
- Rancher supports open-source projects related to Kubernetes and adheres much better
  to Kubernetes and cloud best practices.

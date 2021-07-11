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

# Golde

GitOps based infrastructure as code and deployment tool.

![Check](https://github.com/golde-dev/golde/actions/workflows/checks.yaml/badge.svg)

## What is it?

- Simple declarative infrastructure as code tool with focus on common use cases. Initial focus is on self hosted infrastructure and big cloud providers.

- Git bases application deployments. All resources have specific branch ownership. Deployment will cover common use cases like containerized applications and static websites.

## What is it not?

- Terraform. It lacks fancy configuration language, third party providers, package manager, plugins and other features.

- Kubernetes. It is not platform to abstract away all infrastructure details. Helm charts, complex networking is not in scope.

- Fly/Vercel. It will not provided fully managed services like databases, storage, CI/CD, etc.

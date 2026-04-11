variable "IMAGE_NAME" {
  default = "bake-action-demo"
}

variable "IMAGE_TAG" {
  default = "latest"
}

variable "APP_PORT" {
  default = "3000"
}

target "app" {
  context    = "."
  dockerfile = "Dockerfile-mal"

  tags = [
    "${IMAGE_NAME}:${IMAGE_TAG}"
  ]

  args = {
    APP_PORT = APP_PORT
  }

  labels = {
    "org.opencontainers.image.title"       = "bake-action-demo"
    "org.opencontainers.image.description" = "Aplicación demo para CI/CD usando docker/bake-action"
  }
}

target "validate" {
  inherits = ["app"]
  call     = "check"
}

target "local" {
  inherits = ["app"]
  output   = ["type=docker"]
}

group "default" {
  targets = ["app"]
}
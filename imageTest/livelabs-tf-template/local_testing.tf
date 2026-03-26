# Local-only helpers for running the Marketplace template outside the Marketplace UI.
# Do not include this file when packaging the stack for publishing.

variable "availability_domain_name" {
  description = "Local override for the availability domain when testing outside Marketplace"
  type        = string
  default     = ""
}

locals {
  availability_domain_override = trimspace(var.availability_domain_name)
}

locals {
  computed_availability_domain = local.availability_domain_override != "" ? local.availability_domain_override : data.oci_identity_availability_domain.ad.name
}

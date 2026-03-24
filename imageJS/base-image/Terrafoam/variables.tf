variable "region" {
  description = "OCI region"
  type        = string
}

variable "shape" {
  type = string
}

variable "custom_image_ocid" {
  type = string
}

variable "compartment_id" {
  description = "Compartment OCID"
  type        = string
}

variable "availability_domain" {
  description = "Availability Domain"
  type        = string
}

variable "subnet_id" {
  description = "Subnet OCID"
  type        = string
}


variable "ssh_public_key" {
  description = "SSH public key"
  type        = string
}

variable "industry" {
  description = "Industry to deploy"
  type        = string
  default     = ""
}

variable "custom_workshopfiles" {
  description = "Optional custom workshop zip URL"
  type        = string
  default     = ""
}
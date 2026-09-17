# NEW: no Terraform existed in the original app — infra was provisioned
# manually per docs/DEPLOYMENT_GUIDE.md (SSH in, apt install docker, certbot,
# etc). These variables scaffold the minimum needed to lift that same
# EC2/Lightsail setup into code. Fill in defaults or pass via
# terraform.tfvars / -var flags — nothing here is wired to real
# infrastructure yet.

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai, closest to the .in domains
}

variable "instance_type" {
  description = "EC2 instance type for the app server"
  type        = string
  default     = "t3.medium"
}

variable "key_pair_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
}

variable "domains" {
  description = "Domains this server needs certs/DNS for"
  type        = list(string)
  default = [
    "nityasamagri.in",
    "www.nityasamagri.in",
    "adminns.in",
    "api.adminns.in",
    "chat.nityasamagri.in", # NEW: chatbot domain
  ]
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed to SSH into the instance (lock this down)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

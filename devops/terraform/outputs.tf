output "instance_public_ip" {
  description = "Public IP to point your A/AAAA DNS records at"
  value       = aws_instance.app_server.public_ip
}

output "instance_id" {
  value = aws_instance.app_server.id
}

output "ssh_command" {
  value = "ssh -i ${var.key_pair_name}.pem ubuntu@${aws_instance.app_server.public_ip}"
}

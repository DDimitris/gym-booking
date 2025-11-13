Param(
  [string]$Domain = "localhost"
)

$ErrorActionPreference = "Stop"

$certDir = Join-Path $PSScriptRoot "..\certs" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $certDir) {
  $certDir = Join-Path $PSScriptRoot "..\certs"
  New-Item -ItemType Directory -Force -Path $certDir | Out-Null
}

Write-Host "Generating self-signed certificate for $Domain..."

# Use OpenSSL if available; otherwise try New-SelfSignedCertificate and export PFX -> PEM
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if ($openssl) {
  & openssl req -x509 -nodes -newkey rsa:4096 `
    -keyout (Join-Path $certDir "privkey.pem") `
    -out (Join-Path $certDir "fullchain.pem") `
    -subj "/CN=$Domain" -days 365 `
    -addext "subjectAltName=DNS:$Domain,IP:127.0.0.1" `
    -sha256
} else {
  # Fallback using Windows cert tools
  $cert = New-SelfSignedCertificate -DnsName $Domain -CertStoreLocation Cert:\CurrentUser\My -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(1)
  $pwd = ConvertTo-SecureString -String (New-Guid).Guid -Force -AsPlainText
  $pfxPath = Join-Path $certDir "devcert.pfx"
  Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd | Out-Null
  # Convert PFX to PEM requires OpenSSL; if not available, instruct user
  Write-Warning "OpenSSL not found; created $pfxPath. Convert to PEM using OpenSSL: openssl pkcs12 -in devcert.pfx -out fullchain.pem -clcerts -nokeys; openssl pkcs12 -in devcert.pfx -out privkey.pem -nocerts -nodes"
}

try { icacls (Join-Path $certDir "privkey.pem") /inheritance:r /grant:r "$($env:USERNAME):R" | Out-Null } catch {}

Write-Host "Done. Files in $certDir: fullchain.pem, privkey.pem (if OpenSSL path used)."
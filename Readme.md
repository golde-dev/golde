

caddy adapt --config ./Caddyfile --pretty > caddy.json

1. Deployer service will monitor s3/r2 bucket every x min
  - config would be keyed on hostname


2. When there is new version of code 
  - pull latest version of code
  - unpack code and copy to folder in /opt/deployer/<app name>
  - update symlink to latest version   

3. When there is new version of config
  - overwrite existing services if there are differences
  - restart changed services
  - remove any services that no longer exists
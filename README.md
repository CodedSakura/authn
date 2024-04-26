# authn

intended to be used as a traefik froward auth middleware

## usage

### env

`SECRET_COOKIE`, `SECRET_SESSION` - preferably random strings

`POSTGRES_HOST` - postgres hostname

`BASE_PATH` - if not hosted on `/` set to path prefix

`CRON` - cron string for running the expires job

### traefik

```yaml
- "traefik.http.middlewares.service.forwardAuth.address=https://authn.com?perms=role"
- "traefik.http.middlewares.service.forwardAuth.trustForwardHeader=true"
```

you'll likely need to add `extra_hosts` to the traefik container mapping the `authn.com` to localhost

## endpoints

`GET /` - login view, returns 401 and a form if not authorised, 200 and nothing otherwise

`POST /` - login request, submitted from form, returns 400/401 and form if login unsuccessful, 200 and nothing otherwise

`GET /register` - register view

`POST /register` - register request

`GET /reset` - password reset view

`POST /reset` - password reset request

`GET /dash` - dashboard, requires to be authorized with `root` perm

`POST /dash` - various dashboard requests

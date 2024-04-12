# authn

`GET /` - login view, returns 401 and a form if not authorised, 200 and nothing otherwise

`POST /` - login request, submitted from form, returns 401/403 and form if login unsuccessful, 200 and nothing otherwise

`GET /register` - register view

`POST /register` - register request

`GET /reset` - password reset view

`POST /reset` - password reset request

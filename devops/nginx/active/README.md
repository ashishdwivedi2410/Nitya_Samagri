# Active blue/green backend pointers

`{service}-backend.conf` is the file nginx actually `include`s — it always
contains exactly one line, `set $X_backend "X_<color>:PORT";`, and decides
which color is currently live.

`{service}-backend.blue.conf` / `.green.conf` are the two pre-written options.
Deploying / rolling back = copying the right one over `{service}-backend.conf`
and running `docker compose exec nginx nginx -s reload`. Never hand-edit
`{service}-backend.conf` directly — it's overwritten by the deploy scripts.

Starting state: all three services point at blue.
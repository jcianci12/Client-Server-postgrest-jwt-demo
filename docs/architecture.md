# Architecture Overview

NGINX 
    - Listens on 8080 - passes / to angular on port 4200
    - passes /api to PostgREST port.

Angular - in a container - in dev mode its in serve mode. IN prod it pre builds and serves through nginx
PostGRES
PostgREST - serves on default port

Auth
oauth2 and RLS


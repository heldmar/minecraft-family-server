# No build step on purpose: the UI is plain HTML/CSS/JS, so this image is nginx
# plus four files. Nothing to compile means nothing to compile ON a box with one
# shared vCPU that is also serving two other live sites.
FROM nginx:1.29-alpine

COPY html/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-mcadmin-config.sh

RUN chmod +x /docker-entrypoint.d/40-mcadmin-config.sh

FROM nginx:stable-alpine
RUN mkdir -p /etc/nginx/available
COPY conf.d/http.conf  /etc/nginx/available/http.conf
COPY conf.d/https.conf /etc/nginx/available/https.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80 443
CMD ["/entrypoint.sh"]

FROM nginx:alpine

# Copy static assets and JS modules to the default Nginx public directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets

# Expose port 80 for Coolify ingress routing
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

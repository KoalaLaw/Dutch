FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node server ./server
COPY --chown=node:node shared ./shared
USER node
ENV HOST=0.0.0.0 PORT=5580 DATA_DIRECTORY=/data
EXPOSE 5580
CMD ["node", "server/start.mjs"]

FROM mongo:4.4

COPY init-mongo.js /docker-entrypoint-initdb.d/

ENV MONGO_INITDB_DATABASE=clickcounter
ENV MONGO_INITDB_ROOT_USERNAME=tiendat
ENV MONGO_INITDB_ROOT_PASSWORD=dat123

EXPOSE 27017
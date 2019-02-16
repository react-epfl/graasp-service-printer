FROM node:8-slim

# add git and bash
RUN apt-get update && apt-get install -yq git bash

# see https://crbug.com/795759
RUN apt-get update && apt-get install -yq libgconf-2-4

# install latest chrome dev package and fonts to support major charsets
# note: this installs the necessary libs to make the bundled version of chromium that puppeteer installs work
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
       --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

# it's a good idea to use dumb-init to help prevent zombie chrome processes
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# turn user namespaces on in kernel
# ???

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# install app dependencies
COPY package.json /usr/src/app/
RUN yarn install

# bundle app source
COPY . /usr/src/app

# add graasp user
RUN groupadd -r graasp && useradd -r -g graasp -G audio,video graasp \
    && mkdir -p /home/graasp/Downloads \
    && chown -R graasp:graasp /home/graasp \
    && chown -R graasp:graasp /usr

# run user as non privileged
USER graasp

EXPOSE 9696

ENTRYPOINT ["dumb-init", "--"]

# todo remove ':prod'
CMD ["yarn", "start:prod"]

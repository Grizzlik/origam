#Depending on the operating system of the host machines(s) that will build or run the containers, the image specified in the FROM statement may need to be changed.
#For more information, please see https://aka.ms/containercompat

# Fix of https://community.origam.com/t/not-displaying-c-at-the-end-of-words-in-pdf-generated-from-fastreport/755/19
# Rebuilding libgdiplus library to correctly display international characters 
# in FastReports. i.e. in czech language it doesn't display � located in the end
# of string. Instead of K� it printed just K.

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /tmp
#INSTALL YARN 
RUN apt-get update \
&& apt-get -y install curl gnupg \
&& curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
&& echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \ 
&& apt-get update \
&& apt-get -y install libgif-dev autoconf libtool automake build-essential gettext libglib2.0-dev libcairo2-dev libtiff-dev libexif-dev libpango1.0-dev git sudo nginx ssh yarn \
&& git clone https://github.com/mono/libgdiplus.git /tmp/libgdiplus \
&& cd libgdiplus \
&& ./autogen.sh --with-pango --prefix=/usr \
&& make \
&& make install \
&& apt-get -y purge autoconf automake build-essential \
&& apt-get -y autoremove \
&& cd .. \
&& rm -r libgdiplus \
&& useradd -ms /bin/bash origam \
&& usermod -aG sudo origam \
&& echo "%sudo   ALL=NOPASSWD: ALL" >> /etc/sudoers
WORKDIR /root
COPY updateTimezone.sh \
reverse-proxy.conf \
/root/
RUN mv reverse-proxy.conf /etc/nginx/sites-available \
&& unlink /etc/nginx/sites-enabled/default \
&& ln -s /etc/nginx/sites-available/reverse-proxy.conf /etc/nginx/sites-enabled/reverse-proxy.conf \
&& nginx -t \
&& chmod +x updateTimezone.sh \
&& cd /home \
&& su origam 
USER origam

WORKDIR /home/origam
RUN mkdir HTML5 HTML5-SOURCE
COPY --chown=origam:origam HTML5-SOURCE /home/origam/HTML5-SOURCE/
COPY --chown=origam:origam HTML5 _appsettings.template \
_OrigamSettings.mssql.template \
_OrigamSettings.postgres.template \
startServer.sh \
log4net.config \
updateEnvironment.sh \
updateEnvironmentRoot.sh \
/home/origam/HTML5/
WORKDIR /home/origam/HTML5
RUN mkdir data \
&& mkdir logs \
&& chmod +x startServer.sh \
&& chmod +x updateEnvironment.sh \
&& chmod +x updateEnvironmentRoot.sh
CMD sudo /etc/init.d/nginx start & sudo /root/updateTimezone.sh && ./startServer.sh

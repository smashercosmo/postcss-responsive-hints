FROM catthehacker/ubuntu:act-latest

# Install jq
RUN curl -fsSL -o /usr/local/bin/jq \
  https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-amd64 \
  && chmod +x /usr/local/bin/jq

# Install mocked gh
COPY .github/tests/__mocks__/gh.sh /usr/local/bin/gh
RUN chmod +x /usr/local/bin/gh
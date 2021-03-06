# Inspired by Polkadot Dockerfile

FROM phusion/baseimage:0.11 as builder
LABEL maintainer "alan@purestake.com"
LABEL description="This is the build stage for Polkadot. Here we create the binary."

ARG PROFILE=release
ARG POLKADOT_COMMIT=master
RUN echo "Using polkadot ${POLKADOT_COMMIT}"
WORKDIR /

# Install OS dependencies
RUN apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y cmake pkg-config libssl-dev git clang

# Grab the Polkadot Code
# TODO how to grab the correct commit from the lock file?
RUN git clone https://github.com/paritytech/polkadot
WORKDIR /polkadot
RUN git checkout ${POLKADOT_COMMIT}

# Download rust dependencies and build the rust binary
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y && \
	export PATH=$PATH:$HOME/.cargo/bin && \
	scripts/init.sh && \
	cargo build --$PROFILE --features=real-overseer

# ===== SECOND STAGE ======

FROM phusion/baseimage:0.11
LABEL maintainer "alan@purestake.com"
LABEL description="Polkadot for Moonbeam Alphanet Relay Chain"
ARG PROFILE=release
COPY --from=builder /polkadot/target/$PROFILE/polkadot /usr/local/bin

RUN mv /usr/share/ca* /tmp && \
	rm -rf /usr/share/*  && \
	mv /tmp/ca-certificates /usr/share/ && \
	rm -rf /usr/lib/python* && \
	useradd -m -u 1000 -U -s /bin/sh -d /moonbeam moonbeam && \
	mkdir -p /moonbeam/.local/share/moonbeam && \
	chown -R moonbeam:moonbeam /moonbeam/.local && \
	ln -s /moonbeam/.local/share/moonbeam /data && \
	rm -rf /usr/bin /usr/sbin

USER moonbeam

# 30333 for p2p traffic
# 9933 for RPC call
# 9944 for Websocket
# 9615 for Prometheus (metrics)
EXPOSE 30333 9933 9944 9615

VOLUME ["/data"]

CMD ["/usr/local/bin/polkadot"]

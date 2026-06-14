# syntax=docker/dockerfile:1

FROM golang:1.24-bookworm AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -tags=nomsgpack -trimpath -ldflags="-s -w" -o /out/gonexus . \
    && mkdir -p /out/uploads /out/logs

FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

COPY --from=builder /out/gonexus /app/gonexus
COPY --from=builder --chown=nonroot:nonroot /out/uploads /app/uploads
COPY --from=builder --chown=nonroot:nonroot /out/logs /app/logs

EXPOSE 9090

ENTRYPOINT ["/app/gonexus"]

FROM golang:1.22-alpine

WORKDIR /app

# Instalar dependencias necesarias para CA y git
RUN apk add --no-cache ca-certificates git

# Copiar archivos de dependencias
COPY go.mod go.sum ./
RUN go mod download

# Copiar el resto del código
COPY . .

# Deshabilitar CGO para una compilación estática y compatible (usamos PostgreSQL/modernc)
ENV CGO_ENABLED=0

# Compilar la aplicación de forma estática
RUN go build -v -o main .

# Crear directorio para subidas y datos persistentes
RUN mkdir -p cargas-brailer

# Exponer el puerto
EXPOSE 8080

# Comando para ejecutar
CMD ["./main"]

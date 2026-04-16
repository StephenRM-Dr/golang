FROM golang:1.22-alpine

# Instalar dependencias necesarias para SQLite y compilación de CGO
RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app

# Copiar archivos de dependencias
COPY go.mod go.sum ./
RUN go mod download

# Copiar el resto del código
COPY . .

# Habilitar CGO para go-sqlite3 si es necesario (el backend usa SQLite para la sesión de WhatsApp)
ENV CGO_ENABLED=1

# Compilar la aplicación
RUN go build -o main .

# Crear directorio para subidas y datos persistentes
RUN mkdir -p cargas-brailer

# Exponer el puerto
EXPOSE 8080

# Comando para ejecutar
CMD ["./main"]

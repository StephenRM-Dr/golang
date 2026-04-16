FROM golang:1.22-alpine

WORKDIR /app

# Instalar dependencias necesarias
RUN apk add --no-cache ca-certificates git

# Copiamos las dependencias desde la subcarpeta brailer
COPY brailer/go.mod brailer/go.sum ./
RUN go mod download

# Copiamos todo el contenido de la subcarpeta del backend
COPY brailer/ .

# Deshabilitar CGO para máxima compatibilidad cloud
ENV CGO_ENABLED=0

# Compilar la aplicación
RUN go build -v -o main .

# Crear directorio para subidas y datos temporales
RUN mkdir -p cargas-brailer

# Koyeb usa el puerto 8000 en tu configuración actual
EXPOSE 8000
ENV PORT=8000

# Ejecutar el binario compilado
CMD ["./main"]

FROM golang:1.24-alpine

WORKDIR /app

# Instalar dependencias necesarias
RUN apk add --no-cache ca-certificates git

# Copiamos las dependencias desde la raíz
COPY go.mod go.sum ./

# Truco: Forzamos la versión 1.24 en el servidor, ignorando si localmente se subió como 1.25
RUN sed -i 's/^go .*/go 1.24/' go.mod

RUN go mod download

# Copiamos todo el contenido del backend (ya está en la raíz)
COPY . .

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

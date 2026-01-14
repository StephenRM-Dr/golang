package main

import (
	"fmt"
	"math"
)

// declaracion de una constante como un string
const s string = "constant"

// inicio de la funcion main
func main() {
	// imprimir la constante
	fmt.Println(s)
	// declaracion de una constante numerica
	const n = 500000000
	// declaracion de una constante numerica con notacion cientifica y operacion aritmetica
	const d = 3e20 / n
	// imprimir la constante
	fmt.Println(d)
	// conversion de tipos
	// int64 convierte d a int64 Entero
	fmt.Println(int64(d))
	// se imprime la funcion math.Sin que calcula el seno de n
	fmt.Println(math.Sin(n))
}

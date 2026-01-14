package main

import "fmt"

/* variables demuestra la declaracion y uso de variables en Go
Golang puede declarar varias variables a la vez*/
func main() {
	var a = "inicializada" // declaracion y asignacion
	fmt.Println(a)
	var b, c int = 1, 23 // varias variables
	fmt.Println(b, c)
	var d = true // inferencia de tipo
	fmt.Println(d)
	var e float32 // declaracion sin asignacion, valor cero
	fmt.Println(e)
	f := "corto"
	fmt.Println(f) // declaracion corta, solo dentro de funciones
	var g int
	fmt.Println(g)

}

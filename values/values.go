/*
	go tiene varios tipos de datos basicos:

- bool: booleano, true o false
- string: cadena de texto
- int: entero, numero sin decimales
- float32, float64: numeros con decimales
- complex64, complex128: numeros complejos
*/
package main

import "fmt"

func values() {
	fmt.Println("Tipos de datos en Go:")
	fmt.Println("go" + "lang")          // string
	fmt.Println("1 + 1 =", 1+1)         // int
	fmt.Println("7.0 / 3.0 =", 7.0/3.0) // float64
	fmt.Println(true && false)          // bool
	fmt.Println(true || false)          // bool
	fmt.Println(!true)                  // bool
}

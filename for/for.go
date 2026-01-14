package main

import "fmt"

/* demonstracion del uso de bucles for en Go */
func main() {
	// bucle for clasico
	i := 1       // inicializacion
	for i <= 3 { // condicion{
		fmt.Println(i)
		i = i + 1 // incremento

	}
	// bucle for con inicializacion, condicion e incremento
	for j := 7; j <= 3; j++ {
		fmt.Println(j)
	}
	// bucle for infinito con break
	for {
		fmt.Println("loop")
		break
	} // fin del bucle infinito

	// bucle  for con rango
	for i := range 3 {
		fmt.Println("range", i)
	}

	for n := range 6 {
		if n%2 == 0 {
			continue
		}
		fmt.Println("impar", n)
	}

}

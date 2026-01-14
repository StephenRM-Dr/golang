package main

import "fmt"

/* demonstracion del uso de la estructura if-else en Go */

func main() {
	// if simple
	if 7%2 == 0 {
		fmt.Println("7 is a even")
	} else {
		fmt.Println("7 is odd")
	}
	// if con condicion multiple
	if 8%4 == 0 {
		fmt.Println("8 is divisible by 4")
	}
	// if con sentencia corta
	if num := 9; num < 0 {
		fmt.Println(num, "is negative")
	} else if num < 10 {
		fmt.Println(num, "has one digit")
	} else {
		fmt.Println(num, "has multiple digits")
	}
}

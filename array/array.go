package main

import "fmt"

func main() {
	// declaracion e inicializacion de un array de enteros con 5 elementos
	var a [5]int
	fmt.Println("array inicial:", a)

	a[4] = 100
	fmt.Println("Set:", a)
	fmt.Println("Get:", a[4])

	fmt.Println("Largo del Array:", len(a))
	// declaracion e inicializacion de un array con valores
	b := [5]int{1, 2, 3, 4, 5}
	fmt.Println("dcl:", b)

	// array multidimensional
	b = [...]int{1, 2, 3, 4, 5}
	fmt.Println("dcl:", b)

	b = [...]int{3, 5: 10, 15}
	fmt.Println("idx:", b)

	var twoD [2][3]int
	for i := range 2 {
		for j := range 3 {
			twoD[i][j] = i + j
		}
	}
	fmt.Println("2d: ", twoD)

	twoD = [2][3]int{
		{1, 2, 3},
		{1, 2, 3},
	}
	fmt.Println("2d: ", twoD)
}

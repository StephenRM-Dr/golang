package main

import (
	"fmt"
	"time"
)

/* demonstracion del uso de la estructura switch en Go */

func main() {
	i := 2
	fmt.Println("escribe ", i, " como")
	// simple switch
	switch i {
	case 1:
		fmt.Println("uno")
	case 2:
		fmt.Println("dos")
	case 3:
		fmt.Println("tres")
	}
	// switch con varias expresiones
	switch time.Now().Weekday() {
	case time.Saturday, time.Sunday:
		fmt.Println("es fin de semana")
	default:
		fmt.Println("es dia de semana")
	}

	// switch sin expresion
	t := time.Now()
	switch {
	case t.Hour() < 12:
		fmt.Println("buenos dias")
	case t.Hour() < 17:
		fmt.Println("buenas tardes")
	default:
		fmt.Println("buenas noches")
	}

	// type switch
	whatAmI := func(i interface{}) {
		switch i.(type) {
		case bool:
			fmt.Println("es un booleano")
		case int:
			fmt.Println("es un entero")
		default:
			fmt.Println("no se que es")
		}
	}
	whatAmI(true)
	whatAmI(1)
	whatAmI("hey")
}

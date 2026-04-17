package db

import (
	"database/sql"
	"example.com/m/v2/internal/models"
	_ "github.com/lib/pq"
)

// InitDB inicializa la base de datos y crea la tabla si no existe.
func InitDB(connStr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	sqlStmt := `
	CREATE TABLE IF NOT EXISTS historial (
		id SERIAL PRIMARY KEY,
		fecha_pago TEXT,
		descripcion TEXT,
		monto REAL,
		ciudad TEXT,
		banco_usado TEXT,
		referencia TEXT,
		imagen_path TEXT
	);`
	_, err = db.Exec(sqlStmt)
	if err != nil {
		return nil, err
	}

	// Migración rápida: intentar añadir la columna imagen_path si no existe
	db.Exec("ALTER TABLE historial ADD COLUMN imagen_path TEXT")
	// Convertir NULLs existentes a strings vacíos para evitar errores de Scan
	db.Exec("UPDATE historial SET imagen_path = '' WHERE imagen_path IS NULL")

	return db, nil
}

// CreateTransaction inserta una nueva transacción en la base de datos.
func CreateTransaction(db *sql.DB, t models.Transaccion) error {
	_, err := db.Exec(`INSERT INTO historial (fecha_pago, descripcion, monto, ciudad, banco_usado, referencia, imagen_path) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)`, t.FechaPago, t.Descripcion, t.Monto, t.Ciudad, t.Banco, t.Referencia, t.ImagenPath)
	return err
}

// ListTransactions recupera todas las transacciones ordenadas por ID descendente.
func ListTransactions(db *sql.DB) ([]models.Transaccion, error) {
	rows, err := db.Query("SELECT id, fecha_pago, descripcion, monto, ciudad, banco_usado, referencia, COALESCE(imagen_path, '') FROM historial ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transacciones := []models.Transaccion{}
	for rows.Next() {
		var t models.Transaccion
		err := rows.Scan(&t.ID, &t.FechaPago, &t.Descripcion, &t.Monto, &t.Ciudad, &t.Banco, &t.Referencia, &t.ImagenPath)
		if err != nil {
			return nil, err
		}
		transacciones = append(transacciones, t)
	}
	return transacciones, nil
}

// SearchTransactions busca transacciones por descripción o referencia (Case Insensitive).
func SearchTransactions(db *sql.DB, query string) ([]models.Transaccion, error) {
	searchQuery := "%" + query + "%"
	rows, err := db.Query(`SELECT id, fecha_pago, descripcion, monto, ciudad, banco_usado, referencia, COALESCE(imagen_path, '') 
		FROM historial 
		WHERE LOWER(descripcion) LIKE LOWER($1) OR LOWER(referencia) LIKE LOWER($2)
		ORDER BY id DESC`, searchQuery, searchQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transacciones := []models.Transaccion{}
	for rows.Next() {
		var t models.Transaccion
		err := rows.Scan(&t.ID, &t.FechaPago, &t.Descripcion, &t.Monto, &t.Ciudad, &t.Banco, &t.Referencia, &t.ImagenPath)
		if err != nil {
			return nil, err
		}
		transacciones = append(transacciones, t)
	}
	return transacciones, nil
}

// GetTransactionByID recupera una única transacción por su ID.
func GetTransactionByID(db *sql.DB, id int) (models.Transaccion, error) {
	var t models.Transaccion
	err := db.QueryRow("SELECT id, fecha_pago, descripcion, monto, ciudad, banco_usado, referencia, COALESCE(imagen_path, '') FROM historial WHERE id = $1", id).
		Scan(&t.ID, &t.FechaPago, &t.Descripcion, &t.Monto, &t.Ciudad, &t.Banco, &t.Referencia, &t.ImagenPath)
	return t, err
}

// UpdateTransaction actualiza una transacción existente.
func UpdateTransaction(db *sql.DB, t models.Transaccion) error {
	_, err := db.Exec(`UPDATE historial SET fecha_pago = $1, descripcion = $2, monto = $3, ciudad = $4, banco_usado = $5, referencia = $6, imagen_path = $7 
		WHERE id = $8`, t.FechaPago, t.Descripcion, t.Monto, t.Ciudad, t.Banco, t.Referencia, t.ImagenPath, t.ID)
	return err
}

// DeleteTransaction elimina una transacción por su ID.
func DeleteTransaction(db *sql.DB, id int) error {
	_, err := db.Exec("DELETE FROM historial WHERE id = $1", id)
	return err
}

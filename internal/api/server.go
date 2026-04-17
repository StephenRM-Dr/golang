package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync" // Añadido para manejo seguro del cliente de WhatsApp
	"time"
	"example.com/m/v2/internal/db"
	"example.com/m/v2/internal/export"
	"example.com/m/v2/internal/models"
	"example.com/m/v2/internal/whatsapp"
)

type Server struct {
	db       *sql.DB
	waClient *whatsapp.WAClient
	mu       sync.RWMutex // Protege el acceso a waClient
}

func NewServer(database *sql.DB, wa *whatsapp.WAClient) *Server {
	return &Server{
		db:       database,
		waClient: wa,
	}
}

// SetWhatsAppClient permite inyectar el cliente una vez conectado
func (s *Server) SetWhatsAppClient(wa *whatsapp.WAClient) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.waClient = wa
}

func (s *Server) Start(port string) error {
	// Crear carpeta de cargas si no existe
	uploadDir := "cargas-brailer"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	mux := http.NewServeMux()

	// Middleware para CORS y Logging de depuración
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("📡 [API] %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
			
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	mux.HandleFunc("/api/transactions", s.handleTransactions)
	mux.HandleFunc("/api/summary", s.handleSummary)
	mux.HandleFunc("/api/whatsapp/send", s.handleSendWhatsApp)
	mux.HandleFunc("/api/whatsapp/status", s.handleWhatsAppStatus)
	mux.HandleFunc("/api/whatsapp/logout", s.handleWhatsAppLogout)
	mux.HandleFunc("/api/export", s.handleExport)
	
	// Servir imágenes estáticas
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	fmt.Printf("🚀 API Server running on http://192.168.1.5:%s\n", port)
	return http.ListenAndServe("0.0.0.0:"+port, corsMiddleware(mux))
}

func (s *Server) handleTransactions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		transacciones, err := db.ListTransactions(s.db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(transacciones)

	case "POST", "PUT":
		// Manejar Multi-part form for images
		err := r.ParseMultipartForm(10 << 20) // 10MB
		if err != nil {
			var t models.Transaccion
			if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
				http.Error(w, "Invalid data", http.StatusBadRequest)
				return
			}
			
			if r.Method == "POST" {
				if err := db.CreateTransaction(s.db, t); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				w.WriteHeader(http.StatusCreated)
			} else {
				if err := db.UpdateTransaction(s.db, t); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				w.WriteHeader(http.StatusOK)
			}
			return
		}

		// Extraer datos del form
		monto, _ := strconv.ParseFloat(r.FormValue("monto"), 64)
		t := models.Transaccion{
			FechaPago:   r.FormValue("fecha_pago"),
			Descripcion: r.FormValue("descripcion"),
			Monto:       monto,
			Ciudad:      r.FormValue("ciudad"),
			Banco:       r.FormValue("banco_usado"),
			Referencia:  r.FormValue("referencia"),
			ImagenPath:  r.FormValue("imagen_path"), // Mantener imagen existente si no se sube una nueva
		}

		if r.Method == "PUT" {
			id, _ := strconv.Atoi(r.FormValue("id"))
			t.ID = id
		}

		// Manejar archivo si existe
		file, handler, err := r.FormFile("image")
		if err == nil {
			defer file.Close()
			
			ext := filepath.Ext(handler.Filename)
			fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
			filePath := filepath.Join("cargas-brailer", fileName)
			
			dst, err := os.Create(filePath)
			if err != nil {
				http.Error(w, "Failed to save image", http.StatusInternalServerError)
				return
			}
			defer dst.Close()
			io.Copy(dst, file)
			t.ImagenPath = "/uploads/" + fileName
		}

		if r.Method == "POST" {
			if err := db.CreateTransaction(s.db, t); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusCreated)
		} else {
			if err := db.UpdateTransaction(s.db, t); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusOK)
		}
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})

	case "DELETE":
		idStr := r.URL.Query().Get("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}
		
		if err := db.DeleteTransaction(s.db, id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleSummary(w http.ResponseWriter, r *http.Request) {
	transacciones, err := db.ListTransactions(s.db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var total float64
	var totalMes float64
	now := time.Now()
	currentMonth := now.Format("01/2006")

	for _, t := range transacciones {
		total += t.Monto
		// Nota: parseo simple de fecha DD/MM/YYYY
		if strings.HasSuffix(t.FechaPago, currentMonth) {
			totalMes += t.Monto
		}
	}

	summary := map[string]interface{}{
		"total_general": total,
		"total_mes":     totalMes,
		"conteo":        len(transacciones),
	}
	json.NewEncoder(w).Encode(summary)
}

func (s *Server) handleSendWhatsApp(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Query().Get("id")
	id, _ := strconv.Atoi(idStr)
	
	t, err := db.GetTransactionByID(s.db, id)
	if err != nil {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	s.mu.RLock()
	wa := s.waClient
	s.mu.RUnlock()

	if wa == nil {
		http.Error(w, "WhatsApp not connected", http.StatusServiceUnavailable)
		return
	}

	// Enviar a grupo Prueba por defecto o parametrizado
	recipient := r.URL.Query().Get("to")
	if recipient == "" {
		recipient = "Prueba"
	}

	var targetJID string
	if !strings.Contains(recipient, "@") {
		jid, err := s.waClient.GetGroupJIDByName(recipient)
		if err != nil {
			log.Printf("❌ Error: Grupo '%s' no encontrado: %v", recipient, err)
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		}
		targetJID = jid.String()
	} else {
		targetJID = recipient
	}

	go func() {
		err := wa.SendTransaction(targetJID, t)
		if err != nil {
			log.Printf("Error sending WhatsApp ID %d: %v", id, err)
		}
	}()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "queued"})
}

func (s *Server) handleWhatsAppStatus(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	wa := s.waClient
	s.mu.RUnlock()

	if wa == nil {
		// Intentar recuperar de GlobalWA si el servidor local no lo tiene
		wa = whatsapp.GlobalWA
	}

	status := map[string]interface{}{
		"connected": false,
		"qr":        "",
	}

	if wa != nil {
		status["connected"] = wa.IsConnected
		status["qr"] = wa.QRCode
		status["last_error"] = wa.LastError
		if wa.IsConnected {
			groups, _ := wa.GetJoinedGroupsNames()
			status["groups"] = groups
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (s *Server) handleWhatsAppLogout(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	wa := s.waClient
	s.mu.RUnlock()

	if wa == nil {
		wa = whatsapp.GlobalWA
	}

	if wa != nil {
		err := wa.Logout()
		if err != nil {
			log.Printf("Error logging out: %v", err)
		}
	}

	// Reiniciar conexión para generar nuevo QR
	fmt.Println("🔄 Reiniciando conexión de WhatsApp para nuevo QR...")
	go func() {
		newClient, err := whatsapp.Connect()
		if err != nil {
			log.Printf("Error reconnecting WhatsApp: %v", err)
			return
		}
		s.waClient = newClient
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "resetting"})
}

func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
	transacciones, err := db.ListTransactions(s.db)
	if err != nil {
		http.Error(w, "Failed to fetch transactions", http.StatusInternalServerError)
		return
	}

	f, err := export.GenerateExcel(transacciones)
	if err != nil {
		http.Error(w, "Failed to generate Excel", http.StatusInternalServerError)
		return
	}
	defer f.Close()

	// Configurar headers para descarga
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=reporte_brailer.xlsx")

	if err := f.Write(w); err != nil {
		log.Printf("Error writing Excel to response: %v", err)
	}
}

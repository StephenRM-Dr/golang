package whatsapp

import (
	"context"
	"database/sql"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"

	"example.com/m/v2/internal/models"
	"github.com/mdp/qrterminal/v3"
	_ "github.com/lib/pq" // Driver de Postgres
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
	"modernc.org/sqlite"
)

func init() {
	// Truco: Registrar modernc como "sqlite3" para satisfacer a whatsmeow
	sql.Register("sqlite3", &sqlite.Driver{})
}

type WAClient struct {
	Client      *whatsmeow.Client
	QRCode      string
	IsConnected bool
}

var (
	GlobalWA      *WAClient
	waContainer   *sqlstore.Container
)

// Connect establece la conexión con WhatsApp, manejando la sesión en PostgreSQL si está disponible, o SQLite como fallback.
func Connect() (*WAClient, error) {
	if waContainer == nil {
		dbLog := waLog.Stdout("Database", "ERROR", true)
		
		var driver string
		var dsn string

		// Intentar usar PostgreSQL (Neon) para persistencia en la nube
		pgUrl := os.Getenv("DATABASE_URL")
		if pgUrl != "" {
			driver = "postgres"
			dsn = pgUrl
			fmt.Println("🚀 WhatsApp: Usando PostgreSQL para persistencia de sesión.")
		} else {
			// Fallback local a SQLite
			dbPath := os.Getenv("WA_DB_PATH")
			if dbPath == "" {
				dbPath = "whatsapp_final_v6.db"
			}
			driver = "sqlite3"
			dsn = fmt.Sprintf("file:%s?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(10000)&cache=shared", dbPath)
			fmt.Println("💻 WhatsApp: Usando SQLite local para persistencia de sesión.")
		}
		
		container, err := sqlstore.New(context.Background(), driver, dsn, dbLog)
		if err != nil {
			return nil, err
		}
		waContainer = container
	}
	
	deviceStore, err := waContainer.GetFirstDevice(context.Background())
	if err != nil {
		return nil, err
	}
	clientLog := waLog.Stdout("Client", "ERROR", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)

	wa := &WAClient{Client: client}
	GlobalWA = wa

	if client.Store.ID == nil {
		// No hay sesión: capturar QR
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			return nil, err
		}
		
		go func() {
			for evt := range qrChan {
				if evt.Event == "code" {
					wa.QRCode = evt.Code
					wa.IsConnected = false
					fmt.Println("\n📸 NUEVO QR GENERADO (Disponible en Web/Terminal)")
					qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
				} else if evt.Event == "success" {
					wa.QRCode = ""
					wa.IsConnected = true
					fmt.Println("✅ Vinculación exitosa via QR.")
				}
			}
		}()
	} else {
		err = client.Connect()
		if err != nil {
			return nil, err
		}
		wa.IsConnected = true
		fmt.Println("✅ WhatsApp reconectado automáticamente.")
	}

	return wa, nil
}

// Logout cierra la sesión actual de forma permanente (desvincula el dispositivo).
func (wa *WAClient) Logout() error {
	if wa.Client == nil {
		return fmt.Errorf("cliente no inicializado")
	}
	
	// Unpair desvincula el dispositivo de los servidores de WA
	err := wa.Client.Logout(context.Background())
	if err != nil {
		fmt.Printf("⚠️ Error durante Logout (unpair): %v\n", err)
		// Intentamos desconectar igual
	}
	
	wa.Client.Disconnect()
	wa.IsConnected = false
	wa.QRCode = ""
	GlobalWA = nil
	return nil
}

// SendTransaction envía una transacción estructurada a un destinatario (JID).
func (wa *WAClient) SendTransaction(recipient string, t models.Transaccion) error {
	jid, err := types.ParseJID(recipient)
	if err != nil {
		return err
	}

	messageText := fmt.Sprintf("*NUEVO REGISTRO - BRAILER LEDGER*\n\n"+
		"*Fecha:* %s\n"+
		"*Descripción:* %s\n"+
		"*Monto:* Bs. %.2f\n"+
		"*Referencia:* %s\n"+
		"*Banco:* %s\n"+
		"*Ciudad:* %s\n",
		t.FechaPago, t.Descripcion, t.Monto, t.Referencia, t.Banco, t.Ciudad)

	// Si hay imagen, enviarla primero o junto al mensaje
	if t.ImagenPath != "" {
		localPath := t.ImagenPath
		// Si es una ruta web (/uploads/...), convertir a ruta local
		if len(t.ImagenPath) > 9 && t.ImagenPath[:9] == "/uploads/" {
			localPath = filepath.Join("cargas-brailer", t.ImagenPath[9:])
		}
		
		data, err := os.ReadFile(localPath)
		if err == nil {
			ext := filepath.Ext(t.ImagenPath)
			mimeType := mime.TypeByExtension(ext)
			if mimeType == "" {
				mimeType = http.DetectContentType(data)
			}

			fmt.Printf("📤 Subiendo imagen: %s (%d bytes)...\n", t.ImagenPath, len(data))
			resp, err := wa.Client.Upload(context.Background(), data, whatsmeow.MediaImage)
			if err != nil {
				return fmt.Errorf("error al subir imagen a servidores de WA: %v", err)
			}
			fmt.Println("✅ Imagen subida con éxito.")

			imageMsg := &waE2E.ImageMessage{
				Caption:       proto.String(messageText),
				Mimetype:      proto.String(mimeType),
				URL:           proto.String(resp.URL),
				DirectPath:    proto.String(resp.DirectPath),
				MediaKey:      resp.MediaKey,
				FileLength:    proto.Uint64(uint64(len(data))),
				FileSHA256:    resp.FileSHA256,
				FileEncSHA256: resp.FileEncSHA256,
			}
			_, err = wa.Client.SendMessage(context.Background(), jid, &waE2E.Message{
				ImageMessage: imageMsg,
			})
			return err
		} else {
			fmt.Printf("⚠️ No se pudo leer el archivo de imagen: %v\n", err)
		}
	}

	// Si no hay imagen o falló el envío con imagen, enviar solo texto
	_, err = wa.Client.SendMessage(context.Background(), jid, &waE2E.Message{
		Conversation: proto.String(messageText),
	})
	return err
}

// GetGroupJIDByName busca el JID de un grupo basándose en su nombre.
func (wa *WAClient) GetGroupJIDByName(name string) (types.JID, error) {
	groups, err := wa.Client.GetJoinedGroups(context.Background())
	if err != nil {
		return types.EmptyJID, err
	}

	for _, group := range groups {
		if group.Name == name {
			return group.JID, nil
		}
	}

	return types.EmptyJID, fmt.Errorf("grupo '%s' no encontrado", name)
}

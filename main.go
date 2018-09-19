package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/bakaoh/sqlite-gobroem/gobroem"
)

const version = "0.0.1"

var options struct {
	db   string
	host string
	port uint
}

// initConfig ...
func initConfig() {
	options.db = *flag.String("db", "/home/taitt/Downloads/item.db", "SQLite database file")
	options.host = *flag.String("bind", "localhost", "HTTP server host")
	options.port = *flag.Uint("listen", 8000, "HTTP server listen port")
	flag.Parse()
}

// initServer initialize and start the web server.
func initServer() {
	// Initialize the API controller
	api, err := gobroem.NewAPI(options.db)
	if err != nil {
		log.Fatal("can not open db", err)
	}

	http.HandleFunc("/api/info", api.Info)
	http.HandleFunc("/api/table", api.Tables)
	http.HandleFunc("/api/table/:name", api.Table)
	http.HandleFunc("/api/table/:name/info", api.TableInfo)
	http.HandleFunc("/api/table/:name/sql", api.TableSQL)
	http.HandleFunc("/api/table/:name/indexes", api.TableIndexes)
	http.HandleFunc("/api/query", api.Query)

	fileServer := http.FileServer(&gobroem.AssetFS{
		Asset:    gobroem.Asset,
		AssetDir: gobroem.AssetDir,
		Prefix:   "static",
	})
	http.Handle("/", http.StripPrefix("/", fileServer))
	http.ListenAndServe(fmt.Sprintf("%s:%d", options.host, options.port), nil)
}

// printHeader print the welcome header.
func printHeader() {
	fmt.Fprintf(os.Stdout, "sqlite gobroem, v%s\n", version)
}

func main() {
	printHeader()
	initConfig()
	initServer()
}

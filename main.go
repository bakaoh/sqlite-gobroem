package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/bakaoh/sqlite-gobroem/gobroem"
)

const version = "0.1.0"

var options struct {
	db   string
	host string
	port uint
}

// printHeader print the welcome header.
func printHeader() {
	fmt.Fprintf(os.Stdout, "sqlite gobroem, v%s\n", version)
}

// initConfig parse CLI config
func initConfig() {
	options.db = *flag.String("db", "test/test.db", "SQLite database file")
	options.host = *flag.String("bind", "localhost", "HTTP server host")
	options.port = *flag.Uint("listen", 8000, "HTTP server listen port")
	flag.Parse()
}

// startServer initialize and start the web server.
func startServer() {
	api, err := gobroem.NewAPI(options.db)
	if err != nil {
		log.Fatal("can not open db", err)
	}

	http.ListenAndServe(
		fmt.Sprintf("%s:%d", options.host, options.port),
		api.Handler("/"),
	)
}

func main() {
	printHeader()
	initConfig()
	startServer()
}

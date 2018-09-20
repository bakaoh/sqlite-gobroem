# sqlite-gobroem

`sqlite-gobroem` is a Golang embedded web-based SQLite database browser.

## Installing

Use go get to install the latest version of the library:

```bash
$ go get -u github.com/bakaoh/sqlite-gobroem
```

Include Gobroem in your application:

```go
import "github.com/bakaoh/sqlite-gobroem/gobroem"
```

## Standalone

Use go build to build Gobroem:

```bash
$ cd $GOPATH/src/github.com/bakaoh/sqlite-gobroem/gobroem
$ go build .
```

Run Gobroem:

```bash
$ ./sqlite-gobroem -h

Usage of ./sqlite-gobroem:
  -bind string
    	HTTP server host (default "localhost")
  -db string
    	SQLite database file (default "test/test.db")
  -listen uint
    	HTTP server listen port (default 8000)

$ ./sqlite-gobroem
```

Open browser http://localhost:8000/

## Embedded

Initialize the API controller:

```go
api, err := gobroem.NewAPI("path to sqlite db file")
if err != nil {
    log.Fatal("can not open db", err)
}
```

Register the API handler:

```go
http.Handle("/browser/", api.Handler("/browser/"))
```
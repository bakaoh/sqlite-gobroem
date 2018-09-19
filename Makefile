bindata:
	go-bindata -pkg gobroem -o gobroem/assets.go static/...

build: bindata
	go build .

run: build
	./sqlite-gobroem
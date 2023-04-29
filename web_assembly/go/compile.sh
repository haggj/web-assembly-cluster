#/bin/bash
TARGET=static/main.wasm

rm $TARGET
GOOS=js GOARCH=wasm go build -o $TARGET
echo "Success!"
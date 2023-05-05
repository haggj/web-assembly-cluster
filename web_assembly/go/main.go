package main

import (
    "golang.org/x/crypto/pbkdf2"
    "crypto/sha1"
    "syscall/js"
    "bytes"
    "fmt"
    "time"
    b64 "encoding/base64"
)

const ITERATIONS = 80000

func main() {
    // Expose the function to JS
    js.Global().Set("wasmFunction", asyncFunc(passwordCracker))
    <-make(chan bool)
}


// ---------------------------- Password hashing  ----------------------------


func hashPassword(password string)([] byte) {
    start := time.Now()
    hash := pbkdf2.Key([] byte(password), [] byte("salt"), ITERATIONS, 32, sha1.New)
    elapsed := time.Since(start)
    fmt.Printf("%d  ->  %s\n",ITERATIONS, elapsed)
    return hash
}

var passwordCracker = func(this js.Value, args[] js.Value) (any, error) {
        // args[0] is hash to hash to crack
        // args[n] is a password to check (n>=1)

        if len(args) < 2 {
            return "", fmt.Errorf("Invalid no of arguments passed")
        }

        // Convert hashToCrack from base64 to bytes
        hashToCrack, _ := b64.StdEncoding.DecodeString(args[0].String())

        // Check passwords and return if found
        for _, arg := range args[1:] {
            pw := arg.String()
            if bytes.Equal(hashPassword(pw), hashToCrack) {
                return pw, nil
            }
        }

        // Return empty string if not found
        return "", nil
}

// ---------------------------- Helper to make async functions ----------------------------

type fn func(this js.Value, args []js.Value) (any, error)

var (
    jsErr     js.Value = js.Global().Get("Error")
    jsPromise js.Value = js.Global().Get("Promise")
)

func asyncFunc(innerFunc fn) js.Func {
    return js.FuncOf(func(this js.Value, args []js.Value) any {
        handler := js.FuncOf(func(_ js.Value, promFn []js.Value) any {
            resolve, reject := promFn[0], promFn[1]

            go func() {
                defer func() {
                    if r := recover(); r != nil {
                        reject.Invoke(jsErr.New(fmt.Sprint("panic:", r)))
                    }
                }()

                res, err := innerFunc(this, args)
                if err != nil {
                    reject.Invoke(jsErr.New(err.Error()))
                } else {
                    resolve.Invoke(res)
                }
            }()

            return nil
        })

        return jsPromise.New(handler)
    })
}
package main

import "golang.org/x/crypto/pbkdf2"
import "crypto/sha1"
import "syscall/js"
import "bytes"
import "fmt"
import "time"

const ITERATIONS = 8000

func main() {
    // Expose the function to JS
    js.Global().Set("wasmFunction", passwordCracker)
    <-make(chan bool)
}

func hashPassword(password string)([] byte) {
    start := time.Now()
    hash := pbkdf2.Key([] byte(password), [] byte("salt"), ITERATIONS, 32, sha1.New)
    elapsed := time.Since(start)
    fmt.Printf("%d  ->  %s\n",ITERATIONS, elapsed)
    return hash
}

var passwordCracker = js.FuncOf(func(this js.Value, args[] js.Value) any {
        // args[0] is hash to hash to crack
        // args[n] is a password to check (n>=1)

        if len(args) < 2 {
            return "Invalid no of arguments passed"
        }

        // Copy hashToCrack into Go memory
        hashToCrack := make([] byte, args[0].Length())
        js.CopyBytesToGo(hashToCrack, args[0])

        // Check passwords and return if found
        for _, arg := range args[1:] {
            pw := arg.String()
            if bytes.Equal(hashPassword(pw), hashToCrack) {
                return pw
            }
        }

        // Return empty string if not found
        return ""
})
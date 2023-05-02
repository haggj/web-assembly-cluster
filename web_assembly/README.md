# Web Assembly Code

This folder contains the Web Assembly code for the project.
The workflow is the following:
1. Write GO code which should be translated to web assembly in `go/main.go`.
2. Compile the code to web assembly using the script `compile.sh`. This creates a file `go/static/main.wasm`.
3. To test your code, start the web server using `python server.py`.
    - The server serves a simple html page, which loads the web assembly code and executes it.
    - The html page is located in `go/static/index.html`.
    - The web assembly code is loaded from `go/static/main.wasm`.
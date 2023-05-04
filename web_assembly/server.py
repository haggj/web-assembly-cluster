from fastapi import FastAPI, WebSocket
from starlette.responses import FileResponse

import utils

app = FastAPI()
GO_STATIC = "go/static/"

@app.get("/")
async def get():
    return FileResponse(GO_STATIC + 'index.html')

@app.get("/wasm_exec.js")
async def get():
    return FileResponse(GO_STATIC + '/wasm_exec.js')

@app.get("/main.wasm")
async def get():
    return FileResponse(GO_STATIC + '/main.wasm')


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await utils.handle_websocket(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", port=8004, reload=True)
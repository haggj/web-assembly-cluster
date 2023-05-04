from starlette.websockets import WebSocketDisconnect

async def handle_websocket(websocket):
    """
    Maintain websocket connection and emit events.
    """
    await on_connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await on_data(websocket, data)
    except WebSocketDisconnect:
        await on_disconnect(websocket)

async def on_connect(websocket):
    print("connected!!")

async def on_data(websocket, data):
    print("data!!")
    await websocket.send_text(f"Message text was: {data}")

async def on_disconnect(websocket):
    print("disconnected!!")

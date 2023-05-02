import React, { useEffect, useState } from 'react';
import './wasm_exec.js';

export const Client = () => {
    const [test, setTest] = useState('Client');

    let initWebAssembly = async (wasm_path) => {
       let go = new window.Go();
       let result = await WebAssembly.instantiateStreaming(fetch(wasm_path, {cache: "no-store"}), go.importObject);
       go.run(result.instance);
     };

    let runWebAssembly = (...args) => {
        return window.wasmFunction(...args);
    }

   (async() => {
  console.log('before start');
  await initWebAssembly("http://localhost:3001/main.wasm");
  const hash = Uint8Array.from([58, 196, 44, 131, 94, 101, 124, 169, 86, 7, 42, 215, 197, 160, 67, 233, 74, 171, 0, 112, 140, 38, 14, 99, 14, 16, 147, 84, 41, 159, 55, 51])
  var result = runWebAssembly(hash, "hallo", "hi", "ho")
  console.log(result);
})();


    return (
        <h3>Page {test}</h3>
    );
};

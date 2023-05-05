import {BrowserRouter, Routes, Route} from 'react-router-dom';

import React from 'react';
import {MasterDashboard} from "./pages/masterDashboard/masterDashboard";
import {Client} from "./pages/client/client";
import HelloWorld from "./pages/helloWorld";
import {NoPage} from "./pages/noPage";

function App() {
  return (
      <>
        <BrowserRouter>
          <Routes>
            <Route path="/">
              <Route index element={<NoPage />} />
              <Route path="master-dashboard" element={<MasterDashboard />} />
              <Route path="client" element={<Client />} />
              <Route path="hello-world" element={<HelloWorld />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </>
  );
}

export default App;


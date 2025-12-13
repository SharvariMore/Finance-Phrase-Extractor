import "./App.css";
import FinanceExtractor from "./components/FinanceExtractor";
import History from "./components/History";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Protected from "./components/Protected";
import Analytics from "./components/Analytics";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className="mt-6">
        <Routes>
          <Route path="/" element={<FinanceExtractor />} />
         <Route
          path="/history"
          element={
            <Protected>
              <History />
            </Protected>
          }
        />
        <Route
          path="/analytics"
          element={
            <Protected>
              <Analytics />
            </Protected>
          }
        />
         <Route path="*" element={<FinanceExtractor />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

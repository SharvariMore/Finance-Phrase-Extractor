import "./App.css";
import FinanceExtractor from "./components/FinanceExtractor";
import History from "./components/History";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className="mt-6">
        <Routes>
          <Route path="/" element={<FinanceExtractor />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

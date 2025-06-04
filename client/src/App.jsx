import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from './components/Home.jsx';
import Register from './components/Register.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import ChangePassword from './components/ChangePassword.jsx';
import Space from './components/Space.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/changepassword" element={<ChangePassword />} />
        <Route path="/space/:spaceId" element={<Space />} />
      </Routes>
    </Router>
  );
}

export default App;

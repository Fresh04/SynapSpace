import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/register`, form);
      const loginRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      // alert('Registered and logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration/Login failed');
    }
  };

  return (
    <>
      <Header />
      <div className="pt-24 min-h-screen flex flex-col justify-center items-center bg-[#1a1a1a] text-white px-4">
        <h1 className="text-4xl font-bold mb-8">Register for SynapSpace</h1>
        <form onSubmit={handleSubmit} className="bg-[#2a2a2a] p-8 rounded-xl w-full max-w-md shadow-lg space-y-6">
          <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-gray-100 text-black" required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-gray-100 text-black" required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-gray-100 text-black" required />
          <button type="submit" className="w-full bg-[#00ffff] text-black font-semibold text-lg py-3 rounded-lg hover:bg-[#1ff] transition">Register</button>
        </form>
      </div>
    </>
  );
}
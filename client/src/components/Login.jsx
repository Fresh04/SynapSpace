import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, form);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      alert('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <>
      <Header />
      <div className="pt-24 min-h-screen flex flex-col justify-center items-center bg-[#1a1a1a] text-white px-4">
        <h1 className="text-4xl font-bold mb-8">Login to SynapSpace</h1>
        <form onSubmit={handleSubmit} className="bg-[#2a2a2a] p-8 rounded-xl w-full max-w-md shadow-lg space-y-6">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-gray-100 text-black" required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-gray-100 text-black" required />
          <button type="submit" className="w-full bg-[#00ffff] text-black font-semibold text-lg py-3 rounded-lg hover:bg-[#1ff] transition">Login</button>
        </form>
      </div>
    </>
  );
}
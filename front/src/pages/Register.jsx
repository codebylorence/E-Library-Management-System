import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import cvsulogo from "../assets/CvSU-Logo.webp";
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Register = () => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await api.post('/users/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: 'student',
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition-all shadow-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 mt-15">
      <Navbar />
      
      {/* Main Content Centered */}
      <div className="flex-grow flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-10">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={cvsulogo} 
              alt="CvSU Logo" 
              className="h-16 w-auto mb-4 object-contain" 
            />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Create Account
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Join the E-Library Management System
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Juan Dela Cruz"
                value={form.fullName}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 p-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-semibold text-green-700 hover:text-green-600 transition-colors"
            >
              Log in here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
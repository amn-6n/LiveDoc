import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'react-hot-toast'
import '../styles/TextEditor.css'
import '../styles/Auth.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      // newErrors.email = 'Email or username is required'
      toast.error('Email or username is required')
    } 

    if (!formData.password) {
      // newErrors.password = 'Password is required'
      toast.error('Password is required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    // setMessage('')

    if (!validate()) return

    try {
      const res = await fetch('http://localhost:3001/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        // setMessage('Login successful!')
        toast.success('Login successful!')
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        navigate('/join'); 
      } else {
        // setMessage(data.message || 'Login failed')
        toast.error(data.message || 'Login failed')
      }
    } catch (error) {
      setMessage('Something went wrong')
      // console.error(error)
    }
  }

  return (
    <div className="body">
      <div className="auth-container">
        <h2 className="auth-title">Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your email or username"
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
            />
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="auth-button login-button"
          >
            Login
          </button>

          <div className="auth-link">
            <Link to="/register">
              Don't have an account? Register here
            </Link>
          </div>
        </form>
        {message && (
          <div className={`message ${message.includes('successful') ? 'success-message' : 'error-message'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default Login

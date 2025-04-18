import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'react-hot-toast'
import '../styles/TextEditor.css'
import '../styles/Auth.css'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      // newErrors.username = 'Username is required'
      toast.error('Username is required')
    }

    if (!formData.email.trim()) {
      // newErrors.email = 'Email is required'
      toast.error('Email is required')
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      // newErrors.email = 'Email is invalid'
      toast.error('Please enter a valid email address')
    }

    if (!formData.password) {
      // newErrors.password = 'Password is required'
      toast.error('Password is required')
    } else if (formData.password.length < 6) {
      // newErrors.password = 'Password must be at least 6 characters'
      toast.error('Password must be at least 6 characters')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setMessage('')

    if (!validate()) return

    try {
      const res = await fetch('http://localhost:3001/api/v1/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        // setMessage('Registration successful!')
        toast.success('Registration successful!')
        setFormData({ username: '', email: '', password: '' })
      } else {
        // setMessage(data.message || 'Registration failed')
        toast.error(data.message || 'Registration failed')
      }
    } catch (error) {
      setMessage('Something went wrong')
      // console.error(error)
    }
  }

  return (
    <div className="body">
      <div className="head-logo">
        <img src="/logo.png" alt="logo" width={"500px"}/>
      </div>
      <div className="auth-container">
        <h2 className="auth-title">Register</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your username"
            />
            {errors.username && <p className="error-message">{errors.username}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your email"
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
            className="auth-button register-button"
          >
            Register
          </button>

          <div className="auth-link">
            <Link to="/">
              Already have an account? Login here
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

export default Register

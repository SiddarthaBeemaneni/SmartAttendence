/**
 * SmartAttend AI - Application Entry Point
 * 
 * This is the very first JavaScript file that runs.
 * It mounts our React App component into the HTML page.
 * 
 * StrictMode helps catch bugs during development by running 
 * components twice to detect side effects.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

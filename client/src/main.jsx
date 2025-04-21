import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { store } from './redux/store'
import AuthProvider from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <ToastContainer />
          </BrowserRouter>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
) 
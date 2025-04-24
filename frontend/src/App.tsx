import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { useSidebar } from './contexts/SidebarContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { useEffect } from 'react'

// Components
import Navbar from './components/Navbar'

// Pages
import Home from './pages/Home'
import UrlShortener from './pages/UrlShortener'
import PdfConverter from './pages/PdfConverter'
import PdfMerger from './pages/PdfMerger'
import ImageToPdf from './pages/ImageToPdf'
import ImageCompressor from './pages/ImageCompressor'
import CircleCropImage from './pages/CircleCropImage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import VerifyEmail from './pages/VerifyEmail'
import EditProfile from './pages/EditProfile'
import ChangePassword from './pages/ChangePassword'
import ResetPassword from './pages/ResetPassword'

// Create a wrapper component to access router context
function AppContent() {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const location = useLocation();

  // Close sidebar when on homepage
  useEffect(() => {
    if (location.pathname === '/') {
      closeSidebar();
    }
  }, [location.pathname, closeSidebar]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Navbar />

      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={
          <div className="pt-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            <Login />
          </div>
        } />
        <Route path="/signup" element={
          <div className="pt-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            <Signup />
          </div>
        } />

        {/* Home Route */}
        <Route path="/" element={
          <div className="pt-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            <Home />
          </div>
        } />

        <Route path="/change-password" element={
          <div className="pt-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            <ChangePassword />
          </div>
        } />

        <Route path="/reset-password/:token" element={
          <div className="pt-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            <ResetPassword/>
          </div>
        } />

        {/* Tool Routes */}
        <Route path="/url-shortener" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <UrlShortener />
            </div>
          </div>
        } />
        <Route path="/pdf-converter" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <PdfConverter />
            </div>
          </div>
        } />
        <Route path="/pdf-merger" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <PdfMerger />
            </div>
          </div>
        } />
        <Route path="/image-to-pdf" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <ImageToPdf />
            </div>
          </div>
        } />
        <Route path="/image-compressor" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <ImageCompressor />
            </div>
          </div>
        } />
        <Route path="/circle-crop" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <CircleCropImage />
            </div>
          </div>
        } />
        <Route path="/dashboard" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <Dashboard />
            </div>
          </div>
        } />
        <Route path="/profile" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <Profile />
            </div>
          </div>
        } />
        <Route path="/verify-email/:token" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <VerifyEmail />
            </div>
          </div>
        } />
        <Route path="/edit-profile" element={
          <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
            <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
              <EditProfile/>
            </div>
          </div>
        } />
      </Routes>

      <ToastContainer
        position="bottom-right"
        theme="colored"
        toastClassName="dark:bg-gray-800 dark:text-gray-200"
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <SidebarProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SidebarProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App

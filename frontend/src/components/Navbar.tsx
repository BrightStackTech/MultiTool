import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useState, useEffect } from 'react';
import {
    Bars3Icon,
    XMarkIcon,
    UserIcon,
    ChartBarIcon,
    LinkIcon,
    DocumentArrowUpIcon,
    DocumentPlusIcon,
    PhotoIcon,
    ArrowsPointingInIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { TbLogout } from "react-icons/tb";
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/change-password';
    const isHomePage = location.pathname === '/';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(() => {
        // Initialize from localStorage or default to open for non-mobile
        const savedState = localStorage.getItem('sidebarOpen');
        // If we have a saved state, use it, otherwise default to true for non-mobile
        return savedState !== null ? savedState === 'true' : window.innerWidth >= 768;
    });
    const [isMobile, setIsMobile] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    // Detect mobile screens
    useEffect(() => {
        const checkIfMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            // If no saved preference exists yet, initialize sidebar open state based on screen size
            if (localStorage.getItem('sidebarOpen') === null) {
                setSidebarOpen(!mobile); // Open by default on non-mobile
            }
        };

        // Initial check
        checkIfMobile();

        // Listen for resize events
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Close only the mobile menu when location changes, not the sidebar
    useEffect(() => {
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
        // We're no longer closing the sidebar on location change
    }, [location.pathname]);

    // Handle body overflow when sidebar is open on mobile
    useEffect(() => {
        if (isMobile && isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isMobile, isSidebarOpen]);

    // Persist sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
    }, [isSidebarOpen]);

    // Close sidebar when navigating to homepage
    useEffect(() => {
        if (location.pathname === '/') {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // Handle logout click
    const handleLogout = () => {
        logout();
        // Close the menu if it's open
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };

    const toolsMenu = [
        { name: 'URL Shortener', path: '/url-shortener', icon: LinkIcon },
        { name: 'PDF Converter', path: '/pdf-converter', icon: DocumentArrowUpIcon },
        { name: 'PDF Merger', path: '/pdf-merger', icon: DocumentPlusIcon },
        { name: 'Image to PDF', path: '/image-to-pdf', icon: DocumentTextIcon },
        { name: 'Image Compressor', path: '/image-compressor', icon: PhotoIcon },
        { name: 'Circle Crop Image', path: '/circle-crop', icon: ArrowsPointingInIcon },
    ];

    const profileLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: ChartBarIcon },
        { name: 'Profile', path: '/profile', icon: UserIcon },
    ];

    return (
        <>
            {/* Top Navigation Bar */}
            <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg fixed w-full z-40">
                <div className=" mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Show sidebar toggle button only on non-home pages */}
                            {!isHomePage && (
                                <button
                                    onClick={toggleSidebar}
                                    className="mr-3 p-2 rounded-md hover:bg-white/10 bg-transparent focus:outline-none transition duration-200"
                                    aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
                                >
                                    {isSidebarOpen ? (
                                        <XMarkIcon className="h-6 w-6" />
                                    ) : (
                                        <Bars3Icon className="h-6 w-6" />
                                    )}
                                </button>
                            )}
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/" className="font-bold text-xl tracking-tight">
                                    <span className="flex items-center">
                                        <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        <span className='text-white'>MultiTool</span>
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Desktop menu */}
                        <div className="hidden md:flex items-center space-x-5">
                            <ThemeToggle />
                            {!isAuthPage && (
                                <div className="flex space-x-3">
                                    {isAuthenticated ? (
                                        <>
                                            {user && (
                                                <span className="flex items-center mr-2 text-lg cursor-pointer" onClick={()=>navigate('/profile')}>
                                                    {user.profilePicture ? (
                                                        <img
                                                            src={user.profilePicture}
                                                            alt="Profile"
                                                            className="h-10 w-10 rounded-full mr-2"
                                                        />
                                                    ) : (
                                                        <UserIcon className="h-4 w-4 mr-1" />
                                                    )}
                                                    <div className='hover:underline hover:text-orange-400'>{ user.username || user.email}</div>
                                                </span>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition duration-200 flex items-center"
                                            >
                                                <TbLogout className="mr-1" />
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                to="/login"
                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white dark:text-white hover:bg-white/20 transition duration-200"
                                            >
                                                Log In
                                            </Link>
                                            <Link
                                                to="/signup"
                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-indigo-600 hover:bg-opacity-90 transition duration-200"
                                            >
                                                Sign Up
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <ThemeToggle />
                            <button
                                onClick={toggleMenu}
                                className="ml-2 p-2 rounded-md hover:bg-white/10 dark:bg-white bg-gray-900 text-white dark:text-gray-900 focus:outline-none transition duration-200"
                                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                            >
                                <span className="sr-only">Toggle main menu</span>
                                {isMenuOpen ? (
                                    <XMarkIcon className="h-6 w-6" />
                                ) : (
                                    <Bars3Icon className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile top menu dropdown */}
                    {isMenuOpen && (
                        <div className="md:hidden absolute top-16 inset-x-0 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg rounded-b-lg z-50">
                            <div className="px-4 pt-3 pb-5 space-y-4">

                                {/* Profile Section - Only for authenticated users */}
                                {!isAuthPage && isAuthenticated && (
                                    <div className="pt-3">
                                        <h3 className="text-sm font-medium mb-3 uppercase tracking-wider opacity-80">Profile</h3>
                                        <div className="space-y-2">
                                            {profileLinks.map((link) => (
                                                <Link
                                                    key={link.path}
                                                    to={link.path}
                                                    className="flex items-center text-white dark:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition duration-200"
                                                    onClick={toggleMenu}
                                                >
                                                    <link.icon className="h-5 w-5 mr-3" />
                                                    <span className='text-white dark:text-white'>{link.name}</span>
                                                </Link>
                                            ))}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-red-700 hover:bg-red-800 transition duration-200 text-left"
                                            >
                                                <TbLogout className="h-5 w-5 mr-3" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Auth Links */}
                                {(!isAuthenticated || isAuthPage) && (
                                    <div className={`pt-3 ${!isAuthPage && !isHomePage ? 'border-t border-white/20' : ''} grid grid-cols-2 gap-3`}>
                                        <Link
                                            to="/login"
                                            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white dark:text-white hover:bg-white/20 transition duration-200 text-center"
                                            onClick={toggleMenu}
                                        >
                                            Log In
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-indigo-600 hover:bg-opacity-90 transition duration-200 text-center"
                                            onClick={toggleMenu}
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Side Navigation (Tools & Profile) */}
            <aside
                className={`
                    fixed md:fixed top-16 h-[calc(100vh-4rem)] z-40 
                    bg-white dark:bg-gray-800 shadow-xl 
                    transition-transform duration-300 ease-in-out
                    w-[280px] md:w-64
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    overflow-hidden flex flex-col
                `}
            >
                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    {/* Mobile Close Button */}
                    <div className="flex justify-between items-center mb-6 md:hidden">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-100">Tools</h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            aria-label="Close sidebar"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden md:block mb-6">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-100">Tools</h2>
                    </div>

                    {/* Tools Section */}
                    <div className="mb-8">
                        <ul className="space-y-1">
                            {toolsMenu.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`
                                            flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
                                            ${location.pathname === item.path
                                                ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                            }
                                        `}
                                        onClick={() => isMobile && setSidebarOpen(false)}
                                    >
                                        <item.icon className={`
                                            h-5 w-5 mr-3 
                                            ${location.pathname === item.path
                                                ? 'text-purple-500 dark:text-purple-300'
                                                : 'text-gray-500 dark:text-gray-400'
                                            }
                                        `} />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account Section - Conditional rendering based on auth state */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-3">
                            {isAuthenticated ? 'Profile' : 'Account'}
                        </h3>
                        <ul className="space-y-1">
                            {isAuthenticated ? (
                                // Show Profile and Dashboard when logged in
                                <>
                                    {profileLinks.map((item) => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`
                                                    flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
                                                    ${location.pathname === item.path
                                                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                    }
                                                `}
                                                onClick={() => isMobile && setSidebarOpen(false)}
                                            >
                                                <item.icon className={`
                                                    h-5 w-5 mr-3 
                                                    ${location.pathname === item.path
                                                        ? 'text-purple-500 dark:text-purple-300'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                    }
                                                `} />
                                                <span className="font-medium">{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                    <li>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200 text-indigo-50 dark:text-gray-300 bg-red-700 hover:bg-red-800 dark:hover:bg-red-800 dark:hover:bg-gray-700/50"
                                        >
                                            <TbLogout className="h-5 w-5 mr-3" />
                                            <span className="font-medium">Logout</span>
                                        </button>
                                    </li>
                                </>
                            ) : (
                                // Show Login and Signup when logged out
                                <>
                                    <li>
                                        <Link
                                            to="/login"
                                            className={`
                                                flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
                                                ${location.pathname === '/login'
                                                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-100'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                }
                                            `}
                                            onClick={() => isMobile && setSidebarOpen(false)}
                                        >
                                            <UserIcon className={`
                                                h-5 w-5 mr-3 
                                                ${location.pathname === '/login'
                                                    ? 'text-purple-500 dark:text-purple-300'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                }
                                            `} />
                                            <span className="font-medium">Log In</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/signup"
                                            className={`
                                                flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
                                                ${location.pathname === '/signup'
                                                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                }
                                            `}
                                            onClick={() => isMobile && setSidebarOpen(false)}
                                        >
                                            <svg className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
                                            </svg>
                                            <span className="font-medium">Sign Up</span>
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">MultiTool v1.0</span>
                        <span className="text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full">
                            Beta
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Navbar; 
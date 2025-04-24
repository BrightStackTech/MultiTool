import { Link, useLocation } from 'react-router-dom';
import {
    LinkIcon,
    DocumentArrowUpIcon,
    DocumentPlusIcon,
    PhotoIcon,
    ArrowsPointingInIcon,
    DocumentTextIcon,
    XMarkIcon,
    UserIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { useSidebar } from '../contexts/SidebarContext';
import { useEffect } from 'react';

const Sidebar = () => {
    const location = useLocation();
    const { isSidebarOpen, closeSidebar } = useSidebar();

    // Close sidebar on location change (for mobile) and always on homepage
    useEffect(() => {
        // Always close sidebar on homepage
        if (location.pathname === '/') {
            closeSidebar();
        }
        // Only close on other pages if mobile
        else if (location.pathname !== '/') {
            closeSidebar();
        }
    }, [location.pathname, closeSidebar]);

    const toolsMenu = [
        { name: 'URL Shortener', path: '/url-shortener', icon: LinkIcon },
        { name: 'PDF Converter', path: '/pdf-converter', icon: DocumentArrowUpIcon },
        { name: 'PDF Merger', path: '/pdf-merger', icon: DocumentPlusIcon },
        { name: 'Image to PDF', path: '/image-to-pdf', icon: DocumentTextIcon },
        { name: 'Image Compressor', path: '/image-compressor', icon: PhotoIcon },
        { name: 'Circle Crop Image', path: '/circle-crop', icon: ArrowsPointingInIcon },
    ];

    const profileMenu = [
        { name: 'Dashboard', path: '/dashboard', icon: ChartBarIcon },
        { name: 'Profile', path: '/profile', icon: UserIcon },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static top-16 md:top-0 h-[calc(100vh-4rem)] md:h-screen z-50 
                    bg-white dark:bg-gray-800 shadow-xl md:shadow-md 
                    transition-transform duration-300 ease-in-out
                    w-[280px] md:w-64 
                    ${location.pathname === '/' ? '-translate-x-full' :
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    overflow-hidden flex flex-col
                `}
            >
                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    {/* Mobile Close Button */}
                    <div className="flex justify-between items-center mb-6 md:hidden">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-100">Tools</h2>
                        <button
                            title='Close Sidebar'
                            onClick={closeSidebar}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
                                        onClick={() => isSidebarOpen && closeSidebar()}
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

                    {/* Profile Section */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-3">
                            Profile
                        </h3>
                        <ul className="space-y-1">
                            {profileMenu.map((item) => (
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
                                        onClick={() => isSidebarOpen && closeSidebar()}
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

export default Sidebar; 
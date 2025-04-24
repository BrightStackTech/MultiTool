import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showImageDialog, setShowImageDialog] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading profile...</div>;
    }

    const handleLogout = () => {
        logout();
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };

    // Use profile picture from user object or fallback to a default avatar
    const profilePicture = user?.profilePicture || 'https://res.cloudinary.com/dvb5mesnd/image/upload/v1741339315/Screenshot_2025-03-07_145028-removebg-preview_mqw8by.png';

    // Use display name or username
    const displayName = user?.username || '';

    const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setShowImageDialog(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Profile</h1>

            <div className="mb-6 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="p-6 flex flex-col items-center space-y-4 md:space-x-6">
                    <div className="p-6 flex flex-col items-center justify-center space-y-4">
                        <img
                            src={profilePicture}
                            alt="Profile Avatar"
                            className="h-32 w-32 sm:w-56 sm:h-56 rounded-full border-4 border-indigo-100 dark:border-indigo-900 shadow-sm cursor-pointer"
                            onClick={() => setShowImageDialog(true)}
                        />
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{displayName}</h2>
                        <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Google account connected: {user?.googleId ? 'Yes' : 'No'}
                        </p>
                        <div className="w-full mt-8 flex-row justify-between items-center">
                            <button
                                onClick={() => navigate('/edit-profile')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition mr-2"
                            >
                                Edit Profile
                            </button>      
                            <button
                                onClick={() => navigate('/change-password')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                            >
                                Update Password
                            </button>   
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 mt-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-md hover:bg-indigo-700 transition"
                        >
                            Logout
                        </button>   
                    </div>
                </div>
            </div>
            {showImageDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
                    onClick={handleDialogClick}
                >
                    <div className="relative">
                        <img
                            src={profilePicture}
                            alt="Profile Large"
                            className="w-[300px] h-[300px] rounded-lg shadow-lg"
                        />
                        <button
                            className="absolute top-2 right-2 text-white bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition"
                            onClick={() => setShowImageDialog(false)}
                            aria-label="Close"
                        >
                            <FaTimes size={22} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile; 
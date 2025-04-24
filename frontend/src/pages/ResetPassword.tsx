import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (confirmPassword && newPassword !== confirmPassword) {
            setConfirmError('Passwords do not match.');
        } else {
            setConfirmError('');
        }
        // Password length validation
        if (newPassword && newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long.');
        } else {
            setPasswordError(null);
        }
    }, [confirmPassword, newPassword]);

    const isFormValid = () => {
        return (
            newPassword &&
            confirmPassword &&
            newPassword === confirmPassword &&
            !passwordError
        );
    };

    const handleSubmit = async () => {
        if (!token) {
            toast.error('Invalid or expired reset link.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/auth/reset-password`,
                { token, password: newPassword }
            );
            toast.success(response.data.message || 'Password reset successful!');
            navigate('/login');
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error || 'Error resetting password'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid()) {
            toast.error('Passwords do not match.');
            return;
        }
        setShowConfirmDialog(true);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
            <Card title="Reset Password" className="max-w-md w-full p-6">
                <form onSubmit={onFormSubmit} className="space-y-4">
                    {/* New Password Field */}
                    <div className="relative">
                        <label className="block text-lg font-semibold mb-1 dark:text-white">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                title="New Password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                                autoFocus
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer z-10 bg-transparent border-0 focus:outline-none"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                tabIndex={-1}
                            >
                                {showNewPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                            </button>
                        </div>
                        {passwordError && <small className="text-red-500">{passwordError}</small>}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="relative">
                        <label className="block text-lg font-semibold mb-1 dark:text-white">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                title="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer z-10 bg-transparent border-0 focus:outline-none"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                            </button>
                        </div>
                        {confirmError && <small className="text-red-500">{confirmError}</small>}
                    </div>

                    <button
                        type="submit"
                        disabled={!isFormValid() || isLoading}
                        className={`w-full py-3 rounded-lg text-white font-medium transition ${isFormValid() && !isLoading
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                {/* Confirmation Dialog */}
                {showConfirmDialog && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg">
                            <p className="mb-4 text-lg">Are you sure you want to reset your password?</p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmDialog(false);
                                        handleSubmit();
                                    }}
                                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition"
                                    disabled={isLoading}
                                >
                                    Confirm Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ResetPassword;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';

const ChangePassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [emailExists, setEmailExists] = useState<boolean | null>(null);
    const [_isGoogleSignIn, setIsGoogleSignIn] = useState(false);
    const navigate = useNavigate();

    // Debounced email existence check
    useEffect(() => {
        if (!email) {
            setEmailError('');
            setEmailExists(null);
            setIsGoogleSignIn(false);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Invalid email format');
            setEmailExists(null);
            setIsGoogleSignIn(false);
            return;
        }
        const timeout = setTimeout(async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/auth/check-email?email=${encodeURIComponent(email)}&t=${Date.now()}`
                );
                if (res.data.exists) {
                    if (res.data.googleSignIn) {
                        setEmailError(
                            res.data.message ||
                            "This account uses Google sign-in. Use 'Sign in with Google'."
                        );
                        setEmailExists(false);
                        setIsGoogleSignIn(true);
                    } else {
                        setEmailError('');
                        setEmailExists(true);
                        setIsGoogleSignIn(false);
                    }
                } else {
                    setEmailError('This email is not registered.');
                    setEmailExists(false);
                    setIsGoogleSignIn(false);
                }
            } catch {
                setEmailError('Error checking email');
                setEmailExists(null);
                setIsGoogleSignIn(false);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [email]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setCaptchaVerified(false); // Reset captcha if email changes
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailExists || !captchaVerified) return;
        setIsLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/auth/forgot-password`, { email });
            toast.success(
                "If this email is registered, a reset link has been sent. Please check your inbox (and spam folder)."
            );
            navigate('/login');
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                "Error sending reset email. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCaptchaChange = (value: string | null) => {
        setCaptchaVerified(!!value);
    };

    return (
        <div className="flex justify-center items-center mt-36 bg-gray-50 dark:bg-gray-900 px-4">
            <Card title="Change Password" className="max-w-md w-full p-6">
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <label htmlFor="email" className="block text-lg font-semibold mb-1 dark:text-white">
                        Enter your registered email to reset your password
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        placeholder="yourname@example.com"
                        autoFocus
                    />
                    {emailError && (
                        <small className="text-red-500">{emailError}</small>
                    )}
                    {/* Show reCAPTCHA only if email exists, is valid, and there is no error */}
                    {emailExists && !emailError && (
                        <div className="mt-4">
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={handleCaptchaChange}
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={
                            isLoading || !emailExists || !captchaVerified || !!emailError
                        }
                        className={`w-full py-3 rounded-lg text-white font-medium transition ${emailExists && captchaVerified && !emailError
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        disabled={isLoading}
                        className="w-full py-3 rounded-lg mt-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                        Cancel
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default ChangePassword;
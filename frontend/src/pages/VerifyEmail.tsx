import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_SERVER_URL}/api/auth/verify-email/${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    setStatus('success');
                    setMessage(data.message);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('Verification failed. Please try again.');
            });
    }, [token]);

    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-800 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
            {status === 'pending' && <p>Verifying your email...</p>}
            {status === 'success' && (
                <>
                    <p className="text-green-600 mb-4">{message}</p>
                    <Link to="/login" className="text-indigo-600 font-medium">Go to Login</Link>
                </>
            )}
            {status === 'error' && (
                <>
                    <p className="text-red-600 mb-4">{message}</p>
                    <Link to="/signup" className="text-indigo-600 font-medium">Sign Up Again</Link>
                </>
            )}
        </div>
    );
};

export default VerifyEmail;
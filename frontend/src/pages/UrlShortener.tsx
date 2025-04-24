import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import { shortenUrl } from '../api/api';

const UrlShortener: React.FC = () => {
    const [url, setUrl] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url) {
            toast.error('Please enter a URL');
            return;
        }

        try {
            setLoading(true);
            const result = await shortenUrl(url);
            setShortUrl(result.shortUrl);
            toast.success('URL shortened successfully!');
        } catch (error) {
            console.error('Error shortening URL:', error);
            toast.error('Failed to shorten URL');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shortUrl)
            .then(() => {
                toast.success('Copied to clipboard!');
            })
            .catch((err) => {
                console.error('Failed to copy:', err);
                toast.error('Failed to copy to clipboard');
            });
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">URL Shortener</h1>

            <Card title="Shorten Your URL">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Enter a long URL
                        </label>
                        <input
                            type="url"
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/very/long/url/that/needs/shortening"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md text-black dark:text-white font-medium transition ${loading
                            ? 'bg-blue-200 dark:bg-blue-700 cursor-not-allowed'
                            : 'bg-blue-300 dark:bg-blue-800 hover:bg-blue-400 dark:hover:bg-blue-700'
                            }`}
                    >
                        {loading ? 'Shortening...' : 'Shorten URL'}
                    </button>
                </form>

                {shortUrl && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <h3 className="text-md font-medium dark:text-gray-100 mb-2 text-gray-700">Your shortened URL:</h3>
                        <div className="flex items-center">
                            <input
                                title='Shortened URL'
                                type="text"
                                value={shortUrl}
                                readOnly
                                className="flex-1 p-2 border bg-transparent border-gray-300 rounded-l-md focus:outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default UrlShortener; 
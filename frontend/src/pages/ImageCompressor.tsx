import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import FileUpload from '../components/FileUpload';
import { compressImage } from '../api/api';

const ImageCompressor: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [quality, setQuality] = useState(80);
    const [format, setFormat] = useState('jpeg');
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [compressedImageUrl, setCompressedImageUrl] = useState<string | null>(null);
    const [compressionStats, setCompressionStats] = useState<{
        originalSize: number;
        compressedSize: number;
        savingsPercent: number;
    } | null>(null);

    const handleImageSelect = (file: File) => {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setSelectedImage(file);
        setCompressedImageUrl(null);
        setCompressionStats(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuality(parseInt(e.target.value, 10));
    };

    const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormat(e.target.value);
    };

    const handleCompress = async () => {
        if (!selectedImage) {
            toast.error('Please select an image');
            return;
        }

        try {
            setLoading(true);
            const compressedImageBlob = await compressImage(selectedImage, quality, format);

            // Create download URL
            const downloadUrl = URL.createObjectURL(compressedImageBlob);
            setCompressedImageUrl(downloadUrl);

            // Calculate compression stats
            const originalSize = selectedImage.size;
            const compressedSize = compressedImageBlob.size;
            const savingsPercent = ((originalSize - compressedSize) / originalSize) * 100;

            setCompressionStats({
                originalSize,
                compressedSize,
                savingsPercent
            });

            toast.success('Image compressed successfully!');
        } catch (error: any) {
            console.error('Error compressing image:', error);
            toast.error('Failed to compress image');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (compressedImageUrl) {
            const link = document.createElement('a');
            link.href = compressedImageUrl;
            link.download = `compressed-image.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">Image Compressor</h1>

            <Card title="Compress Your Images">
                <div className="mb-6">
                    <FileUpload
                        onFileSelect={handleImageSelect}
                        accept="image/*"
                        label="Select Image"
                    />
                </div>

                {previewUrl && (
                    <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-700 mb-2 dark:text-white">Original Image</h3>
                        <div className="flex justify-center bg-gray-100 dark:bg-gray-700 rounded-md p-4">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-h-64 max-w-full object-contain"
                            />
                        </div>
                        {selectedImage && (
                            <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
                                Size: {formatBytes(selectedImage.size)}
                            </p>
                        )}
                    </div>
                )}

                {selectedImage && (
                    <>
                        <div className="mb-6">
                            <h3 className="text-md font-medium text-gray-700 mb-2 dark:text-white">Compression Settings</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                                        Quality: {quality}%
                                    </label>
                                    <input
                                        type="range"
                                        id="quality"
                                        min="1"
                                        max="100"
                                        value={quality}
                                        onChange={handleQualityChange}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                                        Format
                                    </label>
                                    <select
                                        id="format"
                                        value={format}
                                        onChange={handleFormatChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
                                    >
                                        <option value="jpeg">JPEG</option>
                                        <option value="png">PNG</option>
                                        <option value="webp">WebP</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCompress}
                            disabled={loading}
                            className={`w-full py-2 px-4 rounded-md text-black dark:text-white font-medium transition ${loading
                                ? 'bg-purple-200 dark:bg-purple-800 cursor-not-allowed'
                                : 'bg-purple-300 dark:bg-purple-800 hover:bg-purple-400 dark:hover:bg-purple-700'
                                }`}
                        >
                            {loading ? 'Compressing...' : 'Compress Image'}
                        </button>
                    </>
                )}

                {compressedImageUrl && compressionStats && (
                    <div className="mt-8">
                        <h3 className="text-md font-medium text-gray-700 mb-2">Compressed Image</h3>
                        <div className="flex justify-center bg-gray-100 rounded-md p-4 mb-4">
                            <img
                                src={compressedImageUrl}
                                alt="Compressed"
                                className="max-h-64 max-w-full object-contain"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center">
                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-500">Original Size</p>
                                <p className="font-medium">{formatBytes(compressionStats.originalSize)}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-500">Compressed Size</p>
                                <p className="font-medium">{formatBytes(compressionStats.compressedSize)}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-500">Savings</p>
                                <p className="font-medium">{compressionStats.savingsPercent.toFixed(2)}%</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleDownload}
                            className="w-full py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition"
                        >
                            Download Compressed Image
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ImageCompressor; 
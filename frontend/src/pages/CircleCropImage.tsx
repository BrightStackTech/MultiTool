import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import FileUpload from '../components/FileUpload';
import Cropper from 'react-easy-crop';
import { circleCropImage } from '../api/api';

const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(
                    pixelCrop.width / 2,
                    pixelCrop.height / 2,
                    Math.min(pixelCrop.width, pixelCrop.height) / 2,
                    0,
                    2 * Math.PI
                );
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(
                    image,
                    pixelCrop.x,
                    pixelCrop.y,
                    pixelCrop.width,
                    pixelCrop.height,
                    0,
                    0,
                    pixelCrop.width,
                    pixelCrop.height
                );
                ctx.restore();
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas is empty'));
                }, 'image/png');
            } else {
                reject(new Error('Canvas context not found'));
            }
        };
        image.onerror = (error) => reject(error);
    });
};

const CircleCropImage: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Cropper states
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const handleImageSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        setSelectedImage(file);
        setCroppedImageUrl(null);

        const reader = new FileReader();
        reader.onload = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = (_: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    };

    const handleCrop = async () => {
        if (!previewUrl || !croppedAreaPixels) {
            toast.error('Please select and crop an image');
            return;
        }
        try {
            setLoading(true);
            // 1. Crop on client
            const croppedImageBlob = await getCroppedImg(previewUrl, croppedAreaPixels);

            // 2. Convert Blob to File (so backend gets a filename)
            const croppedFile = new File([croppedImageBlob], selectedImage?.name || 'circle-cropped-image.png', { type: 'image/png' });

            // 3. Send to backend (this will save to dashboard if logged in)
            const savedBlob = await circleCropImage(croppedFile);

            // 4. Show result
            const croppedUrl = URL.createObjectURL(savedBlob);
            setCroppedImageUrl(croppedUrl);

            toast.success('Image cropped and saved to dashboard!');
        } catch (error: any) {
            console.error('Error cropping image:', error);
            toast.error('Failed to crop or save image');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (croppedImageUrl) {
            const link = document.createElement('a');
            link.href = croppedImageUrl;
            link.download = 'circle-cropped-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">Circle Crop Image</h1>
            <Card title="Crop Your Image in a Perfect Circle">
                <div className="mb-6">
                    <FileUpload
                        onFileSelect={handleImageSelect}
                        accept="image/*"
                        label="Select Image"
                    />
                </div>

                {previewUrl && (
                    <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Adjust Crop Area</h3>
                        <div className="flex justify-center bg-gray-100 rounded-md p-4" style={{ height: 300 }}>
                            <div className="relative w-72 h-72 bg-black">
                                <Cropper
                                    image={previewUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <input
                                title='Zoom'
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={e => setZoom(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleCrop}
                            disabled={loading}
                            className={`w-full mt-4 py-2 px-4 rounded-md text-black dark:text-white font-medium transition ${loading
                                ? 'bg-indigo-200 dark:bg-indigo-800 cursor-not-allowed'
                                : 'bg-indigo-300 dark:bg-indigo-800 hover:bg-indigo-400 dark:hover:bg-indigo-700'
                                }`}
                        >
                            {loading ? 'Cropping...' : 'Crop Image in Circle'}
                        </button>
                    </div>
                )}

                {croppedImageUrl && (
                    <div className="mt-8">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Circle Cropped Image</h3>
                        <div className="flex justify-center bg-gray-100 rounded-md p-4 mb-4">
                            <div className="rounded-full overflow-hidden" style={{ width: '250px', height: '250px' }}>
                                <img
                                    src={croppedImageUrl}
                                    alt="Circle Cropped"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="w-full py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition"
                        >
                            Download Circle Cropped Image
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CircleCropImage;
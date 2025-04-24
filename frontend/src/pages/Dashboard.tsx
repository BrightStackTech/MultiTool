import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { DocumentTextIcon, PhotoIcon, LinkIcon, TrashIcon, ClipboardIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { getUserUrls, deleteUrl, getUserImages, deleteImage, getUserPdfs, deletePdf } from '../api/api';
import { toast } from 'react-toastify';
import StorageConfirmationDialog from '../components/StorageConfirmationDialog';
import StorageUsageBar from '../components/StorageUsageBar';

// URL type
type UserUrl = {
    id: string;
    originalUrl: string;
    shortUrl: string;
    shortId: string;
    visitCount: number;
    createdAt: string;
};

// Image type
type UserImage = {
    id: string;
    originalName: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    compressionType: string;
    createdAt: string;
};

// PDF type
type UserPdf = {
    id: string;
    originalName: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    processingType: string;
    createdAt: string;
};

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const Dashboard: React.FC = () => {
    const { isAuthenticated, user, updatePreferences } = useAuth();
    const [urls, setUrls] = useState<UserUrl[]>([]);
    const [images, setImages] = useState<UserImage[]>([]);
    const [pdfs, setPdfs] = useState<UserPdf[]>([]);
    const [loadingUrls, setLoadingUrls] = useState(true);
    const [loadingImages, setLoadingImages] = useState(true);
    const [loadingPdfs, setLoadingPdfs] = useState(true);
    const [saveFilesToDashboard, setSaveFilesToDashboard] = useState(false);
    const [showStorageConfirmDialog, setShowStorageConfirmDialog] = useState(false);

    // Fetch user data on component mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserUrls();
            fetchUserImages();
            fetchUserPdfs();

            // Set initial preference state if available in user object
            if (user && user.saveFilesToDashboard !== undefined) {
                setSaveFilesToDashboard(user.saveFilesToDashboard);
            }
        } else {
            setLoadingUrls(false);
            setLoadingImages(false);
            setLoadingPdfs(false);
        }
    }, [isAuthenticated, user]);

    // Function to fetch user URLs
    const fetchUserUrls = async () => {
        try {
            setLoadingUrls(true);
            const fetchedUrls = await getUserUrls();
            setUrls(fetchedUrls);
        } catch (error) {
            console.error('Error fetching URLs:', error);
            toast.error('Failed to fetch your URLs');
        } finally {
            setLoadingUrls(false);
        }
    };

    // Function to fetch user images
    const fetchUserImages = async () => {
        try {
            setLoadingImages(true);
            const fetchedImages = await getUserImages();
            setImages(fetchedImages);
        } catch (error) {
            console.error('Error fetching images:', error);
            toast.error('Failed to fetch your images');
        } finally {
            setLoadingImages(false);
        }
    };

    // Function to fetch user PDFs
    const fetchUserPdfs = async () => {
        try {
            setLoadingPdfs(true);
            const fetchedPdfs = await getUserPdfs();
            setPdfs(fetchedPdfs);
        } catch (error) {
            console.error('Error fetching PDFs:', error);
            toast.error('Failed to fetch your PDFs');
        } finally {
            setLoadingPdfs(false);
        }
    };

    // Function to delete a URL
    const handleDeleteUrl = async (id: string) => {
        try {
            await deleteUrl(id);
            // Remove the deleted URL from the state
            setUrls(urls.filter(url => url.id !== id));
            toast.success('URL deleted successfully');
        } catch (error) {
            console.error('Error deleting URL:', error);
            toast.error('Failed to delete URL');
        }
    };

    // Function to delete an image
    const handleDeleteImage = async (id: string) => {
        try {
            await deleteImage(id);
            // Remove the deleted image from the state
            setImages(images.filter(image => image.id !== id));
            toast.success('Image deleted successfully');
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Failed to delete image');
        }
    };

    // Function to delete a PDF
    const handleDeletePdf = async (id: string) => {
        try {
            await deletePdf(id);
            // Remove the deleted PDF from the state
            setPdfs(pdfs.filter(pdf => pdf.id !== id));
            toast.success('PDF deleted successfully');
        } catch (error) {
            console.error('Error deleting PDF:', error);
            toast.error('Failed to delete PDF');
        }
    };

    // Function to copy a URL to clipboard
    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url)
            .then(() => {
                toast.success('Copied to clipboard!');
            })
            .catch((err) => {
                console.error('Failed to copy:', err);
                toast.error('Failed to copy URL');
            });
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Truncate long text
    const truncateText = (text: string, maxLength = 50) => {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get image type display name
    const getImageTypeDisplay = (type: string) => {
        switch (type) {
            case 'compression': return 'Compressed';
            case 'circle-crop': return 'Circle Cropped';
            default: return type;
        }
    };

    // Get PDF type display name
    const getPdfTypeDisplay = (type: string) => {
        switch (type) {
            case 'conversion': return 'Conversion';
            case 'merge': return 'Merged PDF';
            case 'image-to-pdf': return 'Image to PDF';
            default: return type;
        }
    };

    // Get file icon based on file type
    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) {
            return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
        } else if (fileType.includes('word') || fileType.includes('docx')) {
            return <DocumentTextIcon className="h-6 w-6 text-blue-500" />;
        } else {
            return <DocumentTextIcon className="h-6 w-6 text-gray-500" />;
        }
    };

    // Handle download file
    const handleDownload = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url); // removed credentials: 'include'
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(link.href), 1000);
        } catch (error) {
            toast.error('Failed to download file');
        }
    };

    const handleViewFile = (url: string, fileName: string) => {
        const MicrosoftFileExtensions = ['.doc', '.docx', '.ppt', '.xlsx', '.pptx', '.xls'];
        const isMicrosoftFile = MicrosoftFileExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
        const officeViewer = "https://view.officeapps.live.com/op/view.aspx?src=";
        if (isMicrosoftFile) {
            window.open(`${officeViewer}${encodeURIComponent(url)}`, '_blank');
        } else {
            window.open(url, '_blank');
        }
    };

    // Function to toggle file saving preference
    const handleToggleFileSaving = async () => {
        // If we're enabling storage, show confirmation dialog first
        if (!saveFilesToDashboard) {
            setShowStorageConfirmDialog(true);
            return;
        }

        // If we're disabling storage, do it directly
        try {
            await updatePreferences({ saveFilesToDashboard: false });
            setSaveFilesToDashboard(false);
            toast.success('Files will no longer be saved to your dashboard');
        } catch (error) {
            console.error('Error updating preferences:', error);
            toast.error('Failed to update preferences');
        }
    };

    // Function to handle confirmation from dialog
    const handleStorageConfirmed = async () => {
        try {
            await updatePreferences({ saveFilesToDashboard: true });
            setSaveFilesToDashboard(true);
            toast.success('Files will now be saved to your dashboard');
        } catch (error) {
            console.error('Error updating preferences:', error);
            toast.error('Failed to update preferences');
        }
    };

    // Calculate total storage used (in bytes)
    const calculateTotalStorageUsed = () => {
        let totalSize = 0;

        // Add PDF files size
        pdfs.forEach(pdf => {
            totalSize += pdf.fileSize || 0;
        });

        return totalSize;
    };

    // Total available storage in bytes (100MB)
    const maxStorage = 100 * 1024 * 1024;

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">My Dashboard</h1>

            <Card title="Recent Activity">
                <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-indigo-50 p-1 mb-6 dark:bg-gray-700">
                        <Tab
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center',
                                    'focus:outline-none',
                                    selected
                                        ? 'bg-purple-800 text-white shadow'
                                        : 'text-black dark:text-white dark:bg-gray-800 hover:text-indigo-700 hover:bg-white/[0.12] bg-white '
                                )
                            }
                        >
                            <PhotoIcon className="h-5 w-5 mr-2" />
                            Images
                        </Tab>
                        <Tab
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center',
                                    'focus:outline-none',
                                    selected
                                        ? 'bg-purple-800 text-white shadow'
                                        : 'text-black dark:text-white dark:bg-gray-800 hover:text-indigo-700 hover:bg-white/[0.12] bg-white '
                                )
                            }
                        >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Files
                        </Tab>
                        <Tab
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center',
                                    'focus:outline-none',
                                    selected
                                        ? 'bg-purple-800 text-white shadow'
                                        : 'text-black dark:text-white dark:bg-gray-800 hover:text-indigo-700 hover:bg-white/[0.12] bg-white '
                                )
                            }
                        >
                            <LinkIcon className="h-5 w-5 mr-2" />
                            URLs
                        </Tab>
                    </Tab.List>
                    <Tab.Panels>
                        {/* Images Panel */}
                        <Tab.Panel>
                            <div className="overflow-x-auto">
                                {loadingImages ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : images.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>You haven't processed any images yet.</p>
                                        <p className="mt-2">Try the Image tools to compress or crop some images!</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Preview
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Date
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Size
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {images.map((image) => (
                                                <tr key={image.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-12 w-12 overflow-hidden rounded-md">
                                                            <img
                                                                src={image.fileUrl}
                                                                alt={image.originalName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {truncateText(image.originalName, 30)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                                            {getImageTypeDisplay(image.compressionType)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {formatDate(image.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {formatFileSize(image.fileSize)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                            onClick={() => window.open(image.fileUrl, '_blank')}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                            title="View"
                                                            >
                                                            <EyeIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(image.fileUrl, image.fileName)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                title="Download"
                                                            >
                                                                <ArrowDownTrayIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteImage(image.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Files Panel */}
                        <Tab.Panel>
                            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex-1">
                                    <h3 className="text-md font-medium text-gray-800 dark:text-white mb-1">Save files to dashboard</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {saveFilesToDashboard
                                            ? "Files (PDFs, Word docs) are being saved to your dashboard for later access."
                                            : "Files are not being saved. Enable to keep your files available after conversion."}
                                    </p>
                                </div>
                                <div className="mt-2 sm:mt-0">
                                    {saveFilesToDashboard ? (
                                        <button
                                            onClick={handleToggleFileSaving}
                                            className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition"
                                        >
                                            Disable
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleToggleFileSaving}
                                            className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition"
                                        >
                                            Enable
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Storage Confirmation Dialog */}
                            <StorageConfirmationDialog
                                isOpen={showStorageConfirmDialog}
                                onClose={() => setShowStorageConfirmDialog(false)}
                                onConfirm={handleStorageConfirmed}
                            />

                            <div className="overflow-x-auto">
                                {loadingPdfs ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : pdfs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        {saveFilesToDashboard ? (
                                            <>
                                                <p>You haven't processed any files yet.</p>
                                                <p className="mt-2">Try the PDF tools to convert or merge some files!</p>
                                            </>
                                        ) : (
                                            <>
                                                <p>File saving is currently disabled.</p>
                                                <p className="mt-2">Enable the toggle above to save your files after processing.</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Process
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Date
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Size
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pdfs.map((pdf) => (
                                                <tr key={pdf.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {getFileIcon(pdf.fileType)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {truncateText(pdf.originalName, 30)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                                            {getPdfTypeDisplay(pdf.processingType)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {formatDate(pdf.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {formatFileSize(pdf.fileSize)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleViewFile(pdf.fileUrl, pdf.fileName)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                title="View"
                                                            >
                                                                <EyeIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(pdf.fileUrl, pdf.fileName)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                title="Download"
                                                            >
                                                                <ArrowDownTrayIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePdf(pdf.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </Tab.Panel>

                        {/* URLs Panel */}
                        <Tab.Panel>
                            <div className="overflow-x-auto">
                                {loadingUrls ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : urls.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>You haven't created any short URLs yet.</p>
                                        <p className="mt-2">Try the URL Shortener to create some!</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Short URL
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Original URL
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Visits
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Created
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-700 dark:text-white">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {urls.map((url) => (
                                                <tr key={url.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                            {url.shortUrl}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            {truncateText(url.originalUrl)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {url.visitCount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {formatDate(url.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => copyToClipboard(url.shortUrl)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                title="Copy URL"
                                                            >
                                                                <ClipboardIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUrl(url.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </Card>
            <Card title="Files Storage Usage" className="mt-6">
                {isAuthenticated && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <StorageUsageBar
                            usedStorage={calculateTotalStorageUsed()}
                            maxStorage={maxStorage}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Dashboard; 
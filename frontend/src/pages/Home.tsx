import { Link } from 'react-router-dom';
import {
    LinkIcon,
    DocumentArrowUpIcon,
    DocumentPlusIcon,
    PhotoIcon,
    ArrowsPointingInIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const Home = () => {
    const tools = [
        {
            id: 'url-shortener',
            name: 'URL Shortener',
            description: 'Shorten long URLs to make them easier to share',
            icon: LinkIcon,
            path: '/url-shortener',
            color: 'bg-blue-200 dark:bg-blue-800',
            iconColor: 'text-blue-500 bg-white dark:bg-blue-900 dark:text-white'
        },
        {
            id: 'pdf-converter',
            name: 'PDF Converter',
            description: 'Convert between PDF and Word documents',
            icon: DocumentArrowUpIcon,
            path: '/pdf-converter',
            color: 'bg-red-200 dark:bg-red-800',
            iconColor: 'text-red-500 bg-white dark:bg-red-900 dark:text-white'
        },
        {
            id: 'pdf-merger',
            name: 'PDF Merger',
            description: 'Combine multiple PDF files into a single document',
            icon: DocumentPlusIcon,
            path: '/pdf-merger',
            color: 'bg-orange-200 dark:bg-orange-800',
            iconColor: 'text-orange-500 bg-white dark:bg-orange-900 dark:text-white'
        },
        {
            id: 'image-to-pdf',
            name: 'Image to PDF',
            description: 'Convert your images to PDF format',
            icon: DocumentTextIcon,
            path: '/image-to-pdf',
            color: 'bg-green-200 dark:bg-green-800',
            iconColor: 'text-green-500 bg-white dark:bg-green-900 dark:text-white'
        },
        {
            id: 'image-compressor',
            name: 'Image Compressor',
            description: 'Reduce image file sizes without losing quality',
            icon: PhotoIcon,
            path: '/image-compressor',
            color: 'bg-purple-200 dark:bg-purple-800',
            iconColor: 'text-purple-500 bg-white dark:bg-purple-900 dark:text-white'
        },
        {
            id: 'circle-crop',
            name: 'Circle Crop Image',
            description: 'Crop your images into perfect circles',
            icon: ArrowsPointingInIcon,
            path: '/circle-crop',
            color: 'bg-indigo-200 dark:bg-indigo-800',
            iconColor: 'text-indigo-500 bg-white dark:bg-indigo-900 dark:text-white'
        }
    ];

    return (
        <div className="w-full px-4 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-indigo-200 mb-4 ">MultiTool</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-300">
                    Your all-in-one solution for file conversions, URL shortening, and image processing
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Link
                        to={tool.path}
                        key={tool.id}
                        className="block transition transform hover:scale-105 hover:shadow-lg"
                    >
                        <div className={`rounded-lg shadow-md overflow-hidden h-full ${tool.color} border border-gray-100`}>
                            <div className="p-6">
                                <div className={`w-12 h-12 rounded-lg ${tool.iconColor} flex items-center justify-center mb-4`}>
                                    <tool.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">{tool.name}</h3>
                                <p className="text-gray-600 dark:text-gray-200">{tool.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-16 text-center">
                <p className="text-gray-600 dark:text-gray-300">
                    Not yet a member? <Link to="/signup" className="text-indigo-600 font-medium">Sign up</Link> to save your work
                </p>
                <p className="text-gray-600 mt-2 dark:text-gray-300">
                    Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Home; 
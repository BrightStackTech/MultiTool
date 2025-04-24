import axios, { AxiosError, AxiosResponse } from 'axios';

// Base URLs
const API_URL = `${import.meta.env.VITE_SERVER_URL}/api`;
const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}`;

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        // Check if error is due to token expiration
        if (error.response?.status === 401 &&
            error.response?.data &&
            (error.response.data as any).error === 'Token expired') {

            // Dispatch a custom event that the auth context can listen for
            window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
        return Promise.reject(error);
    }
);

// Generic fetch function with error handling
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            // Remove credentials mode for now
            // credentials: 'include',
        });

        // Handle non-2xx responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle token expiration
            if (response.status === 401 && errorData.error === 'Token expired') {
                window.dispatchEvent(new CustomEvent('auth:token-expired'));
            }

            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        // Return JSON if content exists, otherwise return empty object
        return response.headers.get('content-length') !== '0'
            ? await response.json()
            : {};
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Auth-related API calls
export const authApi = {
    login: (email: string, password: string) =>
        fetchApi('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (username: string, email: string, password: string) =>
        fetchApi('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        }),

    googleAuth: (token: string, isSignup = false) =>
        fetchApi('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ token, isSignup }),
        }),

    logout: () =>
        fetchApi('/api/auth/logout', {
            method: 'POST',
        }),

    updatePreferences: (preferences: { saveFilesToDashboard: boolean }, token: string) =>
        fetchApi('/api/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }),
};

// Shorten URL
export const shortenUrl = async (originalUrl: string) => {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Add auth header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await api.post('/url/shorten', { originalUrl }, { headers });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Get user's URLs
export const getUserUrls = async () => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await api.get('/url/user/urls', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.urls;
    } catch (error) {
        throw error;
    }
};

// Delete a URL
export const deleteUrl = async (id: string) => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await api.delete(`/url/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};

// PDF to Word conversion
export const convertPdfToWord = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Get authentication token if available
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'multipart/form-data'
        };

        // Add token to headers if available (for storing in db)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`Converting PDF to Word: ${file.name} (${file.size} bytes)`);

        const response = await api.post('/pdf/pdf-to-word', formData, {
            headers,
            responseType: 'blob',
            timeout: 120000, // 120 second timeout
        });

        if (response.data.size === 0) {
            throw new Error('Received empty Word file');
        }

        console.log(`PDF to Word conversion successful. Received ${response.data.size} bytes`);

        // Create download link
        return {
            blob: response.data,
            fileName: file.name.replace('.pdf', '.docx'),
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
    } catch (error) {
        console.error('PDF to Word conversion error:', error);
        throw error;
    }
};

// Word to PDF conversion
export const convertWordToPdf = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Get authentication token if available
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'multipart/form-data'
        };

        // Add token to headers if available (for storing in db)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`Converting Word to PDF: ${file.name} (${file.size} bytes)`);

        const response = await api.post('/pdf/word-to-pdf', formData, {
            headers,
            responseType: 'blob',
            timeout: 120000, // 120 second timeout
        });

        if (response.data.size === 0) {
            throw new Error('Received empty PDF file');
        }

        console.log(`Word to PDF conversion successful. Received ${response.data.size} bytes`);

        // Create download link
        return {
            blob: response.data,
            fileName: file.name.replace(/\.docx?$/, '.pdf'),
            fileType: 'application/pdf'
        };
    } catch (error) {
        console.error('Word to PDF conversion error:', error);
        throw error;
    }
};

// Image to PDF conversion
export const convertImageToPdf = async (image: File) => {
    try {
        const formData = new FormData();
        formData.append('image', image);

        // Get authentication token if available
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'multipart/form-data'
        };

        // Add token to headers if available (for storing in db)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`Uploading image for conversion: ${image.name} (${image.size} bytes)`);

        const response = await api.post('/pdf/image-to-pdf', formData, {
            headers,
            responseType: 'blob',
            timeout: 120000, // 120 second timeout (2 minutes)
            maxContentLength: 10 * 1024 * 1024, // 10MB max content size
            maxBodyLength: 10 * 1024 * 1024, // 10MB max body size
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || image.size));
                console.log(`Upload progress: ${percentCompleted}%`);
            }
        });

        // Verify the response type is actually a PDF
        if (response.data.type !== 'application/pdf' &&
            response.headers['content-type'] !== 'application/pdf') {
            console.warn('Response may not be a valid PDF:', response.headers['content-type']);
        }

        if (response.data.size === 0) {
            throw new Error('Received empty PDF file');
        }

        console.log(`PDF conversion successful. Received ${response.data.size} bytes`);

        // Create download link
        return {
            blob: response.data,
            fileName: image.name.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i, '.pdf'),
            fileType: 'application/pdf'
        };
    } catch (error) {
        console.error('Image to PDF conversion error:', error);
        // Rethrow to be handled by the component
        throw error;
    }
};

// Merge PDFs
export const mergePdfs = async (files: File[]) => {
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        // Get authentication token if available
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'multipart/form-data'
        };

        // Add token to headers if available (for storing in db)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`Merging ${files.length} PDF files`);

        const response = await api.post('/pdf/merge', formData, {
            headers,
            responseType: 'blob',
            timeout: 120000, // 120 second timeout
            maxContentLength: 100 * 1024 * 1024, // 100MB max content size
            maxBodyLength: 100 * 1024 * 1024, // 100MB max body size
        });

        if (response.data.size === 0) {
            throw new Error('Received empty PDF file');
        }

        console.log(`PDF merge successful. Received ${response.data.size} bytes`);

        return {
            blob: response.data,
            fileName: 'merged.pdf',
            fileType: 'application/pdf'
        };
    } catch (error) {
        console.error('PDF merge error:', error);
        throw error;
    }
};

// Compress Image
export const compressImage = async (image: File, quality: number, format: string) => {
    try {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('quality', quality.toString());
        formData.append('format', format);

        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'multipart/form-data'
        };

        // Add token to headers if available (for storing in db)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await api.post('/image/compress', formData, {
            headers,
            responseType: 'blob',
        });

        // Create a new blob with proper content type
        const contentType = `image/${format === 'jpg' ? 'jpeg' : format}`;
        return new Blob([response.data], { type: contentType });
    } catch (error) {
        throw error;
    }
};

// Circle Crop Image
export const circleCropImage = async (image: File) => {
    try {
        const formData = new FormData();
        formData.append('image', image);

        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'multipart/form-data'
        };

        // Add token to headers if available (for storing in db)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await api.post('/image/circle-crop', formData, {
            headers,
            responseType: 'blob',
        });

        // Create a new blob with proper content type
        return new Blob([response.data], { type: 'image/png' });
    } catch (error) {
        throw error;
    }
};

// Get user's images
export const getUserImages = async () => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await api.get('/image/user/images', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.images;
    } catch (error) {
        throw error;
    }
};

// Delete an image
export const deleteImage = async (id: string) => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await api.delete(`/image/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};

// Get user's PDFs
export const getUserPdfs = async () => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await api.get('/pdf/user/pdfs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.pdfs;
    } catch (error) {
        console.error('Error fetching user PDFs:', error);
        throw error;
    }
};

// Delete a PDF
export const deletePdf = async (id: string) => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await api.delete(`/pdf/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error deleting PDF:', error);
        throw error;
    }
};

export default api; 
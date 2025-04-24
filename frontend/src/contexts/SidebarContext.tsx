import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type SidebarContextType = {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
    isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = (): SidebarContextType => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

type SidebarProviderProps = {
    children: ReactNode;
};

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect if we're on mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkIfMobile();

        // Listen for resize events
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Close sidebar when switching to desktop view
    useEffect(() => {
        if (!isMobile) {
            setIsSidebarOpen(false);
        }
    }, [isMobile]);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);

        // When opening the sidebar on mobile, prevent body scrolling
        if (isMobile && !isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
        document.body.style.overflow = '';
    };

    const openSidebar = () => {
        setIsSidebarOpen(true);
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        }
    };

    return (
        <SidebarContext.Provider value={{
            isSidebarOpen,
            toggleSidebar,
            closeSidebar,
            openSidebar,
            isMobile
        }}>
            {children}
        </SidebarContext.Provider>
    );
}; 
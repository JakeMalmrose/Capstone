
// src/components/Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function Navigation() {
const location = useLocation();
const { signOut } = useAuthenticator();
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
    async function checkAdminStatus() {
    try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload['cognito:groups'];
        setIsAdmin(Array.isArray(groups) && groups.includes('Admin'));
    } catch (error) {
        console.error('Error fetching user session:', error);
        setIsAdmin(false);
    }
    }
    checkAdminStatus();
}, []);

const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/summarizer', label: 'Summarizer' },
    { path: '/extractor', label: 'Extractor' },
    { path: '/websites', label: 'Websites' },
    ...(isAdmin ? [{ path: '/admin/websites', label: 'Manage Websites' }] : []),
];

return (
    <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
            <div className="flex-shrink-0">
            {/* TODO: add logo here */}
            <span className="text-primary-400 font-bold text-xl">NewsSummarizer</span>
            </div>
            <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
                {navLinks.map((link) => (
                <Link
                    key={link.path}
                    to={link.path}
                    className={`${
                    location.pathname === link.path
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                >
                    {link.label}
                </Link>
                ))}
            </div>
            </div>
        </div>
        <div className="hidden md:block">
            <button
            onClick={signOut}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
            Sign Out
            </button>
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
            <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-controls="mobile-menu"
            aria-expanded="false"
            >
            <span className="sr-only">Open main menu</span>
            {/* Icon for menu button */}
            <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
                />
            </svg>
            </button>
        </div>
        </div>
    </div>
    </nav>
);
}
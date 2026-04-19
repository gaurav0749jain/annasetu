import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="text-8xl mb-4">🍽️</div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                <p className="text-gray-500 mb-6">Oops! This page seems to have been eaten.</p>
                <Link to="/" className="btn-primary px-8 py-3">Go Home →</Link>
            </div>
        </div>
    );
}
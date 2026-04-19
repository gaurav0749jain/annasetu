import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Profile() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="card text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-700 mx-auto mb-3">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">{user?.name}</h1>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                    <div className="flex justify-center gap-2 mt-2">
                        <span className="badge-status bg-primary-100 text-primary-700 capitalize">{user?.role}</span>
                        {user?.donorType && (
                            <span className="badge-status bg-gray-100 text-gray-600 capitalize">{user?.donorType}</span>
                        )}
                    </div>
                </div>

                <div className="card">
                    <h2 className="font-semibold text-gray-700 mb-4">Account Details</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Name</span>
                            <span className="font-medium">{user?.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium">{user?.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Role</span>
                            <span className="font-medium capitalize">{user?.role}</span>
                        </div>
                        {user?.donorType && (
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">Donor Type</span>
                                <span className="font-medium capitalize">{user?.donorType}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
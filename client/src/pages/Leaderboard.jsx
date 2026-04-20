import { useState, useEffect } from 'react';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

const badges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
const donorTypeColors = {
    individual: 'bg-blue-100 text-blue-700',
    restaurant: 'bg-orange-100 text-orange-700',
    event: 'bg-purple-100 text-purple-700',
    office: 'bg-gray-100 text-gray-700',
    college: 'bg-green-100 text-green-700',
    other: 'bg-pink-100 text-pink-700',
};

export default function Leaderboard() {
    const [donors, setDonors] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await API.get('/admin/stats');
                setDonors(res.data.topDonors || []);
                setStats(res.data.stats);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🏆</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Donor Leaderboard</h1>
                    <p className="text-gray-500">Celebrating our food heroes who are making a difference</p>
                </div>

                {/* Platform Stats */}
                {stats && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="card text-center">
                            <div className="text-2xl mb-1">🍱</div>
                            <div className="text-2xl font-bold text-primary-600">{stats.totalMealsSaved || 0}</div>
                            <div className="text-xs text-gray-500">Total Meals Saved</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-2xl mb-1">🌱</div>
                            <div className="text-2xl font-bold text-green-600">{stats.co2Saved || 0} kg</div>
                            <div className="text-xs text-gray-500">CO₂ Saved</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-2xl mb-1">👥</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.totalDonors || 0}</div>
                            <div className="text-xs text-gray-500">Active Donors</div>
                        </div>
                    </div>
                )}

                {/* Top 3 Podium */}
                {donors.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 mb-8">
                        {/* 2nd place */}
                        <div className="flex flex-col items-center">
                            <div className="text-3xl mb-2">🥈</div>
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 border-4 border-gray-300">
                                {donors[1]?.donor?.name?.charAt(0)}
                            </div>
                            <div className="font-semibold text-sm mt-2 text-center">{donors[1]?.donor?.name}</div>
                            <div className="text-xs text-gray-500">{donors[1]?.totalMeals} meals</div>
                            <div className="bg-gray-300 w-16 h-16 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                <span className="text-gray-600 font-bold">2</span>
                            </div>
                        </div>

                        {/* 1st place */}
                        <div className="flex flex-col items-center">
                            <div className="text-4xl mb-2">🥇</div>
                            <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center text-3xl font-bold text-yellow-700 border-4 border-yellow-400">
                                {donors[0]?.donor?.name?.charAt(0)}
                            </div>
                            <div className="font-bold text-base mt-2 text-center text-primary-700">{donors[0]?.donor?.name}</div>
                            <div className="text-sm text-primary-600 font-medium">{donors[0]?.totalMeals} meals</div>
                            <div className="bg-yellow-400 w-16 h-24 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                <span className="text-yellow-800 font-bold">1</span>
                            </div>
                        </div>

                        {/* 3rd place */}
                        <div className="flex flex-col items-center">
                            <div className="text-3xl mb-2">🥉</div>
                            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-600 border-4 border-orange-300">
                                {donors[2]?.donor?.name?.charAt(0)}
                            </div>
                            <div className="font-semibold text-sm mt-2 text-center">{donors[2]?.donor?.name}</div>
                            <div className="text-xs text-gray-500">{donors[2]?.totalMeals} meals</div>
                            <div className="bg-orange-300 w-16 h-12 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                <span className="text-orange-700 font-bold">3</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full List */}
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">All Top Donors</h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : donors.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-2">🍽️</div>
                            <p className="text-gray-500">No donations yet. Be the first hero!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {donors.map((d, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="text-2xl w-8 text-center">{badges[i] || `${i + 1}`}</div>
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
                                        {d.donor?.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-800">{d.donor?.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-500">📍 {d.donor?.city}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${donorTypeColors[d.donor?.donorType] || 'bg-gray-100 text-gray-600'}`}>
                                                {d.donor?.donorType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-primary-600">{d.totalMeals}</div>
                                        <div className="text-xs text-gray-500">meals</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-green-600">{(d.totalMeals * 0.5 * 2.5).toFixed(1)}</div>
                                        <div className="text-xs text-gray-500">kg CO₂</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
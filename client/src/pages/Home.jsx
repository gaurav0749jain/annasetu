import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const stats = [
    { label: 'Meals Saved', value: '10,000+', icon: '🍱' },
    { label: 'Active Donors', value: '500+', icon: '🤝' },
    { label: 'Cities Covered', value: '20+', icon: '🏙️' },
    { label: 'CO₂ Saved (kg)', value: '12,500+', icon: '🌱' },
];

const steps = [
    { icon: '📸', title: 'List your food', desc: 'Take a photo, our AI fills in the details automatically' },
    { icon: '🔔', title: 'Get matched', desc: 'Nearby NGOs and shelters are notified instantly' },
    { icon: '🚗', title: 'Volunteer picks up', desc: 'A volunteer collects and delivers the food' },
    { icon: '❤️', title: 'Impact made', desc: 'Track your contribution and CO₂ saved' },
];

const donorTypes = [
    { icon: '🏠', label: 'Households' },
    { icon: '🍽️', label: 'Restaurants' },
    { icon: '💒', label: 'Weddings' },
    { icon: '🎉', label: 'Parties' },
    { icon: '🏢', label: 'Offices' },
    { icon: '🎓', label: 'Colleges' },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-6xl mb-4">🍱</div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Bridge Between Surplus & Need
                    </h1>
                    <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                        AnnaSetu connects food donors — homes, restaurants, weddings, parties —
                        with NGOs and shelters. Zero waste. Maximum impact.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors">
                            Start Donating 🤝
                        </Link>
                        <Link to="/listings" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                            Browse Food 🍽️
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-12 px-4 bg-white">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="text-3xl mb-2">{s.icon}</div>
                            <div className="text-2xl font-bold text-primary-600">{s.value}</div>
                            <div className="text-sm text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Who can donate */}
            <section className="py-12 px-4 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Anyone Can Donate</h2>
                    <p className="text-center text-gray-500 mb-8">No verification needed — just register and list your food</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {donorTypes.map((d) => (
                            <div key={d.label} className="card text-center hover:shadow-md transition-shadow">
                                <div className="text-3xl mb-2">{d.icon}</div>
                                <div className="text-xs font-medium text-gray-600">{d.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-12 px-4 bg-white">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">How It Works</h2>
                    <p className="text-center text-gray-500 mb-10">From surplus to smiles in 4 simple steps</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {steps.map((step, i) => (
                            <div key={i} className="text-center">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                                    {step.icon}
                                </div>
                                <div className="font-semibold text-gray-800 mb-1">{step.title}</div>
                                <div className="text-sm text-gray-500">{step.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Features */}
            <section className="py-12 px-4 bg-primary-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Powered by AI</h2>
                    <p className="text-center text-gray-500 mb-8">Gemini AI makes food donation smarter</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: '📸', title: 'Image Recognition', desc: 'Upload a photo — AI identifies food type, estimates quantity and freshness' },
                            { icon: '🤖', title: 'Smart Matching', desc: 'AI recommends the best receiver NGO based on location and need' },
                            { icon: '💬', title: 'AI Chatbot', desc: 'Get instant help from our AI assistant for any questions' },
                        ].map((f) => (
                            <div key={f.title} className="card hover:shadow-md transition-shadow">
                                <div className="text-3xl mb-3">{f.icon}</div>
                                <div className="font-semibold text-gray-800 mb-1">{f.title}</div>
                                <div className="text-sm text-gray-500">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4 bg-primary-600 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
                <p className="text-primary-100 mb-8 text-lg">Join thousands of donors saving food and feeding communities</p>
                <Link to="/register" className="bg-white text-primary-700 font-semibold px-10 py-3 rounded-lg hover:bg-primary-50 transition-colors text-lg">
                    Join AnnaSetu Free →
                </Link>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 py-8 px-4 text-center">
                <div className="text-2xl mb-2">🍱</div>
                <div className="font-semibold text-white mb-1">AnnaSetu</div>
                <div className="text-sm">Bridging surplus food with genuine need — across India</div>
                <div className="mt-4 text-xs">Built with ❤️ for a waste-free India</div>
            </footer>
        </div>
    );
}
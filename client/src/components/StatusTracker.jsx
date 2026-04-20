const statuses = [
    { key: 'claimed', label: 'Claimed', icon: '📋' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'volunteer-assigned', label: 'Volunteer Assigned', icon: '🚗' },
    { key: 'in-transit', label: 'In Transit', icon: '🏃' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

export default function StatusTracker({ currentStatus }) {
    const currentIndex = statuses.findIndex(s => s.key === currentStatus);

    return (
        <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Pickup Status</h3>
            <div className="relative">
                {/* Progress line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0">
                    <div
                        className="h-full bg-primary-500 transition-all duration-500"
                        style={{ width: currentIndex >= 0 ? `${(currentIndex / (statuses.length - 1)) * 100}%` : '0%' }}
                    />
                </div>

                {/* Steps */}
                <div className="relative z-10 flex justify-between">
                    {statuses.map((status, index) => {
                        const isDone = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        return (
                            <div key={status.key} className="flex flex-col items-center gap-1" style={{ width: '20%' }}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300 ${isDone
                                        ? 'bg-primary-600 border-primary-600 shadow-sm'
                                        : 'bg-white border-gray-200'
                                    } ${isCurrent ? 'ring-4 ring-primary-100 scale-110' : ''}`}>
                                    {status.icon}
                                </div>
                                <span className={`text-xs text-center leading-tight font-medium ${isDone ? 'text-primary-600' : 'text-gray-400'}`}>
                                    {status.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
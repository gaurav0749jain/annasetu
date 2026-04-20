import { useState, useRef, useEffect } from 'react';
import API from '../utils/axios';
import { useAuth } from '../context/AuthContext';

export default function ChatBot() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m AnnaSetu AI 🍱 How can I help you today? Ask me about food donation, pickup, or anything about the platform!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await API.post('/ai/chat', {
                message: input,
                userRole: user?.role || 'visitor',
                conversationHistory: messages.slice(-6),
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble right now. Please try again!' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all duration-200 flex items-center justify-center text-2xl"
                title="AI Assistant"
            >
                {open ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '420px' }}>
                    {/* Header */}
                    <div className="bg-primary-600 text-white px-4 py-3 flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <div>
                            <div className="font-semibold text-sm">AnnaSetu AI</div>
                            <div className="text-xs text-primary-200">Powered by Gemini</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-sm'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-500">
                                    <span className="animate-pulse">AI is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-2 border-t bg-white flex gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <button type="submit" disabled={!input.trim() || loading} className="bg-primary-600 text-white px-3 py-2 rounded-lg text-xs disabled:opacity-50 hover:bg-primary-700">
                            →
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col">

            {/* Navbar */}
            <Navbar variant="landing" />

            {/* Hero */}
            <main className="relative flex flex-col items-center justify-center text-center overflow-hidden" style={{ minHeight: "88vh" }}>
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/src/assets/hero-delivery.jpg"
                        alt="Delivery"
                        className="w-full h-full object-cover"
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-2xl mx-auto px-6 py-24">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                        Logistics & Delivery Platform
                    </div>

                    <h1 className="text-6xl font-extrabold text-white leading-tight mb-5 tracking-tight">
                        Ship anything,{" "}
                        <span className="text-blue-400">anywhere</span>
                    </h1>

                    <p className="text-lg text-white/70 mb-10 max-w-lg mx-auto leading-relaxed">
                        Create delivery requests, track your shipments in real time, and get
                        instant updates — all in one place.
                    </p>

                    <div className="flex items-center justify-center gap-3 mb-16">
                        <button onClick={() => navigate("/login")}
                            className="bg-blue-600 text-white px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl">
                            Create a Shipment
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                        {[
                            { value: "2k+", label: "Shipments delivered" },
                            { value: "70%", label: "On-time delivery" },
                            { value: "10+", label: "Cities covered" },
                        ].map((stat) => (
                            <div key={stat.label}
                                className="text-center p-4 bg-white/10 backdrop-blur rounded-xl border border-white/15">
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* How it works */}
            <section className="px-6 py-20 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Process</span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">How it works</h2>
                        <p className="text-gray-400 text-sm">Get your shipment delivered in just a few simple steps</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                step: "01",
                                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                                title: "Create Shipment",
                                desc: "Enter pickup and delivery details in our simple 3-step form.",
                            },
                            {
                                step: "02",
                                icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
                                title: "Agent Assigned",
                                desc: "Our system auto-assigns the best available delivery agent.",
                            },
                            {
                                step: "03",
                                icon: "M5 13l4 4L19 7",
                                title: "Delivered Safely",
                                desc: "Track status at every stage until your package arrives.",
                            },
                        ].map((item, idx) => (
                            <div key={item.step}
                                className="relative bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                                {/* Step connector line */}
                                {idx < 2 && (
                                    <div className="hidden md:block absolute top-10 -right-3 w-6 h-px bg-blue-200 z-10" />
                                )}
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-blue-400 mb-2 block">{item.step}</span>
                                <h3 className="text-base font-bold text-gray-800 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Features */}
            <section className="px-6 py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Features</span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">Everything you need</h2>
                        <p className="text-gray-400 text-sm">Built to make logistics simple and stress-free</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {[
                            {
                                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                                title: "Easy Booking",
                                desc: "Create a shipment in under 2 minutes with our simple 3-step form.",
                            },
                            {
                                icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
                                title: "Smart Chatbot",
                                desc: "Ask anything about your shipment and get instant answers.",
                            },
                        ].map((feature) => (
                            <div key={feature.title}
                                className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 mb-1">{feature.title}</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* CTA Banner */}
            <section className="px-6 py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-center text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative z-10">
                    <span className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-3 block">Get Started</span>
                    <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
                        Ready to ship your package?
                    </h2>
                    <p className="text-sm mb-8 text-blue-100 max-w-md mx-auto">
                        Join thousands of users delivering with Sigistics. Fast, reliable, and hassle-free.
                    </p>
                    <button onClick={() => navigate("/signup")}
                        className="bg-white text-blue-600 px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl">
                        Create Free Account →
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 px-8 py-14">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                    </svg>
                                </div>
                                <span className="text-white font-bold text-base">Sigistics</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Smart logistics platform for fast and reliable deliveries across India.
                            </p>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
                            <ul className="space-y-2.5 text-sm">
                                {["About", "Careers", "Blog"].map((item) => (
                                    <li key={item} className="hover:text-white cursor-pointer transition-colors">{item}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
                            <ul className="space-y-2.5 text-sm">
                                {["Features", "Pricing", "Integrations"].map((item) => (
                                    <li key={item} className="hover:text-white cursor-pointer transition-colors">{item}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
                            <ul className="space-y-2.5 text-sm">
                                {["Help Center", "Privacy Policy", "Terms of Service"].map((item) => (
                                    <li key={item} className="hover:text-white cursor-pointer transition-colors">{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-600">© 2026 Sigistics. All rights reserved.</p>
                        <div className="flex items-center gap-6 text-xs text-gray-600">
                            <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
                            <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms</span>
                            <span className="hover:text-gray-400 cursor-pointer transition-colors">Cookies</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
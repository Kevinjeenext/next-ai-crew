/**
 * Landing Page — nextaicrew.com first impression.
 *
 * Soul & Body framework: "Your AI team, brought to life."
 * Target: CEO/founders who want an AI-powered team.
 */
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "🧠",
    title: "Souls, Not Bots",
    description: "Each AI agent has a unique personality, role, and expertise. They're not tools — they're team members.",
  },
  {
    icon: "🏢",
    title: "Your Virtual Office",
    description: "Organize departments, assign tasks, and watch your AI crew collaborate in real-time.",
  },
  {
    icon: "⚡",
    title: "Instant Team Scaling",
    description: "Spin up specialists in seconds. Engineering, design, marketing — build any team you need.",
  },
  {
    icon: "💬",
    title: "Natural Communication",
    description: "Give directives in plain language. Your AI team discusses, plans, and delivers results.",
  },
  {
    icon: "📊",
    title: "Full Visibility",
    description: "Track progress, review outputs, and see meeting minutes — like a real management dashboard.",
  },
  {
    icon: "🔒",
    title: "Enterprise Ready",
    description: "Multi-tenant architecture, role-based access, and audit trails from day one.",
  },
];

const ROLES = [
  { emoji: "👩‍💻", name: "Lead Engineer", personality: "Analytical, precise" },
  { emoji: "🎨", name: "UX Designer", personality: "Creative, empathetic" },
  { emoji: "📢", name: "Growth Lead", personality: "Data-driven, bold" },
  { emoji: "🛡️", name: "QA Specialist", personality: "Meticulous, thorough" },
  { emoji: "📋", name: "Project Manager", personality: "Organized, diplomatic" },
  { emoji: "🔬", name: "Data Scientist", personality: "Curious, methodical" },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold">Next AI Crew</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="text-gray-300 hover:text-white transition text-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm mb-6">
            ✨ Now in Early Access
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Build Your
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> AI Team</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Hire AI agents with real personalities. Give them roles, assign tasks, and watch them
            collaborate — like a real team, powered by AI.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-indigo-600 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25"
            >
              Start Building Your Crew →
            </button>
            <a
              href="#features"
              className="px-8 py-4 text-gray-300 hover:text-white transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Soul Showcase */}
      <section className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-gray-500 text-sm font-medium uppercase tracking-wider mb-8">
            Meet Your Future Team
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ROLES.map((role) => (
              <div
                key={role.name}
                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 text-center hover:border-indigo-500/30 transition group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {role.emoji}
                </div>
                <div className="text-sm font-medium text-white">{role.name}</div>
                <div className="text-xs text-gray-500 mt-1">{role.personality}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Lead an AI Team
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From hiring to delegation, review to reporting —
              manage your AI crew like you'd manage a real team.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-indigo-500/30 transition"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Your AI Crew?
          </h2>
          <p className="text-gray-400 mb-8">
            Start free. No credit card required. Your first AI team is just a click away.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-indigo-600 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25"
          >
            Get Started Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-gray-500 text-sm">
            © 2026 Next AI Crew. All rights reserved.
          </span>
          <div className="flex items-center gap-6 text-gray-500 text-sm">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

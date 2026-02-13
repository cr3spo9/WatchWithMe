import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, Zap, RefreshCw, UserCheck, Share2, Youtube, X, ZoomIn } from 'lucide-react';

// Landing
export function Landing() {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    if (lightboxImage) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [lightboxImage]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImage}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Cyber grid background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center top'
          }}
        />
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* Navbar */}
      <nav className="relative z-50 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
            <span className="text-xl font-mono font-bold tracking-wider text-cyan-400">
              WATCHWITHME
            </span>
          </div>
          <Link to="/app" className="px-6 py-3 border border-cyan-400 text-cyan-400 font-mono text-sm hover:bg-cyan-400 hover:text-black transition-all shadow-lg shadow-cyan-400/20">
            [ ENTRAR ]
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/30 bg-red-500/10 mb-8 font-mono text-sm">
            <Youtube className="w-4 h-4 text-red-500" />
            <span className="text-red-400">YOUTUBE_LIVE_SYNC</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6">
            <span className="block text-white">
              Directos sincronizados
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-400">
              con tus amigos
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 font-mono">
            &gt; Crea sala. Compártela. Ve directos sincronizados._
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app" className="group px-8 py-5 bg-cyan-400 text-black font-mono font-bold text-lg hover:shadow-2xl hover:shadow-cyan-400/50 transition-all flex items-center justify-center gap-3">
              <Play className="w-5 h-5" />
              CREAR_SALA
            </Link>
            <Link to="/app" className="px-8 py-5 border border-pink-400/50 text-pink-400 font-mono hover:bg-pink-400/10 transition-all text-center">
              UNIRSE
            </Link>
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="relative z-10 px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Host view */}
            <div className="border border-cyan-400/30 p-4 relative group">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
              <div className="flex items-center gap-2 mb-3 font-mono text-sm">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400">HOST_VIEW</span>
                <span className="ml-auto text-gray-500">// controla el video</span>
              </div>
              <div
                className="relative cursor-zoom-in"
                onClick={() => setLightboxImage('/images/host.avif')}
              >
                <img
                  src="/images/host.avif"
                  alt="Vista del host"
                  className="w-full transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/10 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
            {/* Guest view */}
            <div className="border border-pink-400/30 p-4 relative group">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-pink-400" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-pink-400" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-pink-400" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-pink-400" />
              <div className="flex items-center gap-2 mb-3 font-mono text-sm">
                <Users className="w-4 h-4 text-pink-400" />
                <span className="text-pink-400">GUEST_VIEW</span>
                <span className="ml-auto text-gray-500">// sincronizado auto</span>
              </div>
              <div
                className="relative cursor-zoom-in"
                onClick={() => setLightboxImage('/images/guest.avif')}
              >
                <img
                  src="/images/guest.avif"
                  alt="Vista del invitado"
                  className="w-full transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-pink-400/0 group-hover:bg-pink-400/10 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Share2, title: 'COMPARTE', desc: 'Crea una sala y compártela con tus amigos', accent: 'cyan' },
              { icon: RefreshCw, title: 'AUTO_SPEED', desc: 'El video acelera solo si te quedas atrás', accent: 'pink' },
              { icon: UserCheck, title: 'HOST_CONTROL', desc: 'El host controla. Los demás siguen.', accent: 'cyan' },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group p-6 border ${feature.accent === 'cyan' ? 'border-cyan-400/20 hover:border-cyan-400/50' : 'border-pink-400/20 hover:border-pink-400/50'} bg-black/50 hover:bg-black/80 transition-all`}
              >
                <div className={`w-12 h-12 border ${feature.accent === 'cyan' ? 'border-cyan-400/50' : 'border-pink-400/50'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.accent === 'cyan' ? 'text-cyan-400' : 'text-pink-400'}`} />
                </div>
                <h3 className="text-lg font-bold font-mono mb-2 tracking-wider">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sync highlight */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="border border-cyan-400/30 bg-cyan-400/5 p-8">
            <div className="flex items-center gap-4 mb-4">
              <Zap className="w-8 h-8 text-cyan-400" />
              <h2 className="text-xl font-mono font-bold text-cyan-400">SYNC_INTELIGENTE</h2>
            </div>
            <p className="text-gray-400 font-mono">
              &gt; ¿Conexión lenta? El video acelera automáticamente para sincronizarte con el host.
              Sin intervención manual. Cero lag._
            </p>
          </div>
        </div>
      </section>

      {/* Terminal CTA */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="border border-cyan-400/30 bg-black/80">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-cyan-400/30 bg-cyan-400/5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-xs text-gray-500 font-mono">watchwithme@terminal</span>
            </div>
            <div className="p-6 font-mono">
              <div className="text-gray-500 mb-2">$ watchwithme --create-room</div>
              <div className="text-cyan-400 mb-2">&gt; Sala creada: abc123</div>
              <div className="text-green-400 mb-4">&gt; Comparte la sala con tus amigos</div>
              <div className="text-white mb-6">
                &gt; Gratis. Sin registro._
              </div>
              <Link to="/app" className="w-full py-4 bg-cyan-400 text-black font-bold hover:shadow-2xl hover:shadow-cyan-400/50 transition-all block text-center">
                $ CREAR_SALA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-cyan-400/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 font-mono text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            ONLINE
          </div>
          <div className="text-gray-600 font-mono text-xs text-right">
            <p>open source // <a href="https://github.com/cr3spo9" className="hover:text-cyan-400 transition-colors">cr3spo9</a></p>
            <a href="https://github.com/cr3spo9/WatchWithMe" className="hover:text-cyan-400 transition-colors">github.com/cr3spo9/WatchWithMe</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

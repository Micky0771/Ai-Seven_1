import { useEffect } from 'react'
import { useAppStore } from './store'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import DocumentPanel from './components/DocumentPanel'
import StatusBar from './components/StatusBar'

export default function App() {
  const { loadSubjects, checkAIHealth, currentSubject, error, setError } = useAppStore()

  useEffect(() => {
    loadSubjects()
    checkAIHealth()
    // Verificar salud de IA cada 30 segundos
    const interval = setInterval(checkAIHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 select-none">
      {/* Barra de título draggable (macOS / Windows) */}
      <div className="h-8 bg-slate-950 flex items-center px-4 shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">AiSeven</span>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="bg-red-900/80 border-b border-red-700 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-red-200 text-sm">⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 text-lg leading-none"
          >×</button>
        </div>
      )}

      {/* Layout principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar izquierdo */}
        <Sidebar />

        {/* Área central */}
        <div className="flex flex-1 overflow-hidden">
          {currentSubject ? (
            <>
              {/* Panel de documentos */}
              <DocumentPanel />
              {/* Panel de chat */}
              <ChatPanel />
            </>
          ) : (
            <WelcomeScreen />
          )}
        </div>
      </div>

      {/* Barra de estado */}
      <StatusBar />
    </div>
  )
}

function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900">
        <span className="text-4xl">🎓</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Bienvenido a AiSeven</h1>
        <p className="text-slate-400 max-w-md">
          Tu ecosistema de aprendizaje local con IA. Crea un ramo en el panel izquierdo para comenzar.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-lg">
        {[
          { icon: '📚', title: 'Sube tus apuntes', desc: 'PDF, Word, texto' },
          { icon: '🤖', title: 'Pregunta a la IA', desc: 'Basado en tu material' },
          { icon: '🔒', title: '100% local', desc: 'Sin internet, sin nube' },
        ].map(item => (
          <div key={item.title} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-sm font-medium text-white">{item.title}</div>
            <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

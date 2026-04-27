import React, { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import DocumentPanel from './components/DocumentPanel'
import StatusBar from './components/StatusBar'
import { useAppStore } from './store'

const App: React.FC = () => {
  const { loadSubjects, checkAIHealth, currentSubject, error, setError } = useAppStore()

  useEffect(() => {
    // Carga inicial
    loadSubjects()
    checkAIHealth()

    // Verificar salud de IA cada 30 segundos (Ollama check)
    const interval = setInterval(checkAIHealth, 30000)
    
    // Limpieza al desmontar el componente
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 select-none overflow-hidden font-sans">
      
      {/* 1. Barra de título Draggable (Estilo moderno de escritorio) */}
      <div 
        className="h-8 bg-slate-950 flex items-center px-4 shrink-0 border-b border-slate-800" 
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">A7</span>
          </div>
          <span className="text-xs text-slate-400 font-medium tracking-wider">AISEVEN</span>
        </div>
      </div>

      {/* 2. Notificación de Error Global */}
      {error && (
        <div className="bg-red-900/80 border-b border-red-700 px-4 py-2 flex items-center justify-between shrink-0 animate-in slide-in-from-top">
          <span className="text-red-200 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* 3. Cuerpo de la aplicación (Layout de 3 columnas) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Lado Izquierdo: Lista de Ramos */}
        <Sidebar />

        {/* Centro y Derecha: Contenido Dinámico */}
        <div className="flex flex-1 overflow-hidden bg-slate-900">
          {currentSubject ? (
            <>
              {/* Lista de archivos del ramo seleccionado */}
              <div className="w-80 border-r border-slate-800 bg-slate-900/50">
                <DocumentPanel />
              </div>
              
              {/* Interacción principal con la IA */}
              <div className="flex-1 flex flex-col min-w-0">
                <ChatPanel />
              </div>
            </>
          ) : (
            /* Pantalla de bienvenida si no hay ramo seleccionado */
            <WelcomeScreen />
          )}
        </div>
      </div>

      {/* 4. Barra de Estado Inferior */}
      <StatusBar />
    </div>
  )
}

/**
 * Pantalla que aparece cuando el usuario no ha seleccionado ningún ramo
 */
function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center bg-slate-900">
      <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-900/20 animate-bounce-slow">
        <span className="text-5xl">🎓</span>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Bienvenido a AiSeven</h1>
        <p className="text-slate-400 max-w-md mx-auto text-lg">
          Tu ecosistema de aprendizaje local. Selecciona o crea un ramo en el panel izquierdo para comenzar a estudiar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
        {[
          { icon: '📚', title: 'Sube tus apuntes', desc: 'Soporta PDF, Word y Texto' },
          { icon: '🤖', title: 'Pregunta a la IA', desc: 'Responde basado en tu material' },
          { icon: '🔒', title: 'Privacidad Total', desc: '100% local, sin nube' },
        ].map(item => (
          <div key={item.title} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
            <div className="text-3xl mb-3">{item.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
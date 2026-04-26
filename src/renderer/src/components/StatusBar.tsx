import { useAppStore } from '../store'

export default function StatusBar() {
  const { aiHealth, documents, subjects } = useAppStore()

  return (
    <div className="h-6 bg-slate-950 border-t border-slate-800 flex items-center px-4 gap-4 shrink-0">
      {/* Estado Ollama */}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${aiHealth?.ollama ? 'bg-green-400' : 'bg-red-500'}`}></div>
        <span className="text-xs text-slate-500">
          Ollama {aiHealth?.ollama ? 'conectado' : 'desconectado'}
        </span>
      </div>

      {/* Modelo activo */}
      {aiHealth?.ollama && aiHealth.models.length > 0 && (
        <>
          <div className="w-px h-3 bg-slate-700"></div>
          <span className="text-xs text-slate-600">{aiHealth.models[0]}</span>
        </>
      )}

      <div className="flex-1"></div>

      {/* Estadísticas */}
      <span className="text-xs text-slate-600">
        {subjects.length} ramo{subjects.length !== 1 ? 's' : ''} · {documents.length} doc{documents.length !== 1 ? 's' : ''}
      </span>

      <div className="w-px h-3 bg-slate-700"></div>
      <span className="text-xs text-slate-600">AiSeven v0.1.0</span>
    </div>
  )
}

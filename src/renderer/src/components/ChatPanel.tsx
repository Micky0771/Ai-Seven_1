import { useState, useRef, useEffect } from 'react'
import { useAppStore, ChatMessage } from '../store'

export default function ChatPanel() {
  const { chatMessages, sendMessage, isChatLoading, clearChat, documents, currentSubject } = useAppStore()
  const [input, setInput] = useState('')
  const [useContext, setUseContext] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isChatLoading) return
    setInput('')
    await sendMessage(content, useContext)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasDocuments = documents.length > 0

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
      {/* Header del chat */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm">🤖</div>
          <div>
            <p className="text-sm font-semibold text-white">Chat con AiSeven</p>
            <p className="text-xs text-slate-400">{currentSubject?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle contexto */}
          <button
            onClick={() => setUseContext(!useContext)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              useContext && hasDocuments
                ? 'bg-indigo-900/50 border-indigo-600 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={hasDocuments ? 'Usar contexto de documentos' : 'Sin documentos cargados'}
          >
            <span>{useContext && hasDocuments ? '📚' : '💬'}</span>
            <span>{useContext && hasDocuments ? 'Con contexto' : 'Sin contexto'}</span>
          </button>
          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              title="Limpiar chat"
            >
              🗑 Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {chatMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="text-4xl">💬</div>
            <div>
              <p className="text-slate-300 font-medium">Hola! Soy AiSeven</p>
              <p className="text-slate-500 text-sm mt-1">
                {hasDocuments
                  ? `Tengo acceso a ${documents.length} documento${documents.length !== 1 ? 's' : ''} de este ramo. ¡Pregúntame!`
                  : 'Agrega documentos en el panel izquierdo para que pueda responder con tu material.'}
              </p>
            </div>
            {/* Sugerencias */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {(hasDocuments
                ? ['¿Cuál es el tema principal?', 'Hazme un resumen', '¿Qué conceptos debo estudiar?']
                : ['¿Qué es el RAG?', 'Explícame machine learning', '¿Cómo estudiar mejor?']
              ).map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isChatLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 text-sm">🤖</div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none resize-none transition-colors"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            disabled={isChatLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors shrink-0"
          >
            <span className="text-white text-sm">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
        isUser ? 'bg-slate-700' : 'bg-indigo-600'
      }`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-slate-800 text-slate-200 rounded-tl-none'
        }`}>
          {message.content}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>{new Date(message.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
          {message.model && <span>· {message.model}</span>}
          {message.duration && <span>· {(message.duration / 1000).toFixed(1)}s</span>}
        </div>
      </div>
    </div>
  )
}

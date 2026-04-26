import { useAppStore } from '../store'

export default function DocumentPanel() {
  const { currentSubject, documents, processDocument, selectFiles, isProcessing } = useAppStore()

  const handleAddFiles = async () => {
    const files = await selectFiles()
    if (!files.length || !currentSubject) return
    for (const filePath of files) {
      await processDocument(filePath, currentSubject.id)
    }
  }

  const typeIcon: Record<string, string> = {
    '.pdf': '📕',
    '.docx': '📘',
    '.txt': '📄',
    '.md': '📝',
  }

  return (
    <div className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Material</p>
            <p className="text-sm font-bold text-white truncate mt-0.5">{currentSubject?.name}</p>
          </div>
          <button
            onClick={handleAddFiles}
            disabled={isProcessing}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center transition-colors"
            title="Agregar documentos"
          >
            {isProcessing ? (
              <span className="text-xs animate-spin">⟳</span>
            ) : (
              <span className="text-slate-300 text-sm">+</span>
            )}
          </button>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="flex-1 overflow-y-auto p-2">
        {documents.length === 0 ? (
          <div
            className="mt-4 border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
            onClick={handleAddFiles}
          >
            <div className="text-3xl mb-2">📂</div>
            <p className="text-xs text-slate-400">Agrega documentos de estudio</p>
            <p className="text-xs text-slate-600 mt-1">PDF, DOCX, TXT, MD</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span className="text-sm shrink-0">
                  {typeIcon[doc.file_type] ?? '📄'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{doc.file_name}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(doc.indexed_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          {documents.length} documento{documents.length !== 1 ? 's' : ''} indexado{documents.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

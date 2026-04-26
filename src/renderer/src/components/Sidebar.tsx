import { useState } from 'react'
import { useAppStore, Subject } from '../store'

export default function Sidebar() {
  const { subjects, currentSubject, setCurrentSubject, createSubject, deleteSubject, isLoading } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', semester: 1, year: new Date().getFullYear() })
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await createSubject(form.name.trim(), form.semester, form.year)
      setForm({ name: '', semester: 1, year: new Date().getFullYear() })
      setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  // Agrupar por año y semestre
  const grouped = subjects.reduce((acc, s) => {
    const key = `${s.year}-S${s.semester}`
    if (!acc[key]) acc[key] = { label: `${s.year} — Semestre ${s.semester}`, items: [] }
    acc[key].items.push(s)
    return acc
  }, {} as Record<string, { label: string; items: Subject[] }>)

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mis Ramos</span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-6 h-6 rounded-md bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-colors"
            title="Nuevo ramo"
          >
            <span className="text-white text-sm font-bold leading-none">{showForm ? '×' : '+'}</span>
          </button>
        </div>

        {/* Formulario nuevo ramo */}
        {showForm && (
          <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Nombre del ramo"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <select
                value={form.semester}
                onChange={e => setForm({ ...form, semester: Number(e.target.value) })}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>Semestre 1</option>
                <option value={2}>Semestre 2</option>
              </select>
              <input
                type="number"
                value={form.year}
                onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                min={2020} max={2035}
                className="w-20 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !form.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-md transition-colors"
            >
              {creating ? 'Creando...' : 'Crear Ramo'}
            </button>
          </form>
        )}
      </div>

      {/* Lista de ramos */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && subjects.length === 0 && (
          <div className="text-center text-slate-500 text-xs mt-4">Cargando...</div>
        )}
        {subjects.length === 0 && !isLoading && (
          <div className="text-center text-slate-600 text-xs mt-8 px-4">
            No hay ramos aún.<br />Crea uno con el botón +
          </div>
        )}

        {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([key, group]) => (
          <div key={key} className="mb-3">
            <div className="text-xs text-slate-500 font-medium px-2 py-1">{group.label}</div>
            {group.items.map(subject => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                isActive={currentSubject?.id === subject.id}
                onSelect={() => setCurrentSubject(subject)}
                onDelete={() => deleteSubject(subject.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SubjectItem({ subject, isActive, onSelect, onDelete }: {
  subject: Subject
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-0.5 ${
        isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <span className="text-sm">📖</span>
      <span className="flex-1 text-sm font-medium truncate">{subject.name}</span>
      {showDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="text-xs opacity-60 hover:opacity-100 hover:text-red-400 transition-opacity"
          title="Eliminar ramo"
        >✕</button>
      )}
    </div>
  )
}

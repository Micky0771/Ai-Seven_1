import React, { useState } from 'react'
import { useAppStore, Subject } from '../store'

interface GroupedSubjects {
  [key: string]: {
    label: string;
    items: Subject[];
  }
}

export const Sidebar: React.FC = () => {
  const { subjects, currentSubject, setCurrentSubject, createSubject, deleteSubject } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', semester: '1', year: new Date().getFullYear() })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim()) {
      // Forzamos la conversión a string de forma segura para TS
      const nameParam = form.name.trim()
      const semParam = String(form.semester)
      const yearParam = String(form.year)

      await createSubject(nameParam, semParam, yearParam)
      
      setIsModalOpen(false)
      setForm({ name: '', semester: '1', year: new Date().getFullYear() })
    }
  }

  // Agrupación con tipado explícito para evitar errores de 'any' o 'unknown'
  const grouped = subjects.reduce((acc: GroupedSubjects, s: Subject) => {
    const key = `${s.year}-S${s.semester}`
    if (!acc[key]) {
      acc[key] = { label: `${s.year} — Semestre ${s.semester}`, items: [] }
    }
    acc[key].items.push(s)
    return acc
  }, {})

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-indigo-600">AiSeven</h1>
        <p className="text-xs text-slate-500">Ecosistema de Aprendizaje</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full mb-4 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          + Nuevo Ramo
        </button>

        {Object.values(grouped).map((group) => (
          <div key={group.label} className="mb-4">
            <div className="text-xs text-slate-500 font-medium px-2 py-1 italic">{group.label}</div>
            {group.items.map((subject) => (
              <div 
                key={subject.id}
                onClick={() => setCurrentSubject(subject)}
                className={`group flex items-center justify-between p-2 rounded-md cursor-pointer mb-1 transition-all ${
                  currentSubject?.id === subject.id ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200'
                }`}
              >
                <span className="text-sm truncate">{subject.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Añadir Asignatura</h2>
            <div className="space-y-3">
              <input 
                autoFocus
                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Nombre (ej: Cálculo I)"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
              <div className="flex gap-2">
                <select 
                  className="flex-1 border p-2 rounded text-sm outline-none"
                  value={form.semester}
                  onChange={e => setForm({...form, semester: e.target.value})}
                >
                  <option value="1">Semestre 1</option>
                  <option value="2">Semestre 2</option>
                </select>
                <input 
                  type="number"
                  className="w-24 border p-2 rounded text-sm outline-none"
                  value={form.year}
                  onChange={e => setForm({...form, year: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </aside>
  )
}
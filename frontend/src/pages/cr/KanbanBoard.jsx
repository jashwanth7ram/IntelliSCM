import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { LayoutDashboard, Clock, GripVertical, User as UserIcon, LayoutGrid } from 'lucide-react'
import { crsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/** Must match ChangeRequest.status enum on the backend */
const STATUSES = [
  'Submitted',
  'Under Review',
  'Approved',
  'Needs Modification',
  'Rejected',
  'Emergency Fix',
]

const colId = (status) => `col-${status}`

function KanbanColumn({ status, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: colId(status) })
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-zinc-900/30 rounded-2xl border min-h-[520px] w-[280px] shrink-0 transition-colors ${
        isOver ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-zinc-800/50'
      }`}
    >
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider leading-tight">{status}</h2>
        <span className="bg-zinc-800 text-zinc-500 text-[10px] px-2 py-0.5 rounded-full border border-zinc-700">
          {count}
        </span>
      </div>
      <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-0">{children}</div>
    </div>
  )
}

function KanbanCard({ cr, disabled, onOpen }) {
  const { setNodeRef, isDragging, listeners, attributes, transform } = useDraggable({
    id: `cr-${cr._id}`,
    disabled,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-zinc-900 border border-zinc-800 p-3 rounded-xl hover:border-blue-500/50 hover:bg-zinc-800/40 transition-all group shadow-lg flex gap-2 ${
        isDragging ? 'opacity-40 z-50' : ''
      }`}
    >
      {!disabled && (
        <button
          type="button"
          className="shrink-0 mt-0.5 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to change status"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={16} />
        </button>
      )}
      <button
        type="button"
        onClick={() => onOpen(cr._id)}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2">
            {cr.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {cr.labels?.slice(0, 2).map((l) => (
            <span
              key={l}
              className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
            >
              {l}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <UserIcon size={12} className="text-zinc-500" />
            </div>
            <span className="text-[10px] text-zinc-500 truncate">{cr.submittedBy?.name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-600 shrink-0">
            <Clock size={10} />
            {new Date(cr.createdAt).toLocaleDateString()}
          </div>
        </div>
      </button>
    </div>
  )
}

export default function KanbanBoard() {
  const { user } = useAuth()
  const [crs, setCrs] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [boardMsg, setBoardMsg] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  const canMoveColumns = ['Project Manager', 'CCB Member', 'Admin'].includes(user?.role)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const load = async () => {
    try {
      const [crRes, calendarRes] = await Promise.all([crsAPI.list(), crsAPI.changeCalendar()])
      setCrs(crRes.data || [])
      setConflicts(calendarRes.data?.conflicts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const getColumnCRs = (status) => crs.filter((cr) => cr.status === status)

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    setBoardMsg({ type: '', text: '' })
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || !canMoveColumns) return

    const overId = String(over.id)
    if (!overId.startsWith('col-')) return

    const newStatus = overId.slice(4)
    const crId = String(active.id).replace('cr-', '')
    const cr = crs.find((c) => c._id === crId)
    if (!cr || cr.status === newStatus) return

    setCrs((prev) => prev.map((c) => (c._id === crId ? { ...c, status: newStatus } : c)))

    try {
      await crsAPI.updateStatus(crId, {
        status: newStatus,
        comment: 'Status updated from Kanban board',
      })
      setBoardMsg({ type: 'success', text: `Moved to “${newStatus}”. Activity Hub will show this update.` })
    } catch (err) {
      setCrs((prev) => prev.map((c) => (c._id === crId ? { ...c, status: cr.status } : c)))
      setBoardMsg({
        type: 'error',
        text: err.response?.data?.error || 'Could not update status. You may not have permission.',
      })
    }
  }

  const handleDragCancel = () => setActiveId(null)

  const activeCr = activeId ? crs.find((c) => `cr-${c._id}` === String(activeId)) : null

  if (loading) return <div className="p-6 text-zinc-500">Loading Kanban...</div>

  return (
    <div className="p-4 sm:p-6 min-h-screen w-full min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
            <LayoutDashboard className="text-blue-500 shrink-0" />
            CR Kanban Board
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Drag cards between columns to change CR status (PM, CCB, Admin). Opens CR details on card click.
          </p>
        </div>
        <Link
          to="/activity"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium shrink-0"
        >
          <LayoutGrid size={16} />
          View Activity Hub
        </Link>
      </div>

      {!canMoveColumns && (
        <div className="mb-4 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-400">
          Read-only board: only <strong className="text-zinc-300">Project Manager</strong>,{' '}
          <strong className="text-zinc-300">CCB Member</strong>, or <strong className="text-zinc-300">Admin</strong>{' '}
          can drag cards to change status.
        </div>
      )}

      {boardMsg.text && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm ${
            boardMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {boardMsg.text}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-300 text-sm font-semibold">
            {conflicts.length} scheduling conflict(s) detected in change windows.
          </p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 min-w-0 [scrollbar-gutter:stable] scroll-smooth">
          {STATUSES.map((status) => (
            <KanbanColumn key={status} status={status} count={getColumnCRs(status).length}>
              {getColumnCRs(status).map((cr) => (
                <KanbanCard
                  key={cr._id}
                  cr={cr}
                  disabled={!canMoveColumns}
                  onOpen={(id) => navigate(`/crs/${id}`)}
                />
              ))}
              {getColumnCRs(status).length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                  <LayoutDashboard size={36} className="mb-2" />
                  <p className="text-xs italic">Empty</p>
                </div>
              )}
            </KanbanColumn>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCr ? (
            <div className="bg-zinc-900 border border-primary/40 p-3 rounded-xl shadow-2xl w-[248px] opacity-95">
              <p className="text-sm font-semibold text-zinc-100 line-clamp-3">{activeCr.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

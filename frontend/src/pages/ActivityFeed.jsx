import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Clock, GitCommit, LayoutGrid, FolderOpen } from 'lucide-react'
import { activityAPI, projectsAPI } from '../services/api'

const ActivityFeed = () => {
  const [activities, setActivities] = useState([])
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(true)

  const selectedProjectName = useMemo(() => {
    if (!projectId) return null
    return projects.find((p) => p._id === projectId)?.name || null
  }, [projectId, projects])

  useEffect(() => {
    projectsAPI
      .list()
      .then((r) => setProjects(r.data || []))
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true)
      setActivities([])
      try {
        const params = projectId ? { project: projectId } : {}
        const res = await activityAPI.list(params)
        setActivities(res.data || [])
      } catch (err) {
        console.error(err)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [projectId])

  return (
    <div className="p-6 max-w-4xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
            <Activity className="text-blue-500 shrink-0" />
            Activity Feed
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {projectId && selectedProjectName
              ? `Showing activity for project “${selectedProjectName}”.`
              : 'Showing activity across all projects.'}
          </p>
        </div>
        <Link
          to="/kanban"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 shrink-0"
        >
          <LayoutGrid size={16} />
          Open Kanban board
        </Link>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
          <FolderOpen size={14} className="text-zinc-400" />
          Project
        </label>
        <select
          className="w-full sm:max-w-md bg-zinc-900/80 border border-zinc-700 focus:border-primary/40 text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none transition-colors"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id} className="bg-zinc-900">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-zinc-500 mb-8 -mt-4">
        Events come from change request activity logs (including status changes). Moving a card on the Kanban board updates status and appears here.
      </p>

      {loading ? (
        <div className="py-12 text-center text-zinc-500 text-sm">Loading…</div>
      ) : activities.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30 text-zinc-500 text-sm">
          No activity entries yet
          {projectId && selectedProjectName ? ` for “${selectedProjectName}”.` : '.'}
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity, idx) => (
            <div
              key={activity.id || `${activity.entityId}-${activity.timestamp}-${idx}`}
              className="flex gap-4 relative"
            >
              {idx !== activities.length - 1 && (
                <div className="absolute left-[19px] top-[40px] bottom-[-24px] w-[2px] bg-zinc-800" />
              )}
              <div className="z-10 bg-zinc-900 p-2 rounded-full border border-zinc-700">
                <GitCommit size={20} className="text-zinc-400" />
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 flex-1 hover:bg-zinc-800/40 transition-colors min-w-0">
                <div className="flex justify-between items-start gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-white">{activity.action}</h3>
                  <span className="text-xs text-zinc-500 flex items-center gap-1 shrink-0">
                    <Clock size={12} />
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
                {!projectId && activity.projectName && (
                  <p className="text-xs text-zinc-500 mb-2">
                    <span className="text-zinc-400">{activity.projectName}</span>
                  </p>
                )}
                <p className="text-sm text-zinc-400">
                  <span className="text-blue-400 font-medium">{activity.user?.name || '—'}</span>{' '}
                  performed action on
                  <span className="text-zinc-200"> {activity.entityTitle}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActivityFeed

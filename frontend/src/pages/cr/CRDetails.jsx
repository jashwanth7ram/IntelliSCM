import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Tag, AlertCircle, CheckCircle2, History, User, GitBranch, Workflow } from 'lucide-react';
import { crsAPI, devopsAPI } from '../../services/api';

const CRDetails = () => {
    const { id } = useParams();
    const [cr, setCr] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [trace, setTrace] = useState(null);
    const [commitMsg, setCommitMsg] = useState('');

    useEffect(() => {
        const fetchCR = async () => {
            try {
                const res = await crsAPI.getById(id);
                setCr(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchCR();
    }, [id]);

    useEffect(() => {
        const loadTrace = async () => {
            try {
                const res = await devopsAPI.trace(id);
                setTrace(res.data);
            } catch { setTrace(null); }
        };
        if (id) loadTrace();
    }, [id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        try {
            const res = await crsAPI.addComment(id, { text: commentText });
            setCr({ ...cr, comments: res.data });
            setCommentText('');
        } catch (err) { console.error(err); }
    };

    const handleAddCommit = async (e) => {
        e.preventDefault();
        try {
            const res = await crsAPI.addCommit(id, { message: commitMsg || 'Simulated commit' });
            setCr({ ...cr, commits: res.data });
            setCommitMsg('');
            const tr = await devopsAPI.trace(id);
            setTrace(tr.data);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-6 text-zinc-500">Loading CR...</div>;
    if (!cr) return <div className="p-6 text-red-500">CR not found.</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{cr.title}</h1>
                    <div className="flex gap-2 mb-4">
                        {cr.labels?.map(l => (
                            <span key={l} className="px-2 py-0.5 rounded bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 flex items-center gap-1">
                                <Tag size={12} className="text-blue-500" />
                                {l}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 border ${
                    cr.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    cr.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                    {cr.status === 'Approved' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {cr.status}
                </div>
                {cr.requiresExtraApproval && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                        Extra approval required (ML / policy)
                    </span>
                )}
                </div>
            </div>

            {(cr.activePipelineRun || cr.linkedRelease) && (
                <div className="flex flex-wrap gap-3 text-sm">
                    {cr.activePipelineRun && (
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300">
                            <Workflow size={14} className="text-blue-400" />
                            Pipeline: {cr.activePipelineRun.overallStatus || '—'}
                        </span>
                    )}
                    {cr.linkedRelease && (
                        <Link to="/devops/releases" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-primary hover:text-white transition-colors">
                            Release {cr.linkedRelease.version} ({cr.linkedRelease.status})
                        </Link>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                        <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
                        <p className="text-zinc-400 leading-relaxed">{cr.description}</p>
                    </div>

                    <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <GitBranch className="text-blue-500" size={18} />
                            Linked commits (simulated)
                        </h2>
                        <ul className="space-y-2 mb-4">
                            {(cr.commits || []).length === 0 ? (
                                <li className="text-sm text-zinc-500">No commits linked yet.</li>
                            ) : (
                                cr.commits.map((c, i) => (
                                    <li key={i} className="text-sm text-zinc-400 font-mono">
                                        <span className="text-blue-400">{c.sha?.slice(0, 7)}</span> — {c.message}
                                    </li>
                                ))
                            )}
                        </ul>
                        <form onSubmit={handleAddCommit} className="flex gap-2">
                            <input
                                value={commitMsg}
                                onChange={e => setCommitMsg(e.target.value)}
                                className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white"
                                placeholder="Commit message (optional)"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">Add commit</button>
                        </form>
                    </div>

                    {trace?.timeline?.length > 0 && (
                    <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <History className="text-primary" size={18} />
                            Trace timeline
                        </h2>
                        <p className="text-xs text-zinc-500 mb-4">CR → commit → pipeline → deploy → release</p>
                        <ul className="space-y-3 border-l-2 border-zinc-700 pl-4">
                            {trace.timeline.map((t, i) => (
                                <li key={i} className="text-sm">
                                    <span className="text-zinc-500 text-xs">{new Date(t.at).toLocaleString()}</span>
                                    <div className="text-zinc-200 font-medium">{t.label}</div>
                                    {t.detail && <div className="text-zinc-500 text-xs truncate">{t.detail}</div>}
                                </li>
                            ))}
                        </ul>
                        <Link to="/devops" className="inline-block mt-4 text-sm text-primary hover:underline">Open DevOps hub</Link>
                    </div>
                    )}

                    <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="text-blue-500" />
                            Discussion
                        </h2>
                        <div className="space-y-6 mb-8">
                            {cr.comments?.map((c, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                                        <User size={20} className="text-zinc-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm font-semibold text-white">{c.user?.name}</span>
                                            <span className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="text-zinc-400 bg-zinc-800/30 p-3 rounded-xl border border-zinc-800/50">
                                            {c.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddComment} className="flex gap-4">
                            <input 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add a comment..."
                            />
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                                Post
                            </button>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase mb-4 tracking-wider">Metrics & Risk</h2>
                        <div className="space-y-4">
                             <div className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-lg">
                                <span className="text-sm text-zinc-400">Risk Score</span>
                                <span className={`text-sm font-bold ${cr.riskScore === 'High' ? 'text-red-500' : cr.riskScore === 'Medium' ? 'text-amber-400' : 'text-green-500'}`}>{cr.riskScore}</span>
                             </div>
                             {cr.aiRecommendation && (
                             <div className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-lg">
                                <span className="text-sm text-zinc-400">AI recommendation</span>
                                <span className="text-sm font-bold text-zinc-200">{cr.aiRecommendation}</span>
                             </div>
                             )}
                             <div className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-lg">
                                <span className="text-sm text-zinc-400">Assignee</span>
                                <span className="text-sm font-bold text-zinc-200">{cr.assignee?.name || 'Unassigned'}</span>
                             </div>
                             <div className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-lg">
                                <span className="text-sm text-zinc-400">Change Window</span>
                                <span className="text-sm font-bold text-zinc-200">
                                  {cr.plannedStart && cr.plannedEnd
                                    ? `${new Date(cr.plannedStart).toLocaleString()} - ${new Date(cr.plannedEnd).toLocaleString()}`
                                    : 'Not scheduled'}
                                </span>
                             </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase mb-4 tracking-wider flex items-center gap-2">
                             <History size={16} /> History
                        </h2>
                        <div className="space-y-4">
                             {cr.transitionHistory?.map((h, i) => (
                                 <div key={i} className="border-l-2 border-zinc-800 pl-4 py-1">
                                     <p className="text-xs font-bold text-zinc-300">{h.toStatus}</p>
                                     <p className="text-[10px] text-zinc-500">{new Date(h.changedAt).toLocaleDateString()}</p>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRDetails;

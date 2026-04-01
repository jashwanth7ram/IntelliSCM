import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, GitCommit, LayoutGrid } from 'lucide-react';
import { activityAPI } from '../services/api';

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await activityAPI.list();
                setActivities(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    if (loading) return <div className="p-6 text-zinc-500">Loading activity...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Activity className="text-blue-500 shrink-0" />
                    Global Activity Feed
                </h1>
                <Link
                    to="/kanban"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 shrink-0"
                >
                    <LayoutGrid size={16} />
                    Open Kanban board
                </Link>
            </div>
            <p className="text-sm text-zinc-500 mb-8 -mt-2">
                Events come from change request activity logs (including status changes). Moving a card on the Kanban board updates status and appears here.
            </p>
            <div className="space-y-6">
                {activities.map((activity, idx) => (
                    <div key={activity.id || `${activity.entityId}-${activity.timestamp}-${idx}`} className="flex gap-4 relative">
                        {idx !== activities.length - 1 && (
                            <div className="absolute left-[19px] top-[40px] bottom-[-24px] w-[2px] bg-zinc-800" />
                        )}
                        <div className="z-10 bg-zinc-900 p-2 rounded-full border border-zinc-700">
                            <GitCommit size={20} className="text-zinc-400" />
                        </div>
                        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 flex-1 hover:bg-zinc-800/40 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-white">{activity.action}</h3>
                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(activity.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-400 mb-3">
                                <span className="text-blue-400 font-medium">{activity.user?.name}</span> performed action on 
                                <span className="text-zinc-200"> {activity.entityTitle}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;

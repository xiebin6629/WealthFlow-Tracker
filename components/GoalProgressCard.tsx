import React from 'react';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';

interface GoalProgressCardProps {
    title: string;
    current: number;
    target: number;
    unit?: string;
    icon?: React.ReactNode;
    colorClass?: string;
    isPrivacyMode?: boolean;
}

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
    title,
    current,
    target,
    unit = 'RM',
    icon,
    colorClass = 'blue',
    isPrivacyMode = false
}) => {
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    const isComplete = current >= target;

    const getColorVars = () => {
        switch (colorClass) {
            case 'emerald':
                return {
                    bg: 'var(--success-50)',
                    progress: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                    text: 'var(--success-600)',
                    glow: 'rgba(16, 185, 129, 0.3)'
                };
            case 'indigo':
                return {
                    bg: 'var(--primary-50)',
                    progress: 'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)',
                    text: '#6366F1',
                    glow: 'rgba(99, 102, 241, 0.3)'
                };
            case 'amber':
                return {
                    bg: 'var(--warning-50)',
                    progress: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)',
                    text: '#D97706',
                    glow: 'rgba(245, 158, 11, 0.3)'
                };
            default:
                return {
                    bg: 'var(--primary-50)',
                    progress: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
                    text: 'var(--primary-600)',
                    glow: 'rgba(59, 130, 246, 0.3)'
                };
        }
    };

    const colors = getColorVars();

    return (
        <div
            className="p-5 rounded-xl border transition-all hover:shadow-lg"
            style={{
                background: 'var(--card-bg)',
                borderColor: isComplete ? 'var(--success-400)' : 'var(--card-border)',
                boxShadow: isComplete ? `0 0 20px ${colors.glow}` : undefined
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {icon || <Target size={18} style={{ color: colors.text }} />}
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</span>
                </div>
                {isComplete && (
                    <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--success-100)', color: 'var(--success-600)' }}>
                        <CheckCircle2 size={14} />
                        达成!
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {isPrivacyMode ? '****' : `${unit} ${current.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    / {isPrivacyMode ? '****' : `${unit} ${target.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                        width: `${progress}%`,
                        background: isComplete ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' : colors.progress,
                    }}
                />
            </div>

            <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{progress.toFixed(1)}%</span>
                <span>
                    {isPrivacyMode ? '****' : (current >= target
                        ? `超额 ${unit} ${(current - target).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : `还差 ${unit} ${(target - current).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    )}
                </span>
            </div>
        </div>
    );
};

export default GoalProgressCard;

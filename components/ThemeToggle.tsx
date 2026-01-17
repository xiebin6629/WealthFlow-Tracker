/**
 * ThemeToggle - 主题切换按钮组件
 * 带动画效果的 Light/Dark 模式切换
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
    isDark: boolean;
    onToggle: () => void;
    className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle, className = '' }) => {
    return (
        <button
            onClick={onToggle}
            className={`
        relative w-14 h-7 rounded-full p-1
        transition-all duration-300 ease-in-out
        ${isDark
                    ? 'bg-slate-700 border border-slate-600'
                    : 'bg-blue-100 border border-blue-200'
                }
        hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
            aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
            {/* 滑动圆球 */}
            <span
                className={`
          absolute top-0.5 w-6 h-6 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isDark
                        ? 'left-7 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30'
                        : 'left-0.5 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30'
                    }
        `}
            >
                {isDark ? (
                    <Moon size={14} className="text-white" />
                ) : (
                    <Sun size={14} className="text-white" />
                )}
            </span>

            {/* 背景图标 */}
            <span className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
                <Sun
                    size={12}
                    className={`transition-opacity duration-300 ${isDark ? 'opacity-30 text-slate-500' : 'opacity-0'}`}
                />
                <Moon
                    size={12}
                    className={`transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-30 text-blue-400'}`}
                />
            </span>
        </button>
    );
};

export default ThemeToggle;

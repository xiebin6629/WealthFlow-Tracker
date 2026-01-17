/**
 * useTheme Hook - 主题切换功能
 * 支持 Light/Dark 模式切换，自动保存用户偏好
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'WF_THEME';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        // 从 localStorage 读取
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
            // 检测系统偏好
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'dark'; // 默认深色模式（金融应用常用）
    });

    // 应用主题到 DOM
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        // 更新 body 类名以便 Tailwind 使用
        if (theme === 'dark') {
            document.body.classList.add('dark');
            document.body.classList.remove('light');
        } else {
            document.body.classList.add('light');
            document.body.classList.remove('dark');
        }
    }, [theme]);

    // 监听系统主题变化
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            // 只有当用户没有手动设置时才自动切换
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (!saved) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const setLightTheme = useCallback(() => setTheme('light'), []);
    const setDarkTheme = useCallback(() => setTheme('dark'), []);

    return {
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        toggleTheme,
        setTheme,
        setLightTheme,
        setDarkTheme,
    };
};

export default useTheme;

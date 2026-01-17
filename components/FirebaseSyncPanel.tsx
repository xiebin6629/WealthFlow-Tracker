
/**
 * Firebase Sync Panel - Firebase 云同步面板组件
 * 提供 Firebase 登录、数据同步功能
 */

import React, { useState, useEffect } from 'react';
import { Loader2, LogOut, Cloud, RefreshCw, CheckCircle2, AlertCircle, User } from 'lucide-react';
import {
    initFirebase,
    signInWithGoogle,
    signOutFirebase,
    getUserInfo,
    saveDataToFirebase,
    loadDataFromFirebase,
    subscribeToDataChanges,
    isFirebaseLoaded,
    onAuthStateChanged,
    UserData
} from '../services/firebaseService';

interface FirebaseSyncPanelProps {
    currentData: UserData;
    onDataLoaded: (data: UserData) => void;
}

const FirebaseSyncPanel: React.FC<FirebaseSyncPanelProps> = ({ currentData, onDataLoaded }) => {
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

    // 初始化 Firebase
    useEffect(() => {
        const checkFirebase = setInterval(() => {
            if (isFirebaseLoaded()) {
                const initialized = initFirebase();
                if (initialized) {
                    setIsFirebaseReady(true);
                    clearInterval(checkFirebase);
                }
            }
        }, 500);

        return () => clearInterval(checkFirebase);
    }, []);

    // 监听认证状态
    useEffect(() => {
        if (!isFirebaseReady) return;

        const unsubscribe = onAuthStateChanged((authUser) => {
            setUser(authUser);
        });

        return unsubscribe;
    }, [isFirebaseReady]);

    // 实时同步监听
    useEffect(() => {
        if (!user || !autoSyncEnabled) return;

        const unsubscribe = subscribeToDataChanges((data) => {
            if (data) {
                // 检查是否是来自其他设备的更新
                const cloudTime = new Date(data.lastUpdated).getTime();
                const localTime = lastSyncTime ? lastSyncTime.getTime() : 0;

                if (cloudTime > localTime + 1000) { // 1秒容差
                    onDataLoaded(data);
                    setLastSyncTime(new Date(data.lastUpdated));
                    setSyncStatus('success');
                }
            }
        });

        return unsubscribe || undefined;
    }, [user, autoSyncEnabled, lastSyncTime, onDataLoaded]);

    // 登录
    const handleLogin = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            await signInWithGoogle();
            // 登录成功后自动加载云端数据
            const cloudData = await loadDataFromFirebase();
            if (cloudData) {
                onDataLoaded(cloudData);
                setLastSyncTime(new Date(cloudData.lastUpdated));
                setSyncStatus('success');
            }
        } catch (error: any) {
            setErrorMessage(error.message || '登录失败');
            setSyncStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // 登出
    const handleLogout = async () => {
        try {
            await signOutFirebase();
            setUser(null);
            setLastSyncTime(null);
            setSyncStatus('idle');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // 手动保存到云端
    const handleSaveToCloud = async () => {
        if (!user) return;

        setIsLoading(true);
        setSyncStatus('syncing');
        setErrorMessage('');

        try {
            await saveDataToFirebase(currentData);
            setLastSyncTime(new Date());
            setSyncStatus('success');
        } catch (error: any) {
            setErrorMessage(error.message || '保存失败');
            setSyncStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // 手动从云端加载
    const handleLoadFromCloud = async () => {
        if (!user) return;

        setIsLoading(true);
        setSyncStatus('syncing');
        setErrorMessage('');

        try {
            const data = await loadDataFromFirebase();
            if (data) {
                onDataLoaded(data);
                setLastSyncTime(new Date(data.lastUpdated));
                setSyncStatus('success');
            } else {
                setErrorMessage('云端暂无数据');
                setSyncStatus('error');
            }
        } catch (error: any) {
            setErrorMessage(error.message || '加载失败');
            setSyncStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const userInfo = getUserInfo();

    // Firebase 未就绪
    if (!isFirebaseReady) {
        return (
            <div
                className="rounded-xl p-4 border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
            >
                <div className="flex items-center gap-2 mb-3 text-sm uppercase font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <Cloud size={16} /> Firebase 云同步
                </div>
                <div className="flex items-center justify-center gap-2 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Loader2 size={16} className="animate-spin" />
                    正在初始化...
                </div>
            </div>
        );
    }

    return (
        <div
            className="rounded-xl p-4 border transition-all"
            style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-sm)'
            }}
        >
            <div className="flex items-center gap-2 mb-3 text-sm uppercase font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <Cloud size={16} />
                Firebase 云同步
                {syncStatus === 'success' && <CheckCircle2 size={14} className="text-emerald-500" />}
                {syncStatus === 'error' && <AlertCircle size={14} className="text-rose-500" />}
            </div>

            {!user ? (
                // 未登录状态
                <div className="space-y-3">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        使用 Google 账号登录，在多设备间同步数据
                    </p>
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${isLoading
                            ? 'cursor-not-allowed opacity-70'
                            : 'text-white'
                            }`}
                        style={{
                            background: isLoading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                            color: isLoading ? 'var(--text-muted)' : 'white'
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} /> 登录中...
                            </>
                        ) : (
                            <>
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                                    alt="G"
                                    className="w-4 h-4 bg-white rounded-full p-0.5"
                                />
                                使用 Google 登录
                            </>
                        )}
                    </button>

                    {errorMessage && (
                        <p className="text-xs text-rose-400 text-center">{errorMessage}</p>
                    )}
                </div>
            ) : (
                // 已登录状态
                <div className="space-y-3">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'var(--bg-tertiary)' }}>
                        {userInfo?.photoURL ? (
                            <img
                                src={userInfo.photoURL}
                                alt="avatar"
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                                <User size={16} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {userInfo?.displayName || 'User'}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                {userInfo?.email}
                            </p>
                        </div>
                    </div>

                    {/* 同步按钮 */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleSaveToCloud}
                            disabled={isLoading}
                            className="btn btn-success flex-col py-3 text-xs gap-1"
                        >
                            {isLoading && syncStatus === 'syncing' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Cloud size={18} />
                            )}
                            保存到云端
                        </button>
                        <button
                            onClick={handleLoadFromCloud}
                            disabled={isLoading}
                            className="btn btn-primary flex-col py-3 text-xs gap-1"
                        >
                            {isLoading && syncStatus === 'syncing' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <RefreshCw size={18} />
                            )}
                            从云端加载
                        </button>
                    </div>

                    {/* 自动同步开关 */}
                    <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>实时同步</span>
                        <button
                            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                            className={`w-10 h-5 rounded-full transition-colors`}
                            style={{ background: autoSyncEnabled ? 'var(--success-500)' : 'var(--bg-tertiary)' }}
                        >
                            <div
                                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoSyncEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* 同步状态 */}
                    {lastSyncTime && (
                        <div className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                            上次同步: {lastSyncTime.toLocaleString()}
                        </div>
                    )}

                    {errorMessage && (
                        <p className="text-xs text-rose-400 text-center">{errorMessage}</p>
                    )}

                    {/* 登出按钮 */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors border"
                        style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)',
                            borderColor: 'var(--border-default)'
                        }}
                    >
                        <LogOut size={14} /> 退出登录
                    </button>
                </div>
            )}
        </div>
    );
};

export default FirebaseSyncPanel;

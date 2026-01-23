/**
 * Firebase Service - 云端数据同步
 * 使用 Firebase Firestore 实现多设备数据同步
 */

import { Asset, GlobalSettings, FireProjectionSettings, YearlyRecord, DividendRecord, Loan, InvestmentTransaction } from '../types';
import { firebaseConfig } from '../firebase.config';

// Firebase SDK 通过 CDN 加载，这些是全局类型声明
declare global {
    interface Window {
        firebase: any;
    }
}

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;
let currentUser: any = null;
let authStateListeners: Array<(user: any) => void> = [];

// 用户数据结构
export interface UserData {
    assets: Asset[];
    settings: GlobalSettings;
    fireSettings: FireProjectionSettings;
    yearlyRecords: YearlyRecord[];
    dividendRecords?: DividendRecord[];
    loans?: Loan[];
    investmentTransactions?: InvestmentTransaction[];
    lastUpdated: string;
}

// 检查 Firebase SDK 是否已加载
export const isFirebaseLoaded = (): boolean => {
    return typeof window !== 'undefined' &&
        window.firebase &&
        window.firebase.app;
};

// 初始化 Firebase
export const initFirebase = (): boolean => {
    if (!isFirebaseLoaded()) {
        console.warn('Firebase SDK not loaded yet.');
        return false;
    }

    try {
        // 检查是否已经初始化
        if (!firebaseApp) {
            // 检查是否已有初始化的 app
            try {
                firebaseApp = window.firebase.app();
            } catch {
                firebaseApp = window.firebase.initializeApp(firebaseConfig);
            }
        }

        firebaseAuth = window.firebase.auth();
        firebaseDb = window.firebase.firestore();

        // 监听认证状态变化
        firebaseAuth.onAuthStateChanged((user: any) => {
            currentUser = user;
            // 通知所有监听器
            authStateListeners.forEach(listener => listener(user));
        });

        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
};

// 添加认证状态监听器
export const onAuthStateChanged = (callback: (user: any) => void): (() => void) => {
    authStateListeners.push(callback);

    // 如果已经有用户，立即调用
    if (currentUser !== null) {
        callback(currentUser);
    }

    // 返回取消监听函数
    return () => {
        authStateListeners = authStateListeners.filter(l => l !== callback);
    };
};

// 使用 Google 登录
export const signInWithGoogle = async (): Promise<any> => {
    if (!firebaseAuth) {
        // 尝试初始化
        if (!initFirebase()) {
            throw new Error('Firebase not initialized. Please refresh the page.');
        }
    }

    const provider = new window.firebase.auth.GoogleAuthProvider();

    try {
        const result = await firebaseAuth.signInWithPopup(provider);
        currentUser = result.user;
        return result.user;
    } catch (error: any) {
        console.error('Google sign-in error:', error);
        if (error.code === 'auth/popup-blocked') {
            throw new Error('弹窗被阻止，请允许此网站的弹窗');
        } else if (error.code === 'auth/cancelled-popup-request') {
            throw new Error('登录已取消');
        }
        throw error;
    }
};

// 登出
export const signOutFirebase = async (): Promise<void> => {
    if (!firebaseAuth) {
        throw new Error('Firebase not initialized');
    }

    await firebaseAuth.signOut();
    currentUser = null;
};

// 获取当前用户
export const getCurrentUser = (): any => {
    return currentUser;
};

// 检查是否已登录
export const isLoggedIn = (): boolean => {
    return currentUser !== null;
};

// 保存数据到 Firestore
export const saveDataToFirebase = async (data: UserData): Promise<void> => {
    if (!firebaseDb || !currentUser) {
        throw new Error('请先登录');
    }

    const userDocRef = firebaseDb
        .collection('users')
        .doc(currentUser.uid);

    await userDocRef.set({
        ...data,
        lastUpdated: new Date().toISOString(),
        email: currentUser.email,
    }, { merge: true });
};

// 从 Firestore 加载数据
export const loadDataFromFirebase = async (): Promise<UserData | null> => {
    if (!firebaseDb || !currentUser) {
        throw new Error('请先登录');
    }

    const userDocRef = firebaseDb
        .collection('users')
        .doc(currentUser.uid);

    const doc = await userDocRef.get();

    if (doc.exists) {
        return doc.data() as UserData;
    }

    return null;
};

// 实时监听数据变化（用于多设备同步）
export const subscribeToDataChanges = (
    callback: (data: UserData | null) => void
): (() => void) | null => {
    if (!firebaseDb || !currentUser) {
        console.warn('Not authenticated or Firebase not initialized');
        return null;
    }

    const userDocRef = firebaseDb
        .collection('users')
        .doc(currentUser.uid);

    // 返回取消订阅函数
    const unsubscribe = userDocRef.onSnapshot((doc: any) => {
        if (doc.exists) {
            callback(doc.data() as UserData);
        } else {
            callback(null);
        }
    }, (error: any) => {
        console.error('Firestore subscription error:', error);
    });

    return unsubscribe;
};

// 获取用户信息
export const getUserInfo = (): { displayName: string; email: string; photoURL: string } | null => {
    if (!currentUser) return null;

    return {
        displayName: currentUser.displayName || 'User',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
    };
};

// 检查 Firebase 是否已初始化
export const isFirebaseInitialized = (): boolean => {
    return firebaseApp !== null && firebaseAuth !== null && firebaseDb !== null;
};

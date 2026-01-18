 import { Client, Account, Databases, ID, Query, Storage, OAuthProvider }  from 'react-native-appwrite'; import { runtimeConfig } from '../config/runtimeConfig'; 
import * as FileSystem from 'expo-file-system/legacy'; import * as Linking from 'expo-linking'; import * as WebBrowser from 'expo-web-browser';

const PROJECT_ID = runtimeConfig.appwrite.projectId; const DATABASE_ID = runtimeConfig.appwrite.databaseId; const MEMORIES_COL_ID = runtimeConfig.appwrite.memoriesCollectionId; const PAIRS_COL_ID = runtimeConfig.appwrite.pairsCollectionId; const BUCKET_ID = runtimeConfig.appwrite.bucketId;

export const client = new Client()
    .setEndpoint(runtimeConfig.appwrite.endpoint)
    .setProject(PROJECT_ID)
    .setPlatform('com.lovetracker.app');

export const databases = new Databases(client); export const account = new Account(client); const storage = new Storage(client);

export const api = { _requireUserId: (userId: string | null | undefined) => { if (!userId) { throw new Error('AUTH_REQUIRED'); } return userId; },

// Загрузка изображения (оптимизировано для React Native + Expo SDK 54)

uploadImage: async (uri: string, filename?: string): Promise<string> => {
    try {
        const fileId = ID.unique();
        const formData = new FormData();
        
        // Формируем объект файла так, как его понимает React Native
        formData.append('fileId', fileId);
        formData.append('file', {
            uri: uri,
            name: filename || `photo_${Date.now()}.jpg`,
            type: 'image/jpeg',
        } as any);

        // Используем fetch напрямую, чтобы обойти баг в SDK
        const response = await fetch(
            `${runtimeConfig.appwrite.endpoint}/storage/buckets/${BUCKET_ID}/files`,
            {
                method: 'POST',
                headers: {
                    'X-Appwrite-Project': PROJECT_ID,
                    'X-Appwrite-Response-Format': '0.15.0', // Важно указать версию
                    // Не указывайте Content-Type вручную, fetch сам поставит multipart/form-data с boundary
                },
                body: formData,
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ошибка при загрузке файла через fetch');
        }

        // Получаем URL загруженного файла
        const fileUrl = storage.getFileView(BUCKET_ID, result.$id);
        
        // Очистка временного файла
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (e) {
            console.warn('Не удалось удалить временный файл');
        }

        return fileUrl.toString();
    } catch (error: any) {
        console.error("Критическая ошибка загрузки:", error);
        throw error;
    }
},

createPair: async (userId: string | null, startDate: string | null) => {
    try {
        userId = api._requireUserId(userId);
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const pair = await databases.createDocument(DATABASE_ID, PAIRS_COL_ID, ID.unique(), {
            inviteCode: inviteCode,
            users: [userId],
            startDate: startDate || new Date().toISOString(),
            status: "waiting"
        });
        
        return { pair_id: pair.$id, invite_code: inviteCode, start_date: pair.startDate };
    } catch (error: any) {
        console.error("Ошибка создания пары:", error);
        throw error;
    }
},

joinPair: async (userId: string | null, inviteCode: string) => {
    userId = api._requireUserId(userId);
    const response = await databases.listDocuments(DATABASE_ID, PAIRS_COL_ID, [
        Query.equal('inviteCode', inviteCode.toUpperCase())
    ]);

    if (response.documents.length === 0) throw new Error('Код не найден');
    const pair = response.documents[0];
    
    const updated = await databases.updateDocument(DATABASE_ID, PAIRS_COL_ID, pair.$id, {
        users: [...pair.users, userId],
        status: "active"
    });
    
    return {
        pair_id: updated.$id,
        start_date: updated.startDate || pair.startDate,
        status: updated.status
    };
},

checkInviteCode: async (inviteCode: string) => {
    const code = inviteCode?.toUpperCase?.() || inviteCode;
    if (!code) return { exists: false };
    try {
        const response = await databases.listDocuments(DATABASE_ID, PAIRS_COL_ID, [
            Query.equal('inviteCode', code)
        ]);
        if (response.documents.length === 0) return { exists: false };
        const pair = response.documents[0] as any;
        return { exists: true, pair_id: pair.$id };
    } catch (e: any) {
        console.error("Ошибка проверки invite-кода:", e);
        throw e;
    }
},

getPairData: async (userUid: string | null) => {
    try {
        userUid = api._requireUserId(userUid);
        const response = await databases.listDocuments(DATABASE_ID, PAIRS_COL_ID, [
            Query.contains('users', [userUid])
        ]);

        if (response.documents.length === 0) return null;
        const pair = response.documents[0];
        return {
            pair_id: pair.$id,
            invite_code: pair.inviteCode,
            start_date: pair.startDate,
            users: pair.users,
            status: pair.status
        };
    } catch (e: any) {
        console.error("Ошибка получения данных пары:", e);
        return null;
    }
},

getMemories: async (userUid: string | null) => {
    try {
        userUid = api._requireUserId(userUid);
        const pairResponse = await databases.listDocuments(DATABASE_ID, PAIRS_COL_ID, [
            Query.contains('users', [userUid])
        ]);

        if (pairResponse.documents.length === 0) return [];
        const pairId = pairResponse.documents[0].$id;

        const response = await databases.listDocuments(DATABASE_ID, MEMORIES_COL_ID, [
            Query.equal('pairId', pairId),
            Query.orderDesc('date')
        ]);

        return response.documents.map((doc: any) => {
            let imageUrl = doc.content;
            let note = doc.note;
            
            return {
                id: doc.$id,
                date: doc.date,
                dayCount: doc.dayCount || 0,
                imageUrl: imageUrl,
                note: note,
                noteA: doc.noteA || doc.note || undefined,
                noteB: doc.noteB || undefined,
                authorA: doc.authorA || undefined,
                authorB: doc.authorB || undefined,
                isPrivate: doc.isPrivate || false,
                lockedUntil: doc.lockedUntil || undefined,
                milestoneReached: doc.milestoneReached || false,
            };
        });
    } catch (e) {
        return [];
    }
},

addMemory: async (userUid: string | null, memoryData: { type?: string, content: string, note: string, noteA?: string, authorA?: string, date: string, dayCount: number }) => {
    userUid = api._requireUserId(userUid);
    const pairResponse = await databases.listDocuments(DATABASE_ID, PAIRS_COL_ID, [
        Query.contains('users', [userUid])
    ]);

    if (pairResponse.documents.length === 0) {
        throw new Error('Пара не найдена');
    }
    
    const pairId = pairResponse.documents[0].$id;
    
    const docData: any = {
        pairId: pairId,
        content: memoryData.content,
        note: memoryData.note,
        date: memoryData.date,
        dayCount: memoryData.dayCount
    };
    
    if (memoryData.noteA !== undefined) docData.noteA = memoryData.noteA;
    if (memoryData.authorA) docData.authorA = memoryData.authorA;
    
    return await databases.createDocument(DATABASE_ID, MEMORIES_COL_ID, ID.unique(), docData);
},

updateMemory: async (userUid: string | null, memoryId: string, updates: Partial<{ noteB: string; authorB: string; noteA: string; authorA: string }>) => {
    userUid = api._requireUserId(userUid);
    try {
        const updated = await databases.updateDocument(DATABASE_ID, MEMORIES_COL_ID, memoryId, updates);
        return updated;
    } catch (e: any) {
        console.error("Ошибка обновления воспоминания:", e);
        throw new Error(e.message || 'Не удалось обновить воспоминание');
    }
},

deleteMemory: async (userUid: string | null, memoryId: string) => {
    userUid = api._requireUserId(userUid);
    try {
        const memoryDoc = await databases.getDocument(DATABASE_ID, MEMORIES_COL_ID, memoryId);
        
        if (memoryDoc.content && typeof memoryDoc.content === 'string' && memoryDoc.content.includes('/files/')) {
            try {
                const fileId = memoryDoc.content.split('/files/')[1]?.split('/')[0];
                if (fileId) {
                    await storage.deleteFile(BUCKET_ID, fileId);
                }
            } catch (e) {
                console.warn('Не удалось удалить файл из Storage:', e);
            }
        }
        
        await databases.deleteDocument(DATABASE_ID, MEMORIES_COL_ID, memoryId);
        return true;
    } catch (e: any) {
        console.error("Ошибка удаления воспоминания:", e);
        throw new Error(e.message || 'Не удалось удалить воспоминание');
    }
},

uploadMemory: async (userUid: string | null, fileUri: string, note?: string) => {
    try {
        userUid = api._requireUserId(userUid);
        
        // 1. Получаем данные пары
        const pairResponse = await databases.listDocuments(DATABASE_ID, PAIRS_COL_ID, [
            Query.contains('users', [userUid])
        ]);

        if (pairResponse.documents.length === 0) {
            throw new Error('Пара не найдена. Создайте пару в настройках.');
        }
        
        const pair = pairResponse.documents[0];
        const pairId = pair.$id;
        const startDate = pair.startDate;

        // 2. Загружаем фото в Storage
        const imageUrl = await api.uploadImage(fileUri);

        // 3. Вычисляем dayCount
        const dayCount = startDate 
            ? Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1;

        // 4. Создаем запись в базе данных
        const memory = await databases.createDocument(DATABASE_ID, MEMORIES_COL_ID, ID.unique(), {
            pairId: pairId,
            content: imageUrl,
            note: note || '',
            noteA: note || '',
            authorA: userUid,
            date: new Date().toISOString(),
            dayCount: dayCount,
            isPrivate: false,
            milestoneReached: false
        });

        return {
            id: memory.$id,
            imageUrl: imageUrl,
            note: note || '',
            date: memory.date,
            dayCount: dayCount
        };
    } catch (error: any) {
        console.error('Ошибка сохранения истории:', error);
        throw new Error(error.message || 'Не удалось сохранить историю');
    }
},

exportAllData: async (userUid: string | null) => {
    try {
        userUid = api._requireUserId(userUid);
        const pairData = await api.getPairData(userUid);
        const memories = await api.getMemories(userUid);
        
        return {
            user: {
                uid: userUid,
                exportDate: new Date().toISOString()
            },
            pair: pairData,
            memories: memories,
            metadata: {
                totalMemories: memories.length,
                exportFormat: 'json',
                version: '1.0'
            }
        };
    } catch (e: any) {
        console.error("Ошибка экспорта данных:", e);
        throw new Error(e.message || 'Не удалось экспортировать данные');
    }
},

getCurrentSession: async () => {
    try {
        const session = await account.get();
        return {
            sessionId: session.$id,
            userId: session.$id,
            email: session.email,
            name: session.name
        };
    } catch (error: any) {
        return null;
    }
},

logout: async () => {
    try {
        await account.deleteSession('current');
    } catch (error: any) {
        console.error("Ошибка выхода:", error);
        throw error;
    }
},

createAnonymousSession: async () => {
    try {
        const session = await account.createAnonymousSession();
        const user = await account.get();
        return {
            sessionId: session.$id,
            userId: user.$id,
            isAnonymous: true
        };
    } catch (error: any) {
        console.error("Ошибка анонимного входа:", error);
        throw new Error(error.message || 'Не удалось создать анонимную сессию');
    }
},

registerWithEmail: async (email: string, password: string, name?: string) => {
    try {
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();
        // ВАЖНО: Appwrite не принимает пустую строку в качестве имени. Если имя не введено, передаем undefined.
        const cleanName = name?.trim() ? name.trim() : undefined;

        const userId = ID.unique();

        console.log("=== НАЧАЛО РЕГИСТРАЦИИ ===");
        console.log("Project ID:", PROJECT_ID);
        console.log("Endpoint:", runtimeConfig.appwrite.endpoint);
        console.log("User ID:", userId);
        console.log("Email:", cleanEmail);
        console.log("Password Length:", cleanPassword.length);
        console.log("Name:", cleanName);

        // 1. Создание пользователя
        try {
            console.log("Отправка запроса account.create...");
            // Явно разделяем логику: если имя есть, передаем его, если нет — вызываем с 3 аргументами
            if (cleanName) {
                await account.create(userId, cleanEmail, cleanPassword, cleanName);
            } else {
                await account.create(userId, cleanEmail, cleanPassword);
            }
            console.log("Пользователь успешно создан!");
        } catch (createError: any) {
            console.error("ОШИБКА ПРИ СОЗДАНИИ ПОЛЬЗОВАТЕЛЯ (account.create):", createError);
            // Пробрасываем ошибку дальше, чтобы её поймал внешний catch
            throw createError;
        }

        // ВАЖНО: Удаляем старую сессию, если она есть в памяти
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Если сессии не было — просто идем дальше, это не ошибка
        }

        // 2. Создание сессии
        try {
             console.log("Создание сессии (авто-вход)...");
             const session = await account.createEmailPasswordSession(cleanEmail, cleanPassword);
             console.log("Сессия успешно создана!");
             const user = await account.get();
             
             return {
                sessionId: session.$id,
                userId: user.$id,
                email: user.email,
                name: user.name
            };
        } catch (sessionError: any) {
            console.error("ОШИБКА ПРИ СОЗДАНИИ СЕССИИ (createEmailPasswordSession):", sessionError);
            throw sessionError;
        }

    } catch (error: any) {
        console.error("ПОЛНАЯ ОШИБКА APPWRITE (Register):", {
            code: error.code,
            type: error.type,
            message: error.message,
            response: error.response
        });

        if (error.code === 409) {
            throw new Error('Пользователь с таким email уже существует');
        }
        if (error.code === 400) {
             throw new Error(`Некорректные данные: ${error.message}. (Возможно: пароль слишком простой или имя содержит недопустимые символы)`);
        }
        throw new Error(error.message || 'Не удалось зарегистрироваться');
    }
},

loginWithEmail: async (email: string, password: string) => {
    try {
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        const session = await account.createEmailPasswordSession(cleanEmail, cleanPassword);
        const user = await account.get();
        return {
            sessionId: session.$id,
            userId: user.$id,
            email: user.email,
            name: user.name
        };
    } catch (error: any) {
        console.error("ПОЛНАЯ ОШИБКА APPWRITE (Login):", {
            code: error.code,
            type: error.type,
            message: error.message,
            response: error.response
        });

        if (error.code === 401) {
            throw new Error('Неверный email или пароль');
        }
        if (error.code === 400) {
            throw new Error(`Ошибка данных: ${error.message}`);
        }
        throw new Error(error.message || 'Неверный логин или пароль');
    }
},

// ========== АУТЕНТИФИКАЦИЯ (Email/Password) ==========
};
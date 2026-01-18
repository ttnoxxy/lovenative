import { useEffect, useRef } from 'react';
import { client, account } from '../services/api';
import { runtimeConfig } from '../config/runtimeConfig';

export const useSocket = (userUid: string | null, onMessage: (data: any) => void) => {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const onMessageRef = useRef(onMessage);

  // Обновляем ref при каждом рендере, но не вызываем переподписку
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userUid) {
      // Отключаемся, если нет пользователя
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    const DATABASE_ID = runtimeConfig.appwrite.databaseId;

    const connectRealtime = async () => {
      // Предотвращаем множественные попытки подключения
      if (isConnectingRef.current) {
        return;
      }

      try {
        // Проверяем наличие активной сессии перед подключением
        try {
          const session = await account.getSession('current');
          if (!session) {
            console.log("Нет активной сессии, пропускаем подключение к Realtime");
            return;
          }
        } catch (sessionError) {
          // Если нет сессии, не подключаемся к Realtime
          console.log("Не удалось получить сессию, пропускаем Realtime:", sessionError);
          return;
        }

        isConnectingRef.current = true;

        // Отключаем предыдущее соединение, если есть
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }

        const unsubscribe = client.subscribe(
          [
            `databases.${DATABASE_ID}.collections.pairs.documents`,
            `databases.${DATABASE_ID}.collections.memories.documents`
          ],
          (response) => {
            console.log("🔔 Получен сигнал из облака:", response);
            // Используем ref вместо прямого вызова onMessage
            onMessageRef.current({
              type: 'updated',
              payload: response.payload
            });
          }
        );

        unsubscribeRef.current = unsubscribe;
        isConnectingRef.current = false;
      } catch (err: any) {
        isConnectingRef.current = false;
        console.error("Ошибка подключения к Realtime:", err);
        
        // Для ошибок 401 (нет авторизации) не переподключаемся
        if (err.code === 401) {
          console.log("Нет авторизации для Realtime, отключаемся");
          return;
        }
        
        // Для других ошибок не переподключаемся вручную - Appwrite SDK делает это сам
        // Убираем ручное переподключение, чтобы избежать множественных попыток
      }
    };

    // Небольшая задержка перед подключением, чтобы убедиться, что сессия установлена
    const timeoutId = setTimeout(() => {
      connectRealtime();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [userUid]); // Убрали onMessage из зависимостей
};

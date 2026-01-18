import Constants from 'expo-constants';

export const runtimeConfig = {
  appwrite: {
    endpoint: Constants.expoConfig?.extra?.appwriteEndpoint ?? 'https://cloud.appwrite.io/v1',
    projectId: Constants.expoConfig?.extra?.appwriteProjectId ?? '6952ef2a0008e43e1ef4',
    databaseId: Constants.expoConfig?.extra?.appwriteDatabaseId ?? '6952ef770001c0ec13da',
    bucketId: Constants.expoConfig?.extra?.appwriteBucketId ?? '6952ef890005459757ad',
    pairsCollectionId: Constants.expoConfig?.extra?.appwritePairsCollectionId ?? 'pairs',
    memoriesCollectionId: Constants.expoConfig?.extra?.appwriteMemoriesCollectionId ?? 'memories',
  },
  gemini: {
    apiKey: Constants.expoConfig?.extra?.geminiApiKey,
  },
};



export const getAvatarInitial = (authorId: string, userUid: string | null, language: 'en' | 'ru'): string => {
  if (authorId === userUid) {
    return language === 'ru' ? 'Я' : 'Me';
  }
  return authorId.charAt(0).toUpperCase();
};
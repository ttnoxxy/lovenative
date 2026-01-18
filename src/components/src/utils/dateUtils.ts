
export const formatDateBadge = (date: string | Date, language: 'en' | 'ru'): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};
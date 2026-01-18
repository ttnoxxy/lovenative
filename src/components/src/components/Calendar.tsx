import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { UserSettings, CustomEvent } from '../types';
import { translations } from '../utils/translations';
import { Calendar as CalendarIcon, Heart, Plane, Sparkles, Clock } from 'lucide-react-native';
import NoiseOverlay from './NoiseOverlay';

interface CalendarProps {
  settings: UserSettings;
  onEventClick?: (event: CustomEvent) => void;
}

const Calendar: React.FC<CalendarProps> = ({ settings, onEventClick }) => {
  const t = translations[settings.language];

  const upcomingEvents = useMemo(() => {
    if (!settings.startDate) return [];

    const events: Array<CustomEvent & { daysUntil: number; isToday: boolean; isPast: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    settings.customEvents.forEach(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      if (event.isRecurring) {
        const currentYear = today.getFullYear();
        for (let year = currentYear; year <= currentYear + 1; year++) {
          const anniversaryDate = new Date(eventDate);
          anniversaryDate.setFullYear(year);
          
          const daysUntil = Math.ceil((anniversaryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil >= -7 && daysUntil <= 90) {
            events.push({
              ...event,
              daysUntil,
              isToday: daysUntil === 0,
              isPast: daysUntil < 0
            });
          }
        }
      } else {
        const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= -7 && daysUntil <= 90) {
          events.push({
            ...event,
            daysUntil,
            isToday: daysUntil === 0,
            isPast: daysUntil < 0
          });
        }
      }
    });

    return events.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [settings.customEvents, settings.startDate]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'anniversary': return <Heart size={16} color="#f43f5e" />;
      case 'vacation': return <Plane size={16} color="#0ea5e9" />;
      case 'holiday': return <Sparkles size={16} color="#10b981" />;
      default: return <CalendarIcon size={16} color="#9c88ff" />;
    }
  };

  const formatDaysUntil = (days: number, lang: string) => {
    if (days < 0) {
      return lang === 'ru' ? `${Math.abs(days)} дней назад` : `${Math.abs(days)} days ago`;
    } else if (days === 0) {
      return lang === 'ru' ? 'Сегодня!' : 'Today!';
    } else if (days === 1) {
      return lang === 'ru' ? 'Завтра' : 'Tomorrow';
    } else if (days <= 7) {
      return lang === 'ru' ? `Через ${days} дня` : `In ${days} days`;
    } else {
      return lang === 'ru' ? `Через ${days} дней` : `In ${days} days`;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <LinearGradient
        colors={['#f5ede4', '#f0d4c4', '#e8ddd4']}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay />

      <Text style={styles.title}>
        {t.specialDates || 'Special Dates'}
      </Text>
      
      {upcomingEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BlurView intensity={80} style={styles.emptyCard}>
            <CalendarIcon size={48} color="rgba(45, 42, 41, 0.3)" />
            <Text style={styles.emptyText}>
              {t.addEventDesc || 'Add special dates to see them here'}
            </Text>
          </BlurView>
        </View>
      ) : (
        <View style={styles.eventsContainer}>
          {upcomingEvents.map((event, index) => (
            <TouchableOpacity
              key={`${event.id}-${index}`}
              onPress={() => onEventClick?.(event)}
              style={[
                styles.eventCard,
                event.isToday && styles.eventCardToday,
                event.isPast && styles.eventCardPast
              ]}
              activeOpacity={0.8}
            >
              <BlurView intensity={80} style={styles.eventCardBlur}>
                <View style={styles.eventContent}>
                  <View style={styles.eventLeft}>
                    <View style={styles.eventIcon}>
                      {getEventIcon(event.type)}
                    </View>
                    <View style={styles.eventInfo}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        {event.isRecurring && (
                          <View style={styles.recurringBadge}>
                            <Text style={styles.recurringText}>
                              {settings.language === 'ru' ? 'Повторяется' : 'Recurring'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.eventMeta}>
                        <Clock size={12} color="rgba(45, 42, 41, 0.6)" />
                        <Text style={styles.eventMetaText}>
                          {formatDaysUntil(event.daysUntil, settings.language)}
                        </Text>
                        <Text style={styles.eventMetaDot}>•</Text>
                        <Text style={styles.eventMetaText}>
                          {new Date(event.date).toLocaleDateString(
                            settings.language === 'ru' ? 'ru-RU' : 'en-US',
                            { month: 'long', day: 'numeric', year: 'numeric' }
                          )}
                        </Text>
                      </View>
                      {event.reminderDays && event.reminderDays.length > 0 && !event.isPast && (
                        <Text style={styles.reminderText}>
                          {settings.language === 'ru' 
                            ? `Напоминания: за ${event.reminderDays.join(', ')} дней`
                            : `Reminders: ${event.reminderDays.join(', ')} days before`}
                        </Text>
                      )}
                    </View>
                  </View>
                  {event.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>
                        {settings.language === 'ru' ? 'СЕГОДНЯ' : 'TODAY'}
                      </Text>
                    </View>
                  )}
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 128,
  },
  title: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#2d2a29',
    marginBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(45, 42, 41, 0.6)',
    marginTop: 16,
    textAlign: 'center',
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  eventCardToday: {
    borderWidth: 2,
    borderColor: '#9c88ff',
  },
  eventCardPast: {
    opacity: 0.6,
  },
  eventCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  eventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  eventLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  eventIcon: {
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2a29',
  },
  recurringBadge: {
    backgroundColor: 'rgba(156, 136, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recurringText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    color: 'rgba(45, 42, 41, 0.6)',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: 'rgba(45, 42, 41, 0.6)',
  },
  eventMetaDot: {
    fontSize: 12,
    color: 'rgba(45, 42, 41, 0.6)',
    marginHorizontal: 4,
  },
  reminderText: {
    fontSize: 10,
    color: 'rgba(45, 42, 41, 0.6)',
    marginTop: 8,
  },
  todayBadge: {
    backgroundColor: '#9c88ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'white',
  },
});

export default Calendar;


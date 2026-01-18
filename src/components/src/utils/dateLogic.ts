import { Milestone, MilestoneType, CustomEvent } from '../types';

const SMALL_MILESTONES = [10, 50, 150, 200, 250, 300, 400, 600, 700, 800, 900];
const BIG_MILESTONES = [100, 365, 500, 730, 1000, 1500, 2000, 3000, 5000];

export const calculateDaysTogether = (startDateStr: string): number => {
  const start = new Date(startDateStr);
  const now = new Date();
  
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};

const getDayCountForDate = (startDateStr: string, targetDateStr: string): number => {
  const start = new Date(startDateStr);
  const target = new Date(targetDateStr);
  
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getNextMilestone = (currentDays: number, startDateStr: string, customEvents: CustomEvent[] = []): Milestone => {
  let candidates: Milestone[] = [];

  SMALL_MILESTONES.forEach(day => {
    if (day > currentDays) {
      candidates.push({
        day,
        title: `${day} Days`,
        description: "Small steps, beautiful journey.",
        type: 'small'
      });
    }
  });

  BIG_MILESTONES.forEach(day => {
    if (day > currentDays) {
      let title = `${day} Days`;
      let description = "A monumental moment.";

      if (day === 365) {
        title = "1 Year";
        description = "365 days of love.";
      } else if (day === 730) {
        title = "2 Years";
        description = "Two years strong.";
      } else if (day === 1000) {
        title = "1000 Days";
        description = "A legend being written.";
      }

      candidates.push({
        day,
        title,
        description,
        type: 'big'
      });
    }
  });

  customEvents.forEach(event => {
    const eventDayCount = getDayCountForDate(startDateStr, event.date);
    if (eventDayCount > currentDays) {
      candidates.push({
        day: eventDayCount,
        title: event.title,
        description: "A special day just for us.",
        type: 'custom',
        date: event.date,
        eventType: event.type
      });
    }
  });

  candidates.sort((a, b) => a.day - b.day);

  return candidates[0] || {
    day: currentDays + 100,
    title: "Infinity",
    description: "To the moon and back.",
    type: 'small'
  };
};

export const formatDate = (dateStr: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString(undefined, options);
};

export const getDaysUntil = (targetDays: number, currentDays: number): number => {
  return targetDays - currentDays;
};

export const isBigMilestone = (day: number): boolean => {
    return BIG_MILESTONES.includes(day);
};

export const getTodayCustomEvent = (customEvents: CustomEvent[]): CustomEvent | undefined => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return customEvents.find(e => {
        const d = new Date(e.date);
        d.setHours(0,0,0,0);
        if (e.isRecurring) {
            const currentYear = today.getFullYear();
            const eventYear = d.getFullYear();
            d.setFullYear(currentYear);
            return d.getTime() === today.getTime();
        }
        return d.getTime() === today.getTime();
    });
};

export const getUpcomingEventsWithReminders = (
    customEvents: CustomEvent[],
    startDate: string,
    currentDays: number
): Array<CustomEvent & { reminderDays: number[]; nextOccurrence: Date }> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return customEvents
        .filter(event => {
            const eventDate = new Date(event.date);
            if (event.isRecurring) {
                const currentYear = today.getFullYear();
                eventDate.setFullYear(currentYear);
                if (eventDate < today) {
                    eventDate.setFullYear(currentYear + 1);
                }
            }
            const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 30;
        })
        .map(event => {
            const eventDate = new Date(event.date);
            if (event.isRecurring) {
                const currentYear = today.getFullYear();
                eventDate.setFullYear(currentYear);
                if (eventDate < today) {
                    eventDate.setFullYear(currentYear + 1);
                }
            }
            const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                ...event,
                reminderDays: event.reminderDays || [],
                nextOccurrence: eventDate
            };
        })
        .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());
};


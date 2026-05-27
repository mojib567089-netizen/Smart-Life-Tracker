export type DocumentItem = {
  id: string;
  image: string; // base64
  category: string;
  keywords: string[];
  summary: string;
  dateAdded: string;
};

export type ReminderItem = {
  id: string;
  medicineName: string;
  scheduleInfos: string[];
  dueDate?: string; // Optional for other kinds of reminders
  title?: string;
  type: 'medicine' | 'bill' | 'other';
};

export type FoundItem = {
  id: string;
  itemName: string;
  location: string;
  dateAdded: string;
};

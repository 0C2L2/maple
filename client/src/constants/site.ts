export const SITE_URL = 'https://mapleapp.tech';
export const CONTACT_EMAIL = 'hello@mapleapp.tech';

// Keys match the check on public.contact_messages.topic.
export const CONTACT_TOPICS = [
  { value: 'support', label: 'Help with my account' },
  { value: 'intro', label: 'Find sponsors or events' },
  { value: 'partnership', label: 'Partnerships' },
  { value: 'press', label: 'Press' },
  { value: 'report', label: 'Report a problem' },
  { value: 'privacy', label: 'Privacy request' },
  { value: 'other', label: 'Something else' },
];
export const contactTopicLabel = (value: string) => CONTACT_TOPICS.find((t) => t.value === value)?.label ?? value;

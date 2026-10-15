import type { SiteData } from './types';

/**
 * Fallback content used only when the backend is unreachable (e.g. during a static build).
 * The real content is managed from the admin "Website Content" screen and stored in PostgreSQL.
 */
export const defaultSite: SiteData = {
  settings: {
    general: {
      gymName: 'Usman Gym',
      tagline: 'Build Strength. Build Discipline.',
      description: 'A no-nonsense training space with serious equipment, experienced coaches and a community that pushes you further.',
    },
    contact: {
      address: '123 Fitness Street, Main Boulevard, Your City',
      phone: '+92 300 0000000',
      email: 'info@usmangym.example',
      mapUrl: '',
      hours: [
        { label: 'Mon - Sat', time: '5:00 AM - 11:00 PM' },
        { label: 'Sunday', time: '7:00 AM - 2:00 PM' },
      ],
    },
    social: { facebook: '#', instagram: '#', youtube: '#' },
    membership: { note: 'Choosing a plan or sending an enquiry does not confirm your membership or payment.' },
  },
  plans: [],
  faqs: [],
  gallery: [],
};

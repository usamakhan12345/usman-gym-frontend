// Editorial content for the public pages that is not (yet) managed from the admin panel.
// Everything here is demo copy: replace with real information before launch.
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const heroImage = u('1534438327276-14e5300c3a48', 2000);
export const aboutImage = u('1571902943202-507ec2618e8f', 1200);
export const authImage = u('1540497077202-7c8a3999166f', 1600);

export const facilities = [
  { icon: 'dumbbell', title: 'Strength Training', text: 'Power racks, benches and plate-loaded machines for building real strength.', image: u('1532029837206-abbe2b7620e3') },
  { icon: 'heart', title: 'Cardio Zone', text: 'Treadmills, bikes and ellipticals with plenty of space and airflow.', image: u('1593079831268-3381b0db4a77') },
  { icon: 'weight', title: 'Free Weights', text: 'A full range of dumbbells and barbells from warm-up to heavy lifting.', image: u('1576678927484-cc907957088c') },
  { icon: 'user', title: 'Personal Training', text: 'One-to-one coaching built around your goals, schedule and level.', image: u('1546483875-ad9014c88eba') },
  { icon: 'zap', title: 'Functional Training', text: 'Ropes, sleds and open floor space for conditioning and mobility work.', image: u('1599058917212-d750089bc07e') },
  { icon: 'lock', title: 'Locker Rooms', text: 'Clean, secure lockers and changing areas so you can train worry-free.', image: u('1540497077202-7c8a3999166f') },
];

export const trainers = [
  { name: 'Coach Name', role: 'Head Trainer', bio: '10+ years in strength and conditioning.', image: u('1581009146145-b5ef050c2e1e', 600) },
  { name: 'Coach Name', role: 'Strength Coach', bio: 'Powerlifting and hypertrophy programming.', image: u('1583454110551-21f2fa2afe61', 600) },
  { name: 'Coach Name', role: 'Conditioning Coach', bio: 'Functional fitness and fat-loss specialist.', image: u('1605296867304-46d5465a13f1', 600) },
  { name: 'Coach Name', role: 'Personal Trainer', bio: 'Beginner-friendly one-to-one coaching.', image: u('1526506118085-60ce8714f8c5', 600) },
];

export const testimonials = [
  { name: 'Sample Member', since: 'Member since 2024', text: 'Sample review text. Replace this with a real, permission-granted member testimonial.' },
  { name: 'Sample Member', since: 'Member since 2023', text: 'Sample review text. Replace this with a real, permission-granted member testimonial.' },
  { name: 'Sample Member', since: 'Member since 2025', text: 'Sample review text. Replace this with a real, permission-granted member testimonial.' },
];

require('dotenv').config();
const { syncDB, User, Student, Class, ClassEnrollment } = require('../models');

async function seed() {
  console.log('[SEED] Starting...');
  await syncDB(true); // force recreate

  // Admin
  const admin = await User.create({ name: 'System Admin', email: 'admin@faceattend.tz', password: 'Admin@1234', role: 'admin' });

  // Teachers
  const t1 = await User.create({ name: 'Mr. David Kaunda', email: 'kaunda@faceattend.tz', password: 'Teacher@1234', role: 'teacher' });
  const t2 = await User.create({ name: 'Ms. Grace Nyerere', email: 'nyerere@faceattend.tz', password: 'Teacher@1234', role: 'teacher' });
  const t3 = await User.create({ name: 'Dr. James Mwangi', email: 'mwangi@faceattend.tz', password: 'Teacher@1234', role: 'teacher' });

  // Classes
  const c1 = await Class.create({ name: 'Mathematics 3A', subject: 'Mathematics', form: 'Form 3A', color: '#00e5a0', teacher_id: t1.id });
  const c2 = await Class.create({ name: 'Physics 4B', subject: 'Physics', form: 'Form 4B', color: '#00d4ff', teacher_id: t2.id });
  const c3 = await Class.create({ name: 'Chemistry 3B', subject: 'Chemistry', form: 'Form 3B', color: '#ffb347', teacher_id: t3.id });
  const c4 = await Class.create({ name: 'Biology 4A', subject: 'Biology', form: 'Form 4A', color: '#ff4d6d', teacher_id: t2.id });

  // Students
  const studentData = [
    { student_id: 'STU-001', name: 'Amina Osei', email: 'amina@school.tz' },
    { student_id: 'STU-002', name: 'Kofi Mensah', email: 'kofi@school.tz' },
    { student_id: 'STU-003', name: 'Zainab Hassan', email: 'zainab@school.tz' },
    { student_id: 'STU-004', name: 'Emmanuel Diallo', email: 'emmanuel@school.tz' },
    { student_id: 'STU-005', name: 'Fatima Abubakar', email: 'fatima@school.tz' },
    { student_id: 'STU-006', name: 'Ibrahim Kamara', email: 'ibrahim@school.tz' },
    { student_id: 'STU-007', name: 'Nadia Mwangi', email: 'nadia@school.tz' },
    { student_id: 'STU-008', name: 'Samuel Okafor', email: 'samuel@school.tz' },
  ];

  const students = await Promise.all(studentData.map(d => Student.create(d)));
  await ClassEnrollment.bulkCreate([
    ...students.slice(0, 5).map(s => ({ student_id: s.id, class_id: c1.id })),
    ...students.slice(2, 7).map(s => ({ student_id: s.id, class_id: c2.id })),
    ...students.slice(0, 4).map(s => ({ student_id: s.id, class_id: c3.id })),
    ...students.slice(4).map(s => ({ student_id: s.id, class_id: c4.id })),
  ]);

  console.log('[SEED] Done!');
  console.log('  Admin:   admin@faceattend.tz / Admin@1234');
  console.log('  Teacher: kaunda@faceattend.tz / Teacher@1234');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });

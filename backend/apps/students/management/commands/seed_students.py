from datetime import date, timedelta
from django.core.management.base import BaseCommand
from apps.students.models import Course, Student, StudentEnrollment, CourseExtension


class Command(BaseCommand):
    help = 'Seed Student Records, Duration Enrollments & Extensions file-wise'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding Students & Enrollments File-Wise...'))

        courses = list(Course.objects.all())
        if not courses:
            self.stdout.write(self.style.ERROR('No courses found! Run "python manage.py seed_courses" first.'))
            return

        c_mern = Course.objects.filter(code='CRS-FSWD-90').first() or courses[0]
        c_dsai = Course.objects.filter(code='CRS-DSAI-90').first() or courses[0]
        c_devops = Course.objects.filter(code='CRS-DEVOPS-90').first() or courses[0]
        c_java = Course.objects.filter(code='CRS-JAVA-120').first() or courses[0]
        c_uiux = Course.objects.filter(code='CRS-UIUX-60').first() or courses[0]
        c_cyber = Course.objects.filter(code='CRS-CYBER-180').first() or courses[0]

        today = date.today()

        students_list = [
            # 1. Active Trainee - Finishing Soon (Day 82 of 90, 8 days remaining)
            {
                'id_str': 'STD-2026-001',
                'first_name': 'Karthik',
                'last_name': 'Raja',
                'email': 'karthik.raja@gmail.com',
                'phone': '+91 98765 43210',
                'qualification': 'B.E. Computer Science',
                'status': 'in_training',
                'course': c_mern,
                'duration': 90,
                'start_offset': 82, # started 82 days ago => 8 days left!
                'extension': None
            },
            # 2. Active Trainee - Mid Course (Day 45 of 90)
            {
                'id_str': 'STD-2026-002',
                'first_name': 'Priya',
                'last_name': 'Dharshini',
                'email': 'priya.d@yahoo.com',
                'phone': '+91 98765 11223',
                'qualification': 'B.Tech IT',
                'status': 'in_training',
                'course': c_dsai,
                'duration': 90,
                'start_offset': 45,
                'extension': None
            },
            # 3. Active Trainee - Extended Course (Day 92 of 105 total days with +15d extension)
            {
                'id_str': 'STD-2026-003',
                'first_name': 'Suresh',
                'last_name': 'Ramanan',
                'email': 'suresh.ramanan@gmail.com',
                'phone': '+91 98765 99887',
                'qualification': 'B.Sc Computer Science',
                'status': 'in_training',
                'course': c_devops,
                'duration': 90,
                'start_offset': 92, # Base 90 finished, 13 days left out of 105 total!
                'extension': {
                    'added_days': 15,
                    'reason': 'Extended for Cloud Infrastructure Live Capstone Project'
                }
            },
            # 4. Active Trainee - Fast Track (Day 25 of 30)
            {
                'id_str': 'STD-2026-004',
                'first_name': 'Meena',
                'last_name': 'Kumari',
                'email': 'meena.k@outlook.com',
                'phone': '+91 91234 88776',
                'qualification': 'B.Com Computer Applications',
                'status': 'in_training',
                'course': c_uiux,
                'duration': 30, # Fast track 30 days
                'start_offset': 25, # 5 days left!
                'extension': None
            },
            # 5. Completed Student (90 Days Finished, Ready for Placement)
            {
                'id_str': 'STD-2026-005',
                'first_name': 'Vignesh',
                'last_name': 'Kumar',
                'email': 'vignesh.k@gmail.com',
                'phone': '+91 91234 56789',
                'qualification': 'B.Sc Computer Technology',
                'status': 'completed',
                'course': c_mern,
                'duration': 90,
                'start_offset': 98, # Finished 98 days ago
                'extension': None
            },
            # 6. Completed Student (120 Days Java Track Finished)
            {
                'id_str': 'STD-2026-006',
                'first_name': 'Deepak',
                'last_name': 'Chakravarthy',
                'email': 'deepak.c@gmail.com',
                'phone': '+91 97766 55443',
                'qualification': 'B.E Electronics & Comm',
                'status': 'completed',
                'course': c_java,
                'duration': 120,
                'start_offset': 125,
                'extension': None
            },
            # 7. Placed Student 1
            {
                'id_str': 'STD-2026-007',
                'first_name': 'Ananya',
                'last_name': 'Sundaram',
                'email': 'ananya.s@gmail.com',
                'phone': '+91 99887 76655',
                'qualification': 'M.C.A',
                'status': 'placed',
                'course': c_dsai,
                'duration': 90,
                'start_offset': 110,
                'extension': None
            },
            # 8. Placed Student 2
            {
                'id_str': 'STD-2026-008',
                'first_name': 'Rahul',
                'last_name': 'Dravid',
                'email': 'rahul.d@gmail.com',
                'phone': '+91 98840 12345',
                'qualification': 'B.Tech Information Tech',
                'status': 'placed',
                'course': c_mern,
                'duration': 90,
                'start_offset': 130,
                'extension': None
            }
        ]

        created_count = 0
        for data in students_list:
            student, s_created = Student.objects.get_or_create(
                enrollment_id=data['id_str'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'email': data['email'],
                    'phone': data['phone'],
                    'qualification': data['qualification'],
                    'status': data['status'],
                    'enrolled_date': today - timedelta(days=data['start_offset'])
                }
            )

            if s_created:
                created_count += 1

            start_dt = today - timedelta(days=data['start_offset'])
            dur = data['duration']

            enrollment, _ = StudentEnrollment.objects.get_or_create(
                student=student,
                defaults={
                    'course': data['course'],
                    'start_date': start_dt,
                    'duration_days': dur,
                    'total_fee': data['course'].fee_amount,
                    'status': 'completed' if data['status'] == 'completed' else ('placed' if data['status'] == 'placed' else 'active')
                }
            )

            if data['status'] == 'completed' and not enrollment.completion_date:
                enrollment.completion_date = start_dt + timedelta(days=dur)
                enrollment.save(update_fields=['completion_date'])

            if data.get('extension'):
                ext_data = data['extension']
                enrollment.extension_days = ext_data['added_days']
                enrollment.save(update_fields=['extension_days'])

                CourseExtension.objects.get_or_create(
                    enrollment=enrollment,
                    added_days=ext_data['added_days'],
                    defaults={
                        'reason': ext_data['reason'],
                        'extended_on': today - timedelta(days=10)
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} students & enrollments (Total: {Student.objects.count()}).'))

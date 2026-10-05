from rest_framework import serializers
from .models import (
    AcademicYear, SchoolClass, SchoolSection, SchoolSubject, SchoolStudent,
    SchoolStudentEnrollment, SchoolAdmission, SchoolParent, SchoolParentStudentLink,
    TimetableSlot, SchoolStudentAttendance, SchoolTeacherAttendance, SchoolAssignment,
    SchoolAssignmentSubmission, ExamType, SchoolExam, SchoolExamSchedule,
    SchoolExamResult, SchoolFeeStructure, SchoolStudentFeeAssignment, SchoolFeePayment
)


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'


class SchoolSectionSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.CharField(source='class_teacher.get_full_name', read_only=True)

    class Meta:
        model = SchoolSection
        fields = '__all__'


class SchoolClassSerializer(serializers.ModelSerializer):
    sections = SchoolSectionSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolClass
        fields = '__all__'


class SchoolSubjectSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)

    class Meta:
        model = SchoolSubject
        fields = '__all__'


class SchoolStudentEnrollmentSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = SchoolStudentEnrollment
        fields = '__all__'


class SchoolStudentSerializer(serializers.ModelSerializer):
    current_enrollment = serializers.SerializerMethodField()

    class Meta:
        model = SchoolStudent
        fields = '__all__'

    def get_current_enrollment(self, obj):
        enrollment = obj.enrollments.filter(status='active').first()
        if enrollment:
            return SchoolStudentEnrollmentSerializer(enrollment).data
        return None


class SchoolAdmissionSerializer(serializers.ModelSerializer):
    target_class_name = serializers.CharField(source='target_class.name', read_only=True)
    target_academic_year_name = serializers.CharField(source='target_academic_year.name', read_only=True)

    class Meta:
        model = SchoolAdmission
        fields = '__all__'


class SchoolParentStudentLinkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = SchoolParentStudentLink
        fields = '__all__'


class SchoolParentSerializer(serializers.ModelSerializer):
    student_links = SchoolParentStudentLinkSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolParent
        fields = '__all__'


class TimetableSlotSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)

    class Meta:
        model = TimetableSlot
        fields = '__all__'


class SchoolStudentAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = SchoolStudentAttendance
        fields = '__all__'


class SchoolTeacherAttendanceSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)

    class Meta:
        model = SchoolTeacherAttendance
        fields = '__all__'


class SchoolAssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = SchoolAssignmentSubmission
        fields = '__all__'


class SchoolAssignmentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    submissions = SchoolAssignmentSubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolAssignment
        fields = '__all__'


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = '__all__'


class SchoolExamScheduleSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = SchoolExamSchedule
        fields = '__all__'


class SchoolExamSerializer(serializers.ModelSerializer):
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    schedules = SchoolExamScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolExam
        fields = '__all__'


class SchoolExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = SchoolExamResult
        fields = '__all__'


class SchoolFeePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolFeePayment
        fields = '__all__'


class SchoolStudentFeeAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    fee_structure_name = serializers.CharField(source='fee_structure.name', read_only=True)
    payments = SchoolFeePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolStudentFeeAssignment
        fields = '__all__'


class SchoolFeeStructureSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = SchoolFeeStructure
        fields = '__all__'

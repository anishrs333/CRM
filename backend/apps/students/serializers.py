from decimal import Decimal
from rest_framework import serializers
from .models import Course, Student, StudentEnrollment, CourseExtension, StudentPayment, PlacementRecord, HiringCompany, Certificate


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class HiringCompanySerializer(serializers.ModelSerializer):
    total_placements = serializers.SerializerMethodField()

    class Meta:
        model = HiringCompany
        fields = '__all__'

    def get_total_placements(self, obj):
        return obj.placements.count()


class CourseExtensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseExtension
        fields = '__all__'


class StudentPaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    enrollment_id = serializers.CharField(source='student.enrollment_id', read_only=True)

    class Meta:
        model = StudentPayment
        fields = '__all__'


class PlacementRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    enrollment_id = serializers.CharField(source='student.enrollment_id', read_only=True)

    class Meta:
        model = PlacementRecord
        fields = '__all__'


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    total_duration_days = serializers.IntegerField(read_only=True)
    days_elapsed = serializers.IntegerField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    is_duration_completed = serializers.BooleanField(read_only=True)
    extensions = CourseExtensionSerializer(many=True, read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = '__all__'


class StudentDetailSerializer(serializers.ModelSerializer):
    enrollment_id = serializers.CharField(required=False, allow_blank=True)
    enrollment = StudentEnrollmentSerializer(read_only=True)
    payments = StudentPaymentSerializer(many=True, read_only=True)
    placement = PlacementRecordSerializer(read_only=True)
    
    full_name = serializers.CharField(read_only=True)
    total_fee = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    duration_info = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'enrollment_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'address', 'qualification', 'status',
            'enrolled_date', 'created_at', 'updated_at',
            'enrollment', 'payments', 'placement',
            'total_fee', 'total_paid', 'balance_due', 'payment_status', 'duration_info'
        ]

    def create(self, validated_data):
        if not validated_data.get('enrollment_id'):
            count = Student.objects.count() + 1
            validated_data['enrollment_id'] = f"STD-2026-{count:03d}"
        return super().create(validated_data)

    def get_total_fee(self, obj):
        if hasattr(obj, 'enrollment') and obj.enrollment and obj.enrollment.total_fee:
            return float(obj.enrollment.total_fee)
        return 0.0

    def get_total_paid(self, obj):
        if hasattr(obj, 'payments'):
            total = sum(p.amount_paid for p in obj.payments.all() if p.amount_paid)
            return float(total)
        return 0.0

    def get_balance_due(self, obj):
        fee = self.get_total_fee(obj)
        paid = self.get_total_paid(obj)
        return max(float(fee - paid), 0.0)

    def get_payment_status(self, obj):
        due = self.get_balance_due(obj)
        paid = self.get_total_paid(obj)
        if due <= 0:
            return 'Fully Paid'
        elif paid > 0:
            return 'Partial Paid'
        return 'Payment Pending'

    def get_duration_info(self, obj):
        if hasattr(obj, 'enrollment') and obj.enrollment:
            enr = obj.enrollment
            return {
                'start_date': enr.start_date,
                'expected_end_date': enr.expected_end_date,
                'base_duration_days': enr.duration_days,
                'extension_days': enr.extension_days,
                'total_duration_days': enr.total_duration_days,
                'days_elapsed': enr.days_elapsed,
                'days_remaining': enr.days_remaining,
                'progress_percentage': enr.progress_percentage,
                'is_duration_completed': enr.is_duration_completed,
            }
        return None


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_phone = serializers.CharField(source='student.phone', read_only=True)
    enrollment_id = serializers.CharField(source='student.enrollment_id', read_only=True)
    qualification = serializers.CharField(source='student.qualification', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    duration_days = serializers.IntegerField(source='course.duration_days', read_only=True)

    class Meta:
        model = Certificate
        fields = '__all__'


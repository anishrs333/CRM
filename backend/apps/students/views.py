import io
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.db import models
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from .models import Course, Student, StudentEnrollment, CourseExtension, StudentPayment, PlacementRecord, HiringCompany, Certificate
from .serializers import (
    CourseSerializer, StudentDetailSerializer, StudentPaymentSerializer,
    PlacementRecordSerializer, StudentEnrollmentSerializer, CourseExtensionSerializer,
    HiringCompanySerializer, CertificateSerializer
)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]


class HiringCompanyViewSet(viewsets.ModelViewSet):
    queryset = HiringCompany.objects.all()
    serializer_class = HiringCompanySerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().select_related('enrollment', 'enrollment__course', 'placement').prefetch_related('payments', 'enrollment__extensions')
    serializer_class = StudentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        filter_type = self.request.query_params.get('filter_type')
        search_param = self.request.query_params.get('search')

        if search_param:
            qs = qs.filter(
                models.Q(first_name__icontains=search_param) |
                models.Q(last_name__icontains=search_param) |
                models.Q(email__icontains=search_param) |
                models.Q(enrollment_id__icontains=search_param) |
                models.Q(phone__icontains=search_param)
            )

        if status_param:
            qs = qs.filter(status=status_param)

        if filter_type == 'completed_duration':
            today = date.today()
            qs = qs.filter(
                models.Q(status='completed') |
                models.Q(enrollment__completion_date__isnull=False)
            )
        elif filter_type == 'placed':
            qs = qs.filter(status='placed')
        elif filter_type == 'in_training':
            qs = qs.filter(status='in_training')
        elif filter_type == 'finishing_soon':
            # Filter in_training students whose days remaining <= 10
            qs = [s for s in qs if s.status == 'in_training' and hasattr(s, 'enrollment') and s.enrollment and s.enrollment.days_remaining <= 10]
            student_ids = [s.id for s in qs]
            return Student.objects.filter(id__in=student_ids).select_related('enrollment', 'enrollment__course', 'placement').prefetch_related('payments')

        return qs.distinct()

    def perform_create(self, serializer):
        student = serializer.save()
        course_id = self.request.data.get('course_id')
        duration_days = self.request.data.get('duration_days')
        course = None
        if course_id:
            course = Course.objects.filter(id=course_id).first()
        if not course:
            course = Course.objects.filter(is_active=True).first()
        if not course:
            course = Course.objects.create(
                title='Full Stack MERN Web Development',
                code='CRS-FSWD-90',
                duration_days=90,
                fee_amount=Decimal('50000.00'),
                category='Software Engineering'
            )

        eff_duration = int(duration_days) if duration_days and int(duration_days) > 0 else course.duration_days

        StudentEnrollment.objects.get_or_create(
            student=student,
            defaults={
                'course': course,
                'start_date': date.today(),
                'duration_days': eff_duration,
                'total_fee': course.fee_amount,
                'status': 'active' if student.status == 'in_training' else student.status
            }
        )

    def perform_update(self, serializer):
        student = serializer.save()
        if hasattr(student, 'enrollment') and student.enrollment:
            enr = student.enrollment
            if student.status == 'completed':
                if not enr.completion_date:
                    enr.completion_date = date.today()
                enr.status = 'completed'
                enr.save()
            elif student.status == 'placed':
                enr.status = 'placed'
                enr.save()
            elif student.status == 'in_training':
                enr.status = 'active'
                enr.save()

    @action(detail=False, methods=['get'], url_path='dashboard_stats')
    def dashboard_stats(self, request):
        students = Student.objects.all().select_related('enrollment', 'enrollment__course', 'placement').prefetch_related('payments')
        total_students = students.count()
        ongoing_count = students.filter(status='in_training').count()
        completed_count = students.filter(status='completed').count()
        placed_count = students.filter(status='placed').count()

        finishing_soon_list = []
        for s in students:
            if s.status == 'in_training' and hasattr(s, 'enrollment') and s.enrollment and s.enrollment.days_remaining <= 10:
                finishing_soon_list.append({
                    'id': s.id,
                    'full_name': s.full_name,
                    'enrollment_id': s.enrollment_id,
                    'phone': s.phone,
                    'course_title': s.enrollment.course.title if s.enrollment.course else 'Training Program',
                    'days_remaining': s.enrollment.days_remaining,
                    'days_elapsed': s.enrollment.days_elapsed,
                    'total_duration_days': s.enrollment.total_duration_days,
                    'expected_end_date': str(s.enrollment.expected_end_date),
                    'progress_percentage': s.enrollment.progress_percentage
                })

        total_revenue = sum(p.amount_paid for p in StudentPayment.objects.all())
        total_fees = sum(s.enrollment.total_fee for s in students if hasattr(s, 'enrollment') and s.enrollment)
        pending_dues = max(float(total_fees - total_revenue), 0.0)

        placement_rate = int((placed_count / max(completed_count + placed_count, 1)) * 100)

        return Response({
            'total_students': total_students,
            'ongoing_count': ongoing_count,
            'completed_count': completed_count,
            'placed_count': placed_count,
            'finishing_soon_count': len(finishing_soon_list),
            'finishing_soon_students': finishing_soon_list,
            'placement_rate': placement_rate,
            'total_revenue': float(total_revenue),
            'pending_dues': pending_dues,
        })

    @action(detail=True, methods=['post'], url_path='extend_course')
    def extend_course(self, request, pk=None):
        student = self.get_object()
        enrollment = getattr(student, 'enrollment', None)
        if not enrollment:
            return Response({'error': 'Student has no active course enrollment.'}, status=status.HTTP_400_BAD_REQUEST)

        added_days = int(request.data.get('added_days', 15))
        reason = request.data.get('reason', 'Course extension requested by Institute')

        enrollment.extension_days += added_days
        enrollment.save()

        # Log extension history
        CourseExtension.objects.create(
            enrollment=enrollment,
            added_days=added_days,
            reason=reason,
            extended_on=date.today()
        )

        return Response({
            'message': f'Course successfully extended by +{added_days} days.',
            'new_total_duration': enrollment.total_duration_days,
            'expected_end_date': str(enrollment.expected_end_date),
            'days_remaining': enrollment.days_remaining
        })

    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        student = self.get_object()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        elements = []

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E293B'),
            alignment=0
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.HexColor('#4F46E5'),
            alignment=0
        )

        elements.append(Paragraph("PL SOFT TECH EDTECH INSTITUTE CRM", title_style))
        elements.append(Paragraph("OFFICIAL STUDENT STATEMENT & FEE RECEIPT", subtitle_style))
        elements.append(Spacer(1, 15))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4F46E5'), spaceAfter=15))

        enr = getattr(student, 'enrollment', None)
        course_title = enr.course.title if enr and enr.course else 'N/A'
        tot_duration = enr.total_duration_days if enr else 90
        start_date_str = str(enr.start_date) if enr else 'N/A'
        end_date_str = str(enr.expected_end_date) if enr else 'N/A'
        days_elapsed = enr.days_elapsed if enr else 0
        days_remaining = enr.days_remaining if enr else 90

        total_fee = float(enr.total_fee) if enr else 0.0
        total_paid = sum(float(p.amount_paid) for p in student.payments.all())
        balance_due = max(total_fee - total_paid, 0.0)

        info_data = [
            [
                Paragraph(f"<b>Student Name:</b> {student.full_name}", styles['Normal']),
                Paragraph(f"<b>Enrollment ID:</b> {student.enrollment_id}", styles['Normal'])
            ],
            [
                Paragraph(f"<b>Email:</b> {student.email}", styles['Normal']),
                Paragraph(f"<b>Phone:</b> {student.phone}", styles['Normal'])
            ],
            [
                Paragraph(f"<b>Enrolled Course:</b> {course_title}", styles['Normal']),
                Paragraph(f"<b>Status:</b> {student.get_status_display()}", styles['Normal'])
            ],
            [
                Paragraph(f"<b>Total Course Duration:</b> {tot_duration} Days (Base {enr.duration_days}d + Ext {enr.extension_days}d)", styles['Normal']),
                Paragraph(f"<b>Timeline:</b> {start_date_str} to {end_date_str}", styles['Normal'])
            ],
            [
                Paragraph(f"<b>Days Completed:</b> {days_elapsed} / {tot_duration} Days", styles['Normal']),
                Paragraph(f"<b>Days Remaining:</b> {days_remaining} Days", styles['Normal'])
            ],
        ]

        info_table = Table(info_data, colWidths=[270, 270])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 18))

        elements.append(Paragraph("<b>FINANCIAL & PAYMENT SUMMARY</b>", styles['Heading3']))
        elements.append(Spacer(1, 8))

        summary_data = [
            ["Total Course Fee", "Total Amount Paid", "Outstanding Balance Due", "Payment Status"],
            [f"₹{total_fee:,.2f}", f"₹{total_paid:,.2f}", f"₹{balance_due:,.2f}", "Fully Paid" if balance_due <= 0 else "Pending"]
        ]
        summary_table = Table(summary_data, colWidths=[135, 135, 140, 130])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#4F46E5')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#EEF2FF')),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#1E293B')),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 18))

        elements.append(Paragraph("<b>PAYMENT TRANSACTION HISTORY</b>", styles['Heading3']))
        elements.append(Spacer(1, 8))

        payments = student.payments.all()
        if payments.exists():
            tx_data = [["Receipt #", "Payment Date", "Method", "Txn ID", "Amount Paid"]]
            for p in payments:
                tx_data.append([
                    p.receipt_number,
                    str(p.payment_date),
                    p.payment_method,
                    p.transaction_id or 'N/A',
                    f"₹{float(p.amount_paid):,.2f}"
                ])

            tx_table = Table(tx_data, colWidths=[110, 100, 110, 110, 110])
            tx_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ]))
            elements.append(tx_table)
        else:
            elements.append(Paragraph("<i>No payment transactions recorded yet.</i>", styles['Normal']))

        elements.append(Spacer(1, 18))

        placement = getattr(student, 'placement', None)
        if placement:
            elements.append(Paragraph("<b>PLACEMENT & CAREER RECORD</b>", styles['Heading3']))
            elements.append(Spacer(1, 8))
            plc_data = [
                [
                    Paragraph(f"<b>Company:</b> {placement.company_name}", styles['Normal']),
                    Paragraph(f"<b>Job Role:</b> {placement.job_role}", styles['Normal'])
                ],
                [
                    Paragraph(f"<b>CTC Package:</b> ₹{float(placement.ctc_package):,.2f} LPA", styles['Normal']),
                    Paragraph(f"<b>Offer Date:</b> {placement.offer_date}", styles['Normal'])
                ]
            ]
            plc_table = Table(plc_data, colWidths=[270, 270])
            plc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#86EFAC')),
            ]))
            elements.append(plc_table)

        elements.append(Spacer(1, 30))
        elements.append(Paragraph("This is a system-generated official document issued by PL Soft Tech EdTech Institute CRM.", styles['Italic']))

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Receipt_{student.enrollment_id}.pdf"'
        return response


class StudentPaymentViewSet(viewsets.ModelViewSet):
    queryset = StudentPayment.objects.all().select_related('student')
    serializer_class = StudentPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        receipt_number = serializer.validated_data.get('receipt_number')
        student = serializer.validated_data.get('student')
        if not receipt_number and student:
            count = StudentPayment.objects.filter(student=student).count() + 1
            receipt_number = f"RCPT-{student.enrollment_id}-{count}"
            serializer.save(receipt_number=receipt_number)
        else:
            serializer.save()


class PlacementRecordViewSet(viewsets.ModelViewSet):
    queryset = PlacementRecord.objects.all().select_related('student')
    serializer_class = PlacementRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        placement = serializer.save()
        if placement.student:
            placement.student.status = 'placed'
            placement.student.save(update_fields=['status'])
            if hasattr(placement.student, 'enrollment') and placement.student.enrollment:
                enr = placement.student.enrollment
                enr.status = 'placed'
                enr.save(update_fields=['status'])


def generate_certificate_pdf_response(cert):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E1B4B'),
        alignment=1
    )

    sub_style = ParagraphStyle(
        'CertSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4F46E5'),
        alignment=1
    )

    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#0F172A'),
        alignment=1
    )

    course_style = ParagraphStyle(
        'CertCourse',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=24,
        textColor=colors.HexColor('#4F46E5'),
        alignment=1
    )

    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    elements.append(Spacer(1, 10))
    elements.append(Paragraph(cert.institute_name.upper(), title_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("OFFICIAL CERTIFICATE OF COURSE COMPLETION", sub_style))
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="85%", thickness=2, color=colors.HexColor('#4F46E5'), spaceAfter=15))

    elements.append(Paragraph("THIS IS PROUDLY PRESENTED TO", body_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(cert.student.full_name.upper(), name_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("for successfully completing the professional training curriculum in", body_style))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(cert.course.title, course_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Duration: {cert.course.duration_days} Days Bootcamp  •  Qualification: {cert.student.qualification}", body_style))
    elements.append(Spacer(1, 20))

    status_str = "ACTIVE / ISSUED" if cert.status == 'active' else "REVOKED"
    info_data = [
        [
            Paragraph(f"<b>Certificate ID:</b> {cert.certificate_id}", styles['Normal']),
            Paragraph(f"<b>Status:</b> {status_str}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Issue Date:</b> {cert.issue_date}", styles['Normal']),
            Paragraph(f"<b>Completion Date:</b> {cert.completion_date}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Verification URL:</b> http://localhost:5173/verify-certificate/{cert.certificate_id}", styles['Normal']),
            Paragraph(f"<b>Signatory:</b> {cert.signatory_title}", styles['Normal'])
        ]
    ]

    info_table = Table(info_data, colWidths=[360, 360])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))
    elements.append(Paragraph("This is a system-generated official document issued by PL Soft Tech EdTech Institute CRM.", styles['Italic']))

    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Certificate_{cert.certificate_id}.pdf"'
    return response


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all().select_related('student', 'course', 'enrollment')
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Filter by student email if user is a student or requested my_certificates
        if hasattr(user, 'email') and user.email and not (user.is_staff or getattr(user, 'role', '') in ['admin', 'manager', 'sales_manager'] or user.is_superuser):
            qs = qs.filter(student__email=user.email)

        search_param = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')
        course_param = self.request.query_params.get('course')

        if search_param:
            qs = qs.filter(
                models.Q(certificate_id__icontains=search_param) |
                models.Q(student__first_name__icontains=search_param) |
                models.Q(student__last_name__icontains=search_param) |
                models.Q(student__email__icontains=search_param) |
                models.Q(student__enrollment_id__icontains=search_param) |
                models.Q(course__title__icontains=search_param)
            )

        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)

        if course_param and course_param != 'all':
            qs = qs.filter(course_id=course_param)

        return qs.distinct()

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_certificate(self, request):
        user = request.user
        if not (user.is_staff or getattr(user, 'role', '') in ['admin', 'manager', 'sales_manager'] or user.is_superuser):
            return Response({'error': 'Only authorized faculty and administrative staff can generate certificates.'}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.data.get('student_id') or request.data.get('student')
        if not student_id:
            return Response({'error': 'Student ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        student = get_object_or_404(Student.objects.select_related('enrollment', 'enrollment__course'), id=student_id)
        enrollment = getattr(student, 'enrollment', None)

        # Eligibility verification
        is_eligible = (
            student.status in ['completed', 'placed'] or
            (enrollment and (enrollment.status in ['completed', 'placed'] or enrollment.is_duration_completed or enrollment.completion_date is not None))
        )

        if not is_eligible:
            return Response({
                'error': f'Student "{student.full_name}" is not eligible for certificate issuance. Course training must be completed first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        course = enrollment.course if enrollment and enrollment.course else Course.objects.filter(is_active=True).first()
        if not course:
            return Response({'error': 'No valid course linked for this student.'}, status=status.HTTP_400_BAD_REQUEST)

        # Duplicate check
        existing_cert = Certificate.objects.filter(student=student, course=course).first()
        if existing_cert:
            serializer = self.get_serializer(existing_cert)
            return Response({
                'message': f'Certificate already issued for {student.full_name}.',
                'certificate': serializer.data
            }, status=status.HTTP_200_OK)

        # Generate unique Certificate ID
        clean_enr = student.enrollment_id.replace('STD-', '')
        cert_code = f"CERT-2026-{clean_enr}-{uuid.uuid4().hex[:6].upper()}"

        comp_date = (enrollment.completion_date if enrollment and enrollment.completion_date else date.today())

        cert = Certificate.objects.create(
            certificate_id=cert_code,
            student=student,
            course=course,
            enrollment=enrollment,
            certificate_title=f"Certificate of Completion in {course.title}",
            completion_date=comp_date,
            issue_date=date.today(),
            status='active'
        )

        serializer = self.get_serializer(cert)
        return Response({
            'message': f'Certificate {cert.certificate_id} generated successfully for {student.full_name}!',
            'certificate': serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='revoke')
    def revoke_certificate(self, request, pk=None):
        user = request.user
        if not (user.is_staff or getattr(user, 'role', '') in ['admin', 'manager', 'sales_manager'] or user.is_superuser):
            return Response({'error': 'Only authorized admin staff can revoke certificates.'}, status=status.HTTP_403_FORBIDDEN)

        cert = self.get_object()
        reason = request.data.get('reason', 'Administrative revocation request')
        cert.status = 'revoked'
        cert.revoked_at = timezone.now()
        cert.revoked_reason = reason
        cert.save()

        serializer = self.get_serializer(cert)
        return Response({
            'message': f'Certificate {cert.certificate_id} has been revoked.',
            'certificate': serializer.data
        })

    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        cert = self.get_object()
        return generate_certificate_pdf_response(cert)


class CertificateVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cert_id = request.query_params.get('certificate_id') or request.query_params.get('id')
        if not cert_id:
            return Response({'valid': False, 'message': 'Certificate ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cert = Certificate.objects.filter(certificate_id__iexact=cert_id.strip()).select_related('student', 'course').first()
        if not cert:
            return Response({
                'valid': False,
                'status': 'Not Found',
                'message': 'Certificate not found. Please check the Certificate ID and try again.'
            }, status=status.HTTP_200_OK)

        if cert.status == 'revoked':
            return Response({
                'valid': False,
                'status': 'Revoked',
                'message': 'Certificate has been revoked.',
                'certificate_id': cert.certificate_id,
                'student_name': cert.student.full_name,
                'course_title': cert.course.title,
                'issue_date': str(cert.issue_date),
                'revoked_at': str(cert.revoked_at) if cert.revoked_at else None,
                'revoked_reason': cert.revoked_reason,
            }, status=status.HTTP_200_OK)

        return Response({
            'valid': True,
            'status': 'Active & Issued',
            'certificate_id': cert.certificate_id,
            'student_name': cert.student.full_name,
            'course_title': cert.course.title,
            'completion_date': str(cert.completion_date),
            'issue_date': str(cert.issue_date),
            'institute_name': cert.institute_name,
            'qualification': cert.student.qualification,
            'duration_days': cert.course.duration_days,
        }, status=status.HTTP_200_OK)



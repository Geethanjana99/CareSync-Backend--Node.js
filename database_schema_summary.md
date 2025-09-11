# CareSync Database Schema Summary

Generated on: 2025-09-11T03:36:35.237Z

## Tables (21)

### admin_medical_reports

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | NULL |  |
| patient_id | varchar | NO | NULL |  |
| admin_id | varchar | NO | NULL |  |
| report_type | enum | NO | NULL |  |
| title | varchar | YES | NULL |  |
| description | text | YES | NULL |  |
| file_name | varchar | NO | NULL |  |
| original_file_name | varchar | NO | NULL |  |
| file_path | varchar | NO | NULL |  |
| file_size | bigint | NO | NULL |  |
| mime_type | varchar | NO | NULL |  |
| file_hash | varchar | YES | NULL |  |
| tags | json | YES | NULL |  |
| metadata | json | YES | NULL |  |
| is_confidential | tinyint | NO | 0 |  |
| expiry_date | datetime | YES | NULL |  |
| status | enum | NO | uploaded |  |
| notes | text | YES | NULL |  |
| upload_source | varchar | NO | admin_portal |  |
| reviewed_at | datetime | YES | NULL |  |
| reviewed_by | varchar | YES | NULL |  |
| created_at | datetime | NO | NULL |  |
| updated_at | datetime | NO | NULL |  |

### ai_prediction_certifications

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| prediction_id | varchar | NO | NULL |  |
| doctor_id | varchar | NO | NULL |  |
| certification_status | enum | NO | NULL |  |
| doctor_notes | text | NO | NULL |  |
| clinical_assessment | text | YES | NULL |  |
| recommendations | text | YES | NULL |  |
| follow_up_required | tinyint | YES | 0 |  |
| follow_up_date | date | YES | NULL |  |
| severity_assessment | enum | YES | NULL |  |
| certified_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### appointment_details_view

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|

### appointments

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| appointment_id | varchar | NO | NULL |  |
| patient_id | varchar | NO | NULL |  |
| doctor_id | varchar | NO | NULL |  |
| appointment_date | date | NO | NULL |  |
| queue_number | int | YES | NULL |  |
| appointment_type | enum | YES | consultation |  |
| status | enum | YES | scheduled |  |
| reason_for_visit | text | YES | NULL |  |
| symptoms | text | YES | NULL |  |
| priority | enum | YES | medium |  |
| notes | text | YES | NULL |  |
| cancellation_reason | text | YES | NULL |  |
| cancelled_by | varchar | YES | NULL |  |
| cancelled_at | timestamp | YES | NULL |  |
| confirmed_at | timestamp | YES | NULL |  |
| completed_at | timestamp | YES | NULL |  |
| consultation_fee | decimal | YES | NULL |  |
| scheduled_by | varchar | YES | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| is_emergency | tinyint | YES | 0 |  |
| queue_date | date | NO | curdate() | DEFAULT_GENERATED |

### billing

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| appointment_id | varchar | NO | NULL |  |
| patient_id | varchar | NO | NULL |  |
| doctor_id | varchar | NO | NULL |  |
| invoice_number | varchar | NO | NULL |  |
| amount | decimal | NO | NULL |  |
| tax_amount | decimal | YES | 0.00 |  |
| total_amount | decimal | NO | NULL |  |
| payment_method | enum | YES | card |  |
| payment_status | enum | YES | pending |  |
| transaction_id | varchar | YES | NULL |  |
| payment_gateway | varchar | YES | NULL |  |
| due_date | date | YES | NULL |  |
| paid_at | timestamp | YES | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### diabetes_predictions

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | NULL |  |
| patient_id | varchar | NO | NULL |  |
| admin_id | varchar | NO | NULL |  |
| pregnancies | int | YES | 0 |  |
| glucose | decimal | NO | NULL |  |
| bmi | decimal | NO | NULL |  |
| age | int | NO | NULL |  |
| insulin | decimal | YES | 0.00 |  |
| prediction_result | tinyint | YES | NULL |  |
| prediction_probability | decimal | YES | NULL |  |
| risk_level | enum | YES | NULL |  |
| status | enum | NO | pending |  |
| notes | text | YES | NULL |  |
| processed_at | datetime | YES | NULL |  |
| created_at | datetime | NO | NULL |  |
| updated_at | datetime | NO | NULL |  |

### doctor_dashboard_view

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| doctor_id | varchar | NO | uuid() | DEFAULT_GENERATED |
| doctor_code | varchar | NO | NULL |  |
| doctor_name | varchar | NO | NULL |  |
| specialty | varchar | NO | NULL |  |
| rating | decimal | YES | 0.00 |  |
| total_reviews | int | YES | 0 |  |
| consultation_fee | decimal | YES | NULL |  |
| office_address | text | YES | NULL |  |
| working_hours | json | YES | NULL |  |
| availability_status | enum | YES | available |  |
| today_appointments | bigint | NO | 0 |  |
| today_completed | bigint | NO | 0 |  |
| upcoming_appointments | bigint | NO | 0 |  |
| total_appointments | int | YES | 0 |  |
| total_earnings | decimal | YES | 0.00 |  |

### doctors

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| user_id | varchar | NO | NULL |  |
| doctor_id | varchar | NO | NULL |  |
| specialty | varchar | NO | NULL |  |
| license_number | varchar | NO | NULL |  |
| years_of_experience | int | YES | NULL |  |
| education | text | YES | NULL |  |
| certifications | text | YES | NULL |  |
| consultation_fee | decimal | YES | NULL |  |
| languages_spoken | json | YES | NULL |  |
| office_address | text | YES | NULL |  |
| bio | text | YES | NULL |  |
| rating | decimal | YES | 0.00 |  |
| total_reviews | int | YES | 0 |  |
| working_hours | json | YES | NULL |  |
| availability_status | enum | YES | available |  |
| commission_rate | decimal | YES | 25.00 |  |
| status | enum | YES | pending_approval |  |
| approved_at | timestamp | YES | NULL |  |
| approved_by | varchar | YES | NULL |  |
| total_appointments | int | YES | 0 |  |
| total_earnings | decimal | YES | 0.00 |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### email_verification_tokens

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| user_id | varchar | NO | NULL |  |
| token | varchar | NO | NULL |  |
| expires_at | timestamp | NO | NULL |  |
| is_used | tinyint | YES | 0 |  |
| used_at | timestamp | YES | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### invoice_items

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | NULL |  |
| invoice_id | varchar | NO | NULL |  |
| description | varchar | NO | NULL |  |
| quantity | int | NO | 1 |  |
| rate | decimal | NO | NULL |  |
| amount | decimal | NO | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### invoices

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | NULL |  |
| invoice_number | varchar | NO | NULL |  |
| patient_name | varchar | NO | NULL |  |
| appointment_date | date | YES | NULL |  |
| due_date | date | NO | NULL |  |
| total_amount | decimal | NO | NULL |  |
| status | enum | YES | pending |  |
| notes | text | YES | NULL |  |
| generated_date | date | NO | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### login_attempts

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| email | varchar | NO | NULL |  |
| ip_address | varchar | NO | NULL |  |
| user_agent | text | YES | NULL |  |
| success | tinyint | NO | NULL |  |
| failure_reason | varchar | YES | NULL |  |
| attempted_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### medical_reports

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| patient_id | varchar | NO | NULL |  |
| doctor_id | varchar | YES | NULL |  |
| appointment_id | varchar | YES | NULL |  |
| title | varchar | NO | NULL |  |
| description | text | YES | NULL |  |
| report_type | enum | NO | NULL |  |
| file_name | varchar | NO | NULL |  |
| file_path | varchar | NO | NULL |  |
| file_size | bigint | YES | NULL |  |
| mime_type | varchar | YES | NULL |  |
| status | enum | YES | pending |  |
| reviewed_by | varchar | YES | NULL |  |
| reviewed_at | timestamp | YES | NULL |  |
| review_notes | text | YES | NULL |  |
| uploaded_by | varchar | NO | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### medical_specialties

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | int | NO | NULL | auto_increment |
| name | varchar | NO | NULL |  |
| description | text | YES | NULL |  |
| is_active | tinyint | YES | 1 |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### password_reset_requests

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| user_id | varchar | NO | NULL |  |
| token | varchar | NO | NULL |  |
| expires_at | timestamp | NO | NULL |  |
| is_used | tinyint | YES | 0 |  |
| used_at | timestamp | YES | NULL |  |
| ip_address | varchar | YES | NULL |  |
| user_agent | text | YES | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### patients

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| user_id | varchar | NO | NULL |  |
| patient_id | varchar | NO | NULL |  |
| date_of_birth | date | YES | NULL |  |
| gender | enum | YES | NULL |  |
| address | text | YES | NULL |  |
| emergency_contact_name | varchar | YES | NULL |  |
| emergency_contact_phone | varchar | YES | NULL |  |
| medical_history | text | YES | NULL |  |
| allergies | text | YES | NULL |  |
| current_medications | text | YES | NULL |  |
| insurance_provider | varchar | YES | NULL |  |
| insurance_policy_number | varchar | YES | NULL |  |
| blood_type | varchar | YES | NULL |  |
| height | decimal | YES | NULL |  |
| weight | decimal | YES | NULL |  |
| occupation | varchar | YES | NULL |  |
| marital_status | enum | YES | NULL |  |
| preferred_language | varchar | YES | English |  |
| status | enum | YES | active |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### queue_status

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| doctor_id | varchar | NO | NULL |  |
| queue_date | date | NO | NULL |  |
| current_number | varchar | YES | 0 |  |
| current_emergency_number | varchar | YES | E0 |  |
| max_emergency_slots | int | YES | 5 |  |
| emergency_used | int | YES | 0 |  |
| regular_count | int | YES | 0 |  |
| available_from | time | YES | 09:00:00 |  |
| available_to | time | YES | 17:00:00 |  |
| is_active | tinyint | YES | 1 |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### refresh_tokens

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| user_id | varchar | NO | NULL |  |
| token_hash | varchar | NO | NULL |  |
| expires_at | timestamp | NO | NULL |  |
| is_revoked | tinyint | YES | 0 |  |
| device_info | json | YES | NULL |  |
| ip_address | varchar | YES | NULL |  |
| user_agent | text | YES | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### reviews

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| appointment_id | varchar | NO | NULL |  |
| patient_id | varchar | NO | NULL |  |
| doctor_id | varchar | NO | NULL |  |
| rating | int | NO | NULL |  |
| review_text | text | YES | NULL |  |
| is_anonymous | tinyint | YES | 0 |  |
| is_approved | tinyint | YES | 1 |  |
| approved_by | varchar | YES | NULL |  |
| approved_at | timestamp | YES | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### user_sessions

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| user_id | varchar | NO | NULL |  |
| session_token | varchar | NO | NULL |  |
| ip_address | varchar | YES | NULL |  |
| user_agent | text | YES | NULL |  |
| is_active | tinyint | YES | 1 |  |
| last_activity | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| expires_at | timestamp | NO | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### users

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| id | varchar | NO | uuid() | DEFAULT_GENERATED |
| name | varchar | NO | NULL |  |
| email | varchar | NO | NULL |  |
| password_hash | varchar | NO | NULL |  |
| role | enum | NO | patient |  |
| avatar_url | varchar | YES | NULL |  |
| phone | varchar | YES | NULL |  |
| is_active | tinyint | YES | 1 |  |
| email_verified | tinyint | YES | 0 |  |
| last_login | timestamp | YES | NULL |  |
| password_reset_token | varchar | YES | NULL |  |
| password_reset_expires | timestamp | YES | NULL |  |
| email_verification_token | varchar | YES | NULL |  |
| email_verification_expires | timestamp | YES | NULL |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |


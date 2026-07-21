import { z } from 'zod';
export declare const createPositionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    department_id: z.ZodOptional<z.ZodNumber>;
    salary_range_min: z.ZodOptional<z.ZodNumber>;
    salary_range_max: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    title: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    department_id: z.ZodOptional<z.ZodNumber>;
    salary_range_min: z.ZodOptional<z.ZodNumber>;
    salary_range_max: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    title: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    department_id: z.ZodOptional<z.ZodNumber>;
    salary_range_min: z.ZodOptional<z.ZodNumber>;
    salary_range_max: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const updatePositionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    department_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_range_min: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_range_max: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    department_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_range_min: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_range_max: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    department_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_range_min: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_range_max: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createAttendanceSchema: z.ZodObject<{
    employee_id: z.ZodNumber;
    date: z.ZodString;
    check_in: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date: string;
    employee_id: number;
    check_in?: string | undefined;
    notes?: string | undefined;
}, {
    date: string;
    employee_id: number;
    check_in?: string | undefined;
    notes?: string | undefined;
}>;
export declare const createLeaveTypeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    days_allowed: z.ZodNumber;
    requires_approval: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    days_allowed: number;
    requires_approval: boolean;
    description?: string | undefined;
}, {
    name: string;
    days_allowed: number;
    description?: string | undefined;
    requires_approval?: boolean | undefined;
}>;
export declare const createLeaveRequestSchema: z.ZodObject<{
    employee_id: z.ZodNumber;
    leave_type_id: z.ZodNumber;
    start_date: z.ZodString;
    end_date: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason: string;
}, {
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason: string;
}>;
export declare const createContractSchema: z.ZodObject<{
    employee_id: z.ZodOptional<z.ZodNumber>;
    user_id: z.ZodOptional<z.ZodNumber>;
    type: z.ZodString;
    start_date: z.ZodString;
    end_date: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodNumber>;
    salary_amount: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    employee_id: z.ZodOptional<z.ZodNumber>;
    user_id: z.ZodOptional<z.ZodNumber>;
    type: z.ZodString;
    start_date: z.ZodString;
    end_date: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodNumber>;
    salary_amount: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    employee_id: z.ZodOptional<z.ZodNumber>;
    user_id: z.ZodOptional<z.ZodNumber>;
    type: z.ZodString;
    start_date: z.ZodString;
    end_date: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodNumber>;
    salary_amount: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const updateContractSchema: z.ZodObject<{
    employee_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    user_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    type: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    salary: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_amount: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    terms: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["active", "terminated", "expired"]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    employee_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    user_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    type: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    salary: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_amount: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    terms: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["active", "terminated", "expired"]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    employee_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    user_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    type: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    salary: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary_amount: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    terms: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["active", "terminated", "expired"]>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createPerformanceReviewSchema: z.ZodObject<{
    employee_id: z.ZodOptional<z.ZodNumber>;
    user_id: z.ZodOptional<z.ZodNumber>;
    reviewer_id: z.ZodOptional<z.ZodNumber>;
    reviewer_name: z.ZodOptional<z.ZodString>;
    review_date: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    comments: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    employee_id: z.ZodOptional<z.ZodNumber>;
    user_id: z.ZodOptional<z.ZodNumber>;
    reviewer_id: z.ZodOptional<z.ZodNumber>;
    reviewer_name: z.ZodOptional<z.ZodString>;
    review_date: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    comments: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    employee_id: z.ZodOptional<z.ZodNumber>;
    user_id: z.ZodOptional<z.ZodNumber>;
    reviewer_id: z.ZodOptional<z.ZodNumber>;
    reviewer_name: z.ZodOptional<z.ZodString>;
    review_date: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    comments: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createTrainingSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    trainer: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    max_participants: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    trainer: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    max_participants: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    trainer: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    max_participants: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodString>;
    department_id: z.ZodOptional<z.ZodNumber>;
    salary_range: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodString>;
    department_id: z.ZodOptional<z.ZodNumber>;
    salary_range: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodString>;
    department_id: z.ZodOptional<z.ZodNumber>;
    salary_range: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createApplicantSchema: z.ZodObject<{
    job_id: z.ZodNumber;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    resume_url: z.ZodOptional<z.ZodString>;
    cover_letter: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    job_id: number;
    phone?: string | undefined;
    resume_url?: string | undefined;
    cover_letter?: string | undefined;
}, {
    email: string;
    name: string;
    job_id: number;
    phone?: string | undefined;
    resume_url?: string | undefined;
    cover_letter?: string | undefined;
}>;
export declare const createAnimalCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createAnimalSchema: z.ZodObject<{
    tag_number: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_category_id: z.ZodNumber;
    breed_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gender: z.ZodEnum<["male", "female"]>;
    date_of_birth: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    weight: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    height: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    source: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purchase_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    is_dairy: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    location_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    group_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    photo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    feed_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    registration_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    tag_number: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_category_id: z.ZodNumber;
    breed_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gender: z.ZodEnum<["male", "female"]>;
    date_of_birth: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    weight: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    height: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    source: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purchase_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    is_dairy: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    location_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    group_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    photo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    feed_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    registration_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    tag_number: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_category_id: z.ZodNumber;
    breed_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gender: z.ZodEnum<["male", "female"]>;
    date_of_birth: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    weight: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    height: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    source: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purchase_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    is_dairy: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    location_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    group_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    photo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    feed_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    registration_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const updateAnimalSchema: z.ZodObject<{
    tag_number: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    animal_category_id: z.ZodOptional<z.ZodNumber>;
    breed_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female"]>>;
    date_of_birth: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    weight: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    height: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    color: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    source: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    purchase_price: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    is_dairy: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodBoolean>>>;
    location_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    group_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    photo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    feed_type: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    animal_status: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    registration_date: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    tag_number: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    animal_category_id: z.ZodOptional<z.ZodNumber>;
    breed_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female"]>>;
    date_of_birth: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    weight: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    height: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    color: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    source: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    purchase_price: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    is_dairy: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodBoolean>>>;
    location_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    group_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    photo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    feed_type: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    animal_status: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    registration_date: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    tag_number: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    animal_category_id: z.ZodOptional<z.ZodNumber>;
    breed_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female"]>>;
    date_of_birth: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    weight: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    height: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    color: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    source: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    purchase_price: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    is_dairy: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodBoolean>>>;
    location_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    group_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    photo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    feed_type: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    animal_status: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    registration_date: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createBreedingRecordSchema: z.ZodObject<{
    mother_id: z.ZodNumber;
    father_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    breeding_date: z.ZodString;
    method: z.ZodNullable<z.ZodOptional<z.ZodEnum<["natural", "artificial", "ai"]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    mother_id: z.ZodNumber;
    father_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    breeding_date: z.ZodString;
    method: z.ZodNullable<z.ZodOptional<z.ZodEnum<["natural", "artificial", "ai"]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    mother_id: z.ZodNumber;
    father_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    breeding_date: z.ZodString;
    method: z.ZodNullable<z.ZodOptional<z.ZodEnum<["natural", "artificial", "ai"]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createPregnancySchema: z.ZodObject<{
    animal_id: z.ZodNumber;
    breeding_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    pregnancy_date: z.ZodString;
    expected_delivery_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sire_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["confirmed", "monitoring", "ended", "delivered"]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodNumber;
    breeding_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    pregnancy_date: z.ZodString;
    expected_delivery_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sire_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["confirmed", "monitoring", "ended", "delivered"]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodNumber;
    breeding_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    pregnancy_date: z.ZodString;
    expected_delivery_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sire_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["confirmed", "monitoring", "ended", "delivered"]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createBirthRecordSchema: z.ZodObject<{
    mother_id: z.ZodNumber;
    birth_date: z.ZodString;
    tag_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gender: z.ZodNullable<z.ZodOptional<z.ZodEnum<["male", "female"]>>>;
    weight: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    health_status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    photo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    child_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ear_tag: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    mother_id: z.ZodNumber;
    birth_date: z.ZodString;
    tag_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gender: z.ZodNullable<z.ZodOptional<z.ZodEnum<["male", "female"]>>>;
    weight: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    health_status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    photo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    child_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ear_tag: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    mother_id: z.ZodNumber;
    birth_date: z.ZodString;
    tag_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gender: z.ZodNullable<z.ZodOptional<z.ZodEnum<["male", "female"]>>>;
    weight: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    health_status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    photo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    child_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ear_tag: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createVaccinationSchema: z.ZodObject<{
    animal_id: z.ZodNumber;
    vaccine_name: z.ZodString;
    vaccination_date: z.ZodString;
    next_due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batch_no: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodNumber;
    vaccine_name: z.ZodString;
    vaccination_date: z.ZodString;
    next_due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batch_no: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodNumber;
    vaccine_name: z.ZodString;
    vaccination_date: z.ZodString;
    next_due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batch_no: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createDiseaseSchema: z.ZodObject<{
    animal_id: z.ZodNumber;
    disease_name: z.ZodString;
    date: z.ZodString;
    symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    severity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodNumber;
    disease_name: z.ZodString;
    date: z.ZodString;
    symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    severity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodNumber;
    disease_name: z.ZodString;
    date: z.ZodString;
    symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    severity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createTreatmentSchema: z.ZodObject<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    disease_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    medicine: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dosage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    duration: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    medication: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    disease_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    disease_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    medicine: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dosage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    duration: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    medication: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    disease_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    disease_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    medicine: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dosage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    duration: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment_description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    medication: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    disease_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    animal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createFeedingRecordSchema: z.ZodObject<{
    animal_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    group_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    feed_type: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    group_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    feed_type: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    group_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    feed_type: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createWeightRecordSchema: z.ZodObject<{
    animal_id: z.ZodNumber;
    weight: z.ZodNumber;
    weight_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodNumber;
    weight: z.ZodNumber;
    weight_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodNumber;
    weight: z.ZodNumber;
    weight_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createMilkCollectionSchema: z.ZodObject<{
    collection_date: z.ZodString;
    time: z.ZodEnum<["morning", "evening"]>;
    collector_id: z.ZodNumber;
    branch_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity_liters: z.ZodNumber;
    number_of_animals: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    collection_date: z.ZodString;
    time: z.ZodEnum<["morning", "evening"]>;
    collector_id: z.ZodNumber;
    branch_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity_liters: z.ZodNumber;
    number_of_animals: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    collection_date: z.ZodString;
    time: z.ZodEnum<["morning", "evening"]>;
    collector_id: z.ZodNumber;
    branch_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity_liters: z.ZodNumber;
    number_of_animals: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createQualityTestSchema: z.ZodObject<{
    collection_id: z.ZodNumber;
    test_date: z.ZodString;
    fat: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    protein: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    snf: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    lactose: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    temperature: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    ph: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    result: z.ZodNullable<z.ZodOptional<z.ZodEnum<["pass", "fail", "conditional"]>>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    collection_id: z.ZodNumber;
    test_date: z.ZodString;
    fat: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    protein: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    snf: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    lactose: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    temperature: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    ph: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    result: z.ZodNullable<z.ZodOptional<z.ZodEnum<["pass", "fail", "conditional"]>>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    collection_id: z.ZodNumber;
    test_date: z.ZodString;
    fat: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    protein: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    snf: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    lactose: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    temperature: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    ph: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    result: z.ZodNullable<z.ZodOptional<z.ZodEnum<["pass", "fail", "conditional"]>>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createStorageTankSchema: z.ZodObject<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tank_name: z.ZodString;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    capacity_liters: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    current_volume: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tank_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tank_name: z.ZodString;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    capacity_liters: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    current_volume: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tank_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tank_name: z.ZodString;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    capacity_liters: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    current_volume: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tank_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createInventoryCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createInventoryItemSchema: z.ZodObject<{
    category_id: z.ZodNumber;
    name: z.ZodString;
    sku: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    reorder_level: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    category_id: z.ZodNumber;
    name: z.ZodString;
    sku: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    reorder_level: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    category_id: z.ZodNumber;
    name: z.ZodString;
    sku: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    reorder_level: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const receiveStockSchema: z.ZodObject<{
    item_id: z.ZodNumber;
    quantity: z.ZodNumber;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    supplier_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    received_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    item_id: z.ZodNumber;
    quantity: z.ZodNumber;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    supplier_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    received_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    item_id: z.ZodNumber;
    quantity: z.ZodNumber;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    supplier_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    received_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const issueStockSchema: z.ZodObject<{
    item_id: z.ZodNumber;
    quantity: z.ZodNumber;
    issued_to: z.ZodString;
    issued_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    item_id: z.ZodNumber;
    quantity: z.ZodNumber;
    issued_to: z.ZodString;
    issued_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    item_id: z.ZodNumber;
    quantity: z.ZodNumber;
    issued_to: z.ZodString;
    issued_date: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createSupplierSchema: z.ZodObject<{
    supplier_name: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contact_person: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    supplier_name: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contact_person: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    supplier_name: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contact_person: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createPurchaseRequestSchema: z.ZodObject<{
    item_name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNumber;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    estimated_cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    requested_by: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    department_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    required_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    item_name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNumber;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    estimated_cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    requested_by: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    department_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    required_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    item_name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNumber;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    estimated_cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    requested_by: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    department_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    required_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createPurchaseOrderSchema: z.ZodObject<{
    supplier_id: z.ZodNumber;
    request_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    order_date: z.ZodString;
    expected_delivery: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
        item_name: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNumber;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        unit_price: z.ZodNumber;
        total_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        unit_price: number;
        item_name: string;
        description?: string | null | undefined;
        unit?: string | null | undefined;
        total_price?: number | null | undefined;
    }, {
        quantity: number;
        unit_price: number;
        item_name: string;
        description?: string | null | undefined;
        unit?: string | null | undefined;
        total_price?: number | null | undefined;
    }>, "many">>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    supplier_id: z.ZodNumber;
    request_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    order_date: z.ZodString;
    expected_delivery: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
        item_name: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNumber;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        unit_price: z.ZodNumber;
        total_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        unit_price: number;
        item_name: string;
        description?: string | null | undefined;
        unit?: string | null | undefined;
        total_price?: number | null | undefined;
    }, {
        quantity: number;
        unit_price: number;
        item_name: string;
        description?: string | null | undefined;
        unit?: string | null | undefined;
        total_price?: number | null | undefined;
    }>, "many">>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    supplier_id: z.ZodNumber;
    request_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    order_date: z.ZodString;
    expected_delivery: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
        item_name: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNumber;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        unit_price: z.ZodNumber;
        total_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        unit_price: number;
        item_name: string;
        description?: string | null | undefined;
        unit?: string | null | undefined;
        total_price?: number | null | undefined;
    }, {
        quantity: number;
        unit_price: number;
        item_name: string;
        description?: string | null | undefined;
        unit?: string | null | undefined;
        total_price?: number | null | undefined;
    }>, "many">>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createVehicleSchema: z.ZodObject<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vehicle_name: z.ZodString;
    plate_number: z.ZodString;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    model: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    year: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "maintenance", "out_of_service"]>>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vehicle_name: z.ZodString;
    plate_number: z.ZodString;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    model: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    year: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "maintenance", "out_of_service"]>>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vehicle_name: z.ZodString;
    plate_number: z.ZodString;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    model: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    year: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "maintenance", "out_of_service"]>>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createDriverSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    license_number: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    national_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    license_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    license_expiry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    license_number: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    national_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    license_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    license_expiry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    license_number: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    national_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    license_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    license_expiry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createTransportRequestSchema: z.ZodObject<{
    department_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    pickup_location: z.ZodString;
    destination: z.ZodString;
    required_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    department_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    pickup_location: z.ZodString;
    destination: z.ZodString;
    required_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    department_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    pickup_location: z.ZodString;
    destination: z.ZodString;
    required_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createTripSchema: z.ZodObject<{
    vehicle_id: z.ZodNumber;
    driver_id: z.ZodNumber;
    request_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    start_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    end_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    distance: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    fuel_used: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    destination: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["scheduled", "started", "in_progress", "completed", "cancelled"]>>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    vehicle_id: z.ZodNumber;
    driver_id: z.ZodNumber;
    request_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    start_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    end_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    distance: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    fuel_used: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    destination: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["scheduled", "started", "in_progress", "completed", "cancelled"]>>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    vehicle_id: z.ZodNumber;
    driver_id: z.ZodNumber;
    request_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    start_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    end_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    distance: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    fuel_used: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    destination: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["scheduled", "started", "in_progress", "completed", "cancelled"]>>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createFuelRecordSchema: z.ZodObject<{
    vehicle_id: z.ZodNumber;
    quantity: z.ZodNumber;
    cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    date: z.ZodString;
    fuel_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mileage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    vehicle_id: z.ZodNumber;
    quantity: z.ZodNumber;
    cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    date: z.ZodString;
    fuel_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mileage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    vehicle_id: z.ZodNumber;
    quantity: z.ZodNumber;
    cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    date: z.ZodString;
    fuel_type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mileage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createMaintenanceSchema: z.ZodObject<{
    vehicle_id: z.ZodNumber;
    equipment_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    date: z.ZodString;
    maintenance_type: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    next_service_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    vehicle_id: z.ZodNumber;
    equipment_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    date: z.ZodString;
    maintenance_type: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    next_service_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    vehicle_id: z.ZodNumber;
    equipment_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    date: z.ZodString;
    maintenance_type: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    next_service_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createIncomeSchema: z.ZodObject<{
    amount: z.ZodNumber;
    source: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    date: z.ZodString;
    payment_method: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    amount: z.ZodNumber;
    source: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    date: z.ZodString;
    payment_method: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    amount: z.ZodNumber;
    source: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    date: z.ZodString;
    payment_method: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createExpenseSchema: z.ZodObject<{
    amount: z.ZodNumber;
    category: z.ZodOptional<z.ZodString>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    description: z.ZodString;
    date: z.ZodString;
    payment_method: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    department_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    vendor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    amount: z.ZodNumber;
    category: z.ZodOptional<z.ZodString>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    description: z.ZodString;
    date: z.ZodString;
    payment_method: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    department_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    vendor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    amount: z.ZodNumber;
    category: z.ZodOptional<z.ZodString>;
    category_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    description: z.ZodString;
    date: z.ZodString;
    payment_method: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    department_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    vendor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createInvoiceSchema: z.ZodObject<{
    customer_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    invoice_number: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    items: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit_price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unit_price: number;
    }, {
        description: string;
        quantity: number;
        unit_price: number;
    }>, "many">>>;
    tax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    total_amount: z.ZodOptional<z.ZodNumber>;
    due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    customer_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    invoice_number: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    items: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit_price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unit_price: number;
    }, {
        description: string;
        quantity: number;
        unit_price: number;
    }>, "many">>>;
    tax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    total_amount: z.ZodOptional<z.ZodNumber>;
    due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    customer_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    invoice_number: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    items: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit_price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unit_price: number;
    }, {
        description: string;
        quantity: number;
        unit_price: number;
    }>, "many">>>;
    tax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    total_amount: z.ZodOptional<z.ZodNumber>;
    due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createCustomerSchema: z.ZodObject<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    first_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    last_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customer_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    first_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    last_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customer_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    first_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    last_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customer_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createProductSchema: z.ZodObject<{
    category_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodNumber;
    cost_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity_available: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    category_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodNumber;
    cost_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity_available: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    category_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodNumber;
    cost_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity_available: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createSalesOrderSchema: z.ZodObject<{
    customer_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    order_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    order_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        product_id: z.ZodNumber;
        quantity: z.ZodNumber;
        unit_price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        unit_price: number;
        product_id: number;
    }, {
        quantity: number;
        unit_price: number;
        product_id: number;
    }>, "many">>>;
    product_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    total_amount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    customer_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    order_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    order_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        product_id: z.ZodNumber;
        quantity: z.ZodNumber;
        unit_price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        unit_price: number;
        product_id: number;
    }, {
        quantity: number;
        unit_price: number;
        product_id: number;
    }>, "many">>>;
    product_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    total_amount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    customer_id: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    order_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    order_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        product_id: z.ZodNumber;
        quantity: z.ZodNumber;
        unit_price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        unit_price: number;
        product_id: number;
    }, {
        quantity: number;
        unit_price: number;
        product_id: number;
    }>, "many">>>;
    product_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    unit_price: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    total_amount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createHealthRecordSchema: z.ZodObject<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    checkup_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    record_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    diagnosis: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    checkup_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    record_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    diagnosis: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    checkup_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    record_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    diagnosis: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    treatment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    symptoms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | null | undefined;
}, {
    name: string;
    slug: string;
    description?: string | null | undefined;
}>;
export declare const createVaccinationRecordSchema: z.ZodObject<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    vaccine: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vaccine_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vaccination_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    next_due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    administered_by: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batch_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    vaccine: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vaccine_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vaccination_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    next_due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    administered_by: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batch_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    animal_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    vaccine: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vaccine_name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vaccination_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    next_due_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    administered_by: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    veterinarian: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batch_number: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=modules.d.ts.map
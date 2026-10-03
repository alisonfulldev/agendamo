// Row types for the tables in supabase/migrations. Hand-written because the Supabase project is
// configured last; once it exists, `supabase gen types typescript` can replace them.

export type Plan = "free" | "pro" | "team";
export type Segment =
  "beauty" | "barber" | "aesthetics" | "psychology" | "physio" | "personal_trainer" | "tattoo";
export type AppointmentStatus =
  "confirmed" | "pending" | "awaiting_deposit" | "cancelled" | "completed" | "no_show";
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "confirmed",
  "pending",
  "awaiting_deposit",
];
export type DepositType = "none" | "fixed" | "percent";
export type DepositStatus = "none" | "waiting" | "informed" | "confirmed";

export interface Business {
  id: string;
  name: string;
  slug: string;
  brand_key: string;
  segment: Segment;
  timezone: string;
  plan: Plan;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  slot_interval_minutes: 15 | 30 | 60;
  min_notice_minutes: number;
  max_days_ahead: number;
  booking_confirmation: "auto" | "manual";
  no_show_limit: number | null;
  portal_opt_out: boolean;
  suspended_at: string | null;
  /** Professionals paid for (1 included + extras). */
  professional_seats: number;
  created_at: string;
}

export interface Member {
  id: string;
  business_id: string;
  user_id: string;
  role: "owner" | "staff";
  professional_id: string | null;
  created_at: string;
}

export interface Professional {
  id: string;
  business_id: string;
  name: string;
  photo_key: string | null;
  active: boolean;
  position: number;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  deposit_type: DepositType;
  deposit_value: number;
  return_after_days: number | null;
  active: boolean;
  position: number;
  created_at: string;
}

export interface ProfessionalService {
  business_id: string;
  professional_id: string;
  service_id: string;
  duration_override: number | null;
  price_override: number | null;
}

export interface Resource {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
}

export interface WorkingHours {
  id: string;
  business_id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface TimeOff {
  id: string;
  business_id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  notes: string | null;
  marketing_opt_in: boolean;
  blocked: boolean;
  no_show_count: number;
  referral_code: string;
  referred_by_customer_id: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  professional_id: string;
  customer_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: "chat" | "manual";
  cancel_token: string;
  deposit_cents: number;
  deposit_status: DepositStatus;
  deposit_expires_at: string | null;
  coupon_code: string | null;
  discount_cents: number;
  referral_code: string | null;
  package_id: string | null;
  google_event_id: string | null;
  created_at: string;
}

export interface AppointmentService {
  id: string;
  business_id: string;
  appointment_id: string;
  service_id: string | null;
  name: string;
  duration_minutes: number;
  price_cents: number;
  position: number;
}

export interface PageSettings {
  business_id: string;
  bio: string | null;
  avatar_key: string | null;
  cover_key: string | null;
  primary_color_override: string | null;
  whatsapp_number: string | null;
  instagram_url: string | null;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  show_prices: boolean;
  google_review_url: string | null;
  pix_key: string | null;
  pix_receiver_name: string | null;
  deposit_deadline_minutes: number;
  updated_at: string;
}

export interface PageLink {
  id: string;
  business_id: string;
  label: string;
  url: string;
  position: number;
  active: boolean;
}

export interface PagePhoto {
  id: string;
  business_id: string;
  object_key: string;
  width: number;
  height: number;
  size_bytes: number;
  position: number;
  hidden: boolean;
  created_at: string;
}

export interface BookingRequest {
  id: string;
  business_id: string;
  service_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  preferred_date: string | null;
  preferred_period: "morning" | "afternoon" | "evening" | null;
  /** Free time chosen in the conversation; the owner confirms it in the panel. */
  preferred_starts_at: string | null;
  professional_id: string | null;
  /** Appointment created when the owner confirmed the request. */
  appointment_id: string | null;
  message: string | null;
  status: "new" | "contacted" | "done" | "discarded";
  created_at: string;
}

export interface Combo {
  id: string;
  business_id: string;
  name: string;
  price_cents: number;
  active: boolean;
  created_at: string;
}

export interface ComboService {
  business_id: string;
  combo_id: string;
  service_id: string;
  position: number;
}

export interface Package {
  id: string;
  business_id: string;
  service_id: string;
  name: string;
  sessions: number;
  price_cents: number;
  active: boolean;
  created_at: string;
}

export interface CustomerPackage {
  id: string;
  business_id: string;
  customer_id: string;
  package_id: string;
  sessions_left: number;
  sold_at: string;
}

export interface BusinessCoupon {
  id: string;
  business_id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  valid_until: string | null;
  max_uses: number | null;
  uses: number;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  appointment_id: string;
  customer_id: string | null;
  rating: number;
  comment: string | null;
  reply: string | null;
  hidden: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  provider: "asaas";
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan: "pro" | "team";
  billing_cycle: "monthly" | "yearly";
  /** Professionals paid beyond the one included. */
  extra_professionals: number;
  billing_type: "pix" | "credit_card";
  card_last4: string | null;
  card_brand: string | null;
  /** Each add-on is its own Asaas subscription. */
  addons: {
    featured?: {
      city: string;
      subscription_id: string;
      status: "pending" | "active" | "cancelled";
    }[];
    custom_domain?: {
      subscription_id: string;
      status: "pending" | "active" | "cancelled";
      paid_until?: string;
    };
  };
  status: "pending" | "active" | "overdue" | "cancelled";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntry {
  id: string;
  business_id: string;
  service_id: string;
  professional_id: string | null;
  date: string;
  customer_name: string;
  phone: string;
  email: string | null;
  notified_at: string | null;
  status: "waiting" | "notified" | "booked" | "expired" | "removed";
  created_at: string;
}

export interface AbandonedBooking {
  id: string;
  business_id: string;
  service_ids: string[];
  date: string | null;
  slot: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  consent: boolean;
  status: "open" | "resolved";
  created_at: string;
}

export interface Referral {
  id: string;
  business_id: string;
  referrer_customer_id: string;
  referred_customer_id: string;
  appointment_id: string | null;
  status: "pending" | "valid";
  reward_applied: boolean;
  created_at: string;
}

export interface CustomDomain {
  id: string;
  business_id: string;
  domain: string;
  verified: boolean;
  created_at: string;
}

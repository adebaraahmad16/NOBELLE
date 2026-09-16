// ─────────────────────────────────────────────────────────────
// NOBELLE data module.
//
// DATA PRINCIPLE: This file intentionally contains NO business
// data. Products, categories, collections, reviews and customers
// are created by the store administrator through the Admin
// Dashboard (or a real backend/API when connected) and live in
// the application data layer (AdminDataContext / ProductContext).
//
// The only static export kept here is the standard size chart —
// neutral reference information, not business records.
// ─────────────────────────────────────────────────────────────

// Legacy exports kept empty so older imports keep working.
// Always prefer ProductContext / AdminDataContext for live data.
export const products = [];
export const categories = [];
export const testimonials = [];

// Standard apparel size chart (reference information only).
export const sizeChart = [
  { size: 'XS', bust: '32"', waist: '24"', hips: '34"', uk: '6', eu: '34', us: '2' },
  { size: 'S', bust: '34"', waist: '26"', hips: '36"', uk: '8', eu: '36', us: '4' },
  { size: 'M', bust: '36"', waist: '28"', hips: '38"', uk: '10', eu: '38', us: '6' },
  { size: 'L', bust: '38"', waist: '30"', hips: '40"', uk: '12', eu: '40', us: '8' },
  { size: 'XL', bust: '40"', waist: '32"', hips: '42"', uk: '14', eu: '42', us: '10' },
  { size: 'XXL', bust: '42"', waist: '34"', hips: '44"', uk: '16', eu: '44', us: '12' },
];

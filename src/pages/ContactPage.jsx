import { api } from '../api/client';
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

function AnimatedSection({ children, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

export default function ContactPage() {
  const [contact, setContact] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api('/content/contact')
      .then(value => setContact(value || {}))
      .catch(e => setError(e.message));
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/contact', { method: 'POST', body: formData });
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white">
      {/* ── 1. HERO SECTION WITH AUTHENTIC AFRICAN FASHION BACKGROUND ── */}
      <section className="relative min-h-[380px] lg:min-h-[440px] flex items-center justify-center overflow-hidden">
        {/* Full-width authentic Nigerian/African fashion imagery (distinct from About page) */}
        <img
          src="/images/occasion_wear_banner.jpg"
          alt="NOBELLE Nigerian Fashion Contact"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Subtle dark burgundy overlay for readability (no gradients) */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(26, 10, 15, 0.78)' }}
        />

        <div className="container-custom relative z-10 text-center py-16 px-4 max-w-3xl mx-auto">
          <p className="text-brand-gold text-xs sm:text-sm tracking-[0.3em] uppercase mb-3 font-medium">
            Customer Care & Enquiries
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl text-white font-bold mb-4">
            We'd Love to Hear From You
          </h1>
          <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-xl mx-auto font-light">
            Whether you have an enquiry about our latest Ankara drop, need sizing advice, or want assistance with an order — our team is here for you.
          </p>
        </div>
      </section>

      {/* ── 2. MAIN CONTACT SECTION (INFO & ELEVATED FORM CARD) ── */}
      <section className="section-padding bg-brand-cream">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Contact Details Column */}
            <div className="lg:col-span-5">
              <AnimatedSection>
                <div className="bg-white p-8 sm:p-10 border border-brand-beige-dark/40 shadow-sm">
                  <p className="text-brand-gold text-xs tracking-[0.25em] uppercase mb-2 font-semibold">
                    Direct Assistance
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl text-brand-charcoal mb-4">
                    Get in Touch
                  </h2>
                  <p className="text-brand-gray text-sm leading-relaxed mb-8">
                    Our Lagos-based concierge is available Monday through Saturday to answer questions regarding sizes, order tracking, and bespoke styling advice.
                  </p>

                  <div className="space-y-6">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand-cream flex items-center justify-center flex-shrink-0 text-brand-burgundy border border-brand-beige-dark/30">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-xs tracking-wider uppercase text-brand-gray mb-0.5 font-medium">Email Us</p>
                        <p className="text-sm font-medium text-brand-charcoal">
                          {contact.email || 'support@nobellefashion.com'}
                        </p>
                        <p className="text-xs text-brand-gray mt-0.5">We reply within 24 hours</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand-cream flex items-center justify-center flex-shrink-0 text-brand-burgundy border border-brand-beige-dark/30">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-xs tracking-wider uppercase text-brand-gray mb-0.5 font-medium">Call or WhatsApp</p>
                        <p className="text-sm font-medium text-brand-charcoal">
                          {contact.phone || '+234 800 NOBELLE'}
                        </p>
                        <p className="text-xs text-brand-gray mt-0.5">Mon–Sat, 9am to 6pm WAT</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand-cream flex items-center justify-center flex-shrink-0 text-brand-burgundy border border-brand-beige-dark/30">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-xs tracking-wider uppercase text-brand-gray mb-0.5 font-medium">Showroom & Studio</p>
                        <p className="text-sm font-medium text-brand-charcoal leading-relaxed">
                          {contact.address || 'Victoria Island, Lagos, Nigeria'}
                        </p>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand-cream flex items-center justify-center flex-shrink-0 text-brand-burgundy border border-brand-beige-dark/30">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-xs tracking-wider uppercase text-brand-gray mb-0.5 font-medium">Operating Hours</p>
                        <p className="text-sm text-brand-charcoal">Monday — Friday: 9:00 AM — 6:00 PM</p>
                        <p className="text-sm text-brand-charcoal">Saturday: 10:00 AM — 4:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Elevated Contact Form Card */}
            <div className="lg:col-span-7">
              <AnimatedSection>
                <div className="bg-white p-8 sm:p-12 border border-brand-beige-dark/40 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare size={20} className="text-brand-burgundy" />
                    <p className="text-brand-gold text-xs tracking-[0.25em] uppercase font-semibold">
                      Online Message
                    </p>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-brand-charcoal mb-3">
                    Send Us a Message
                  </h3>
                  <p className="text-brand-gray text-sm mb-6">
                    Fill out the form below with your enquiry and a member of our team will get back to you promptly.
                  </p>

                  {submitted && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 mb-6 text-sm flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Thank you for contacting NOBELLE!</p>
                        <p className="text-xs text-green-700 mt-0.5">Your message has been received. We will respond within 24 hours.</p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-brand-charcoal font-medium mb-1.5">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="e.g. Chioma Adebayo"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-brand-charcoal font-medium mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="e.g. chioma@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-brand-charcoal font-medium mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g. Sizing enquiry for Ankara Maxi Dress"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-brand-charcoal font-medium mb-1.5">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="input-field resize-none"
                        placeholder="How can we assist you today?"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-primary w-full sm:w-auto inline-flex items-center justify-center min-w-[160px]"
                    >
                      <Send size={15} className="mr-2" />
                      {busy ? 'Sending…' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

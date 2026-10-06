import { api } from '../api/client';
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Camera, MessageCircle, Hash } from 'lucide-react';
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
  const [contact,setContact] = useState({});
  useEffect(() => { api('/content/contact').then(value => setContact(value || {})).catch(() => {}); }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api('/contact', { method: 'POST', body: formData }); setSubmitted(true); setFormData({ name: '', email: '', subject: '', message: '' }); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="bg-brand-beige py-12 lg:py-16">
        <div className="container-custom text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal mb-2">
            Contact Us
          </h1>
          <p className="text-brand-gray text-sm tracking-wider">
            Home / <span className="text-brand-charcoal">Contact</span>
          </p>
        </div>
      </div>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <AnimatedSection>
                <h2 className="font-serif text-2xl text-brand-charcoal mb-6">Get in Touch</h2>
                <p className="text-brand-gray text-sm leading-relaxed mb-8">
                  We'd love to hear from you. Whether you have questions about our collections,
                  need styling advice, or want to share your NOBELLE experience — we're here for you.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-beige flex items-center justify-center flex-shrink-0">
                      <Mail size={18} className="text-brand-red" />
                    </div>
                    <div>
                      <p className="text-xs tracking-wider uppercase text-brand-gray mb-1">Email</p>
                      <p className="text-sm text-brand-charcoal">{contact.email || 'Contact details will be published here.'}</p>
                      <p className="text-sm text-brand-charcoal"></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-beige flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-brand-red" />
                    </div>
                    <div>
                      <p className="text-xs tracking-wider uppercase text-brand-gray mb-1">Phone</p>
                      <p className="text-sm text-brand-charcoal">{contact.phone || ''}</p>
                      <p className="text-sm text-brand-charcoal"></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-beige flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-brand-red" />
                    </div>
                    <div>
                      <p className="text-xs tracking-wider uppercase text-brand-gray mb-1">Address</p>
                      <p className="text-sm text-brand-charcoal">
                        {contact.address || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-beige flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-brand-red" />
                    </div>
                    <div>
                      <p className="text-xs tracking-wider uppercase text-brand-gray mb-1">Business Hours</p>
                      <p className="text-sm text-brand-charcoal">Mon — Fri: 9:00 AM — 6:00 PM</p>
                      <p className="text-sm text-brand-charcoal">Sat: 10:00 AM — 4:00 PM</p>
                      <p className="text-sm text-brand-gray"></p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-beige">
                  <p className="text-xs tracking-wider uppercase text-brand-gray mb-4">Follow Us</p>
                  <div className="flex gap-3">
                    
                    
                    
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <AnimatedSection>
                <div className="bg-brand-cream p-8 lg:p-12">
                  <h3 className="font-serif text-xl text-brand-charcoal mb-6">Send Us a Message</h3>

                  {submitted && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-6 text-sm flex items-center gap-2">
                      <Send size={16} />
                      Thank you! Your message has been sent. We'll get back to you within 24 hours.
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">{error && <p role="alert">{error}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Jane Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="jane@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="How can we help?"
                      />
                    </div>
                    <div>
                      <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className="input-field resize-none"
                        placeholder="Tell us more..."
                        required
                      />
                    </div>
                    <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
                      <Send size={16} className="mr-2" />
                      Send Message
                    </button>
                  </form>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-80 lg:h-96 bg-brand-beige">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425878428698!3d40.74076904379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sGoogle!5e0!3m2!1sen!2sus!4v1586000412513!5m2!1sen!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="NOBELLE Location"
        />
      </section>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Clock, Package, CreditCard, ChevronDown, Mail, Phone, HelpCircle } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

function AnimatedSection({ children, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

export default function ReturnPolicyPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const policies = [
    {
      icon: Clock,
      title: '30-Day Return Window',
      description: 'You have 30 days from the date of delivery to initiate a return. Items must be in their original condition with all tags attached.',
    },
    {
      icon: Package,
      title: 'Easy Returns Process',
      description: 'Simply contact our support team to receive a prepaid return label. Pack your items securely and drop off at any authorized shipping location.',
    },
    {
      icon: CreditCard,
      title: 'Full Refund Guarantee',
      description: 'Once we receive and inspect your return, a full refund will be processed to your original payment method within 5-7 business days.',
    },
    {
      icon: RotateCcw,
      title: 'Free Exchanges',
      description: 'Need a different size or color? We offer free exchanges on all full-priced items. Simply request an exchange when initiating your return.',
    },
  ];

  const conditions = [
    'Items must be unworn, unwashed, and in original condition',
    'All original tags must be attached',
    'Items must be returned in their original packaging',
    'Undergarments and swimwear are final sale for hygiene reasons',
    'Sale items marked as "Final Sale" cannot be returned',
    'Custom or personalized items cannot be returned',
    'Items purchased with a gift card will be refunded to a gift card',
  ];

  const faqs = [
    {
      question: 'How long does it take to process my return?',
      answer: 'Once we receive your returned item, please allow 3-5 business days for inspection and processing. Your refund will then be issued to your original payment method within 5-7 business days.',
    },
    {
      question: 'Can I return items purchased during a sale?',
      answer: 'Items purchased during regular sales can be returned within our standard 30-day window. However, items marked as "Final Sale" are non-returnable. Please check the product page for details before purchasing.',
    },
    {
      question: 'Do I have to pay for return shipping?',
      answer: 'For returns within the United States, we provide a prepaid return label at no cost. For international returns, shipping costs are the responsibility of the customer unless the item was defective or incorrect.',
    },
    {
      question: 'Can I exchange an item for a different style?',
      answer: 'We currently offer exchanges for different sizes or colors of the same item. If you\'d like a completely different style, please return the original item for a refund and place a new order.',
    },
    {
      question: 'What if I received a defective or wrong item?',
      answer: 'We sincerely apologize for any inconvenience. Please contact us immediately at support@nobelle.com with photos of the issue. We\'ll arrange a free return and send the correct item as quickly as possible.',
    },
    {
      question: 'Can I return a gift?',
      answer: 'Yes! Gift recipients can initiate a return and will receive a NOBELLE gift card for the value of the returned item(s). The original purchaser will not be notified.',
    },
  ];

  const timeline = [
    { step: 1, title: 'Initiate Return', desc: 'Contact us via email or phone within 30 days of delivery', time: 'Day 1' },
    { step: 2, title: 'Receive Label', desc: 'We\'ll send you a prepaid return shipping label', time: 'Day 1-2' },
    { step: 3, title: 'Ship Your Return', desc: 'Pack items securely and drop off at any shipping location', time: 'Day 2-5' },
    { step: 4, title: 'Inspection', desc: 'Our team inspects the returned items', time: 'Day 7-10' },
    { step: 5, title: 'Refund Issued', desc: 'Refund processed to your original payment method', time: 'Day 12-17' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="bg-brand-beige py-12 lg:py-16">
        <div className="container-custom text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal mb-2">
            Return Policy
          </h1>
          <p className="text-brand-gray text-sm tracking-wider">
            Home / <span className="text-brand-charcoal">Return Policy</span>
          </p>
        </div>
      </div>

      {/* Policy Overview */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-5xl">
          <AnimatedSection className="text-center mb-14">
            <h2 className="font-serif text-2xl lg:text-3xl text-brand-charcoal mb-4">
              Hassle-Free Returns
            </h2>
            <p className="text-brand-gray text-sm max-w-lg mx-auto">
              We want you to love every NOBELLE piece. If something isn't right, we make returns and exchanges simple and stress-free.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {policies.map((policy, i) => (
              <AnimatedSection key={i}>
                <div className="text-center p-6 bg-brand-cream h-full">
                  <div className="w-14 h-14 mx-auto mb-4 bg-white flex items-center justify-center">
                    <policy.icon size={22} className="text-brand-red" />
                  </div>
                  <h3 className="font-serif text-base text-brand-charcoal mb-2">{policy.title}</h3>
                  <p className="text-xs text-brand-gray leading-relaxed">{policy.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Return Timeline */}
      <section className="section-padding bg-brand-charcoal">
        <div className="container-custom max-w-4xl">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-serif text-2xl lg:text-3xl text-white mb-3">Return Process Timeline</h2>
            <p className="text-white/50 text-sm">From start to finish, here's what to expect</p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="relative">
              {/* Line */}
              <div className="hidden lg:block absolute top-6 left-0 right-0 h-px bg-white/20" />

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {timeline.map((item) => (
                  <div key={item.step} className="relative text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-brand-red text-white rounded-full flex items-center justify-center text-sm font-semibold relative z-10">
                      {item.step}
                    </div>
                    <h4 className="text-white text-sm font-medium mb-1">{item.title}</h4>
                    <p className="text-white/50 text-xs mb-2">{item.desc}</p>
                    <span className="text-brand-gold text-xs font-medium">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Conditions */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <AnimatedSection>
            <h2 className="font-serif text-2xl text-brand-charcoal mb-8 text-center">
              Return Conditions
            </h2>
            <div className="bg-brand-cream p-6 lg:p-8">
              <ul className="space-y-3">
                {conditions.map((condition, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-brand-gray">
                    <span className="w-5 h-5 bg-brand-red/10 text-brand-red flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                      ✓
                    </span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQs */}
      <section className="section-padding bg-brand-beige">
        <div className="container-custom max-w-3xl">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-serif text-2xl lg:text-3xl text-brand-charcoal mb-3">
              Frequently Asked Questions
            </h2>
          </AnimatedSection>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <AnimatedSection key={i}>
                <div className="bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-brand-cream/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-brand-charcoal pr-4 flex items-center gap-3">
                      <HelpCircle size={16} className="text-brand-red flex-shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-brand-gray transition-transform duration-300 flex-shrink-0 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-400 ${
                      openFaq === i ? 'max-h-48' : 'max-h-0'
                    }`}
                  >
                    <p className="px-5 pb-5 pl-12 text-sm text-brand-gray leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-2xl text-center">
          <AnimatedSection>
            <h2 className="font-serif text-2xl text-brand-charcoal mb-4">Need Help?</h2>
            <p className="text-brand-gray text-sm mb-8">
              Our customer support team is ready to assist you with any return or exchange questions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-brand-red" />
                <span className="text-brand-charcoal">support@nobelle.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-brand-red" />
                <span className="text-brand-charcoal">+1 (555) 123-4567</span>
              </div>
            </div>
            <Link to="/contact" className="btn-primary">
              Contact Support
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

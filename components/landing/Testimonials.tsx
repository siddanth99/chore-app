"use client";

import { useState, useEffect } from 'react';

const testimonials = [
  {
    id: 1,
    content: "Found someone to assemble my IKEA furniture in under an hour. The helper was professional, fast, and even cleaned up after! Will definitely use again.",
    author: 'Sarah M.',
    role: 'Homeowner',
    rating: 5,
    avatar: 'S',
  },
  {
    id: 2,
    content: "I've been using Chore App to find side gigs and it's been amazing. The payment system is secure and I love being able to choose jobs that fit my schedule.",
    author: 'Marcus J.',
    role: 'Helper',
    rating: 5,
    avatar: 'M',
  },
  {
    id: 3,
    content: "As a busy mom, this app is a lifesaver. From lawn care to grocery runs, I can get help with anything. The verified workers give me peace of mind.",
    author: 'Emily R.',
    role: 'Parent',
    rating: 5,
    avatar: 'E',
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonials" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 fade-up">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">What People Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trusted by thousands of homeowners and helpers
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Testimonial Cards */}
          <div className="relative h-64 sm:h-56">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`absolute inset-0 transition-all duration-500 ${
                  index === activeIndex
                    ? 'opacity-100 translate-x-0'
                    : index < activeIndex
                    ? 'opacity-0 -translate-x-8'
                    : 'opacity-0 translate-x-8'
                }`}
                aria-hidden={index !== activeIndex}
              >
                <div className="glass-card p-8 h-full flex flex-col justify-between">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-highlight fill-highlight"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg text-foreground/90 mb-6">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  index === activeIndex
                    ? 'bg-primary w-8'
                    : 'bg-muted hover:bg-muted-foreground/30'
                }`}
                aria-label={`View testimonial ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


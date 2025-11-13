import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mail, Github, Linkedin, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    } else if (!/^[A-Za-z\s\-']+$/.test(formData.name)) {
      newErrors.name = 'Name should contain only letters, spaces, hyphens, and apostrophes';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 254) {
      newErrors.email = 'Email must be less than 254 characters';
    }

    // Validate subject
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.length > 2000) {
      newErrors.message = 'Message must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Make POST request to email API endpoint
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success handling (Task 3.1)
        toast({
          title: t.contact.messageSent,
          description: 'Thank you for contacting ClimaSense. We will get back to you soon.',
        });
        
        // Clear form fields and errors after successful submission
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setErrors({});
        (e.target as HTMLFormElement).reset();
      } else {
        // Error handling (Task 3.2)
        // Display appropriate error toast for different error types
        let errorMessage = 'Something went wrong. Please try again later.';
        
        if (response.status === 400) {
          // Validation error
          errorMessage = data.error || 'Please check your form inputs and try again.';
        } else if (response.status === 429) {
          // Rate limit error
          errorMessage = 'Too many requests. Please try again in an hour.';
        } else if (response.status === 500) {
          // Server error
          errorMessage = data.error || 'Server error. Please try again later.';
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        // Form data is preserved (not cleared) to allow retry
      }
    } catch (error) {
      // Network error handling (Task 3.2)
      toast({
        title: 'Error',
        description: 'Unable to send message. Please check your connection.',
        variant: 'destructive',
      });
      // Form data is preserved (not cleared) to allow retry
    } finally {
      // Re-enable submit button to allow retry (Task 3.2)
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.contact.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>{t.contact.getInTouch}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.contact.name}</Label>
                  <Input 
                    id="name" 
                    name="name"
                    placeholder={t.contact.name} 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required 
                    minLength={2}
                    maxLength={100}
                    pattern="[A-Za-z\s\-']+"
                    title="Name should contain only letters, spaces, hyphens, and apostrophes"
                    className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.contact.email}</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder={t.contact.email} 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required 
                    maxLength={254}
                    className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t.contact.subject}</Label>
                  <Select 
                    name="subject"
                    value={formData.subject}
                    onValueChange={(value) => handleInputChange('subject', value)}
                    required
                  >
                    <SelectTrigger className={errors.subject ? 'border-red-500 focus:ring-red-500' : ''}>
                      <SelectValue placeholder={t.contact.subject} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Data Request">Data Request</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Feedback">Feedback</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p id="subject-error" className="text-sm text-red-500 mt-1">{errors.subject}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t.contact.message}</Label>
                  <Textarea 
                    id="message" 
                    name="message"
                    placeholder={t.contact.message} 
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={5} 
                    required 
                    minLength={10}
                    maxLength={2000}
                    className={errors.message ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                  />
                  {errors.message && (
                    <p id="message-error" className="text-sm text-red-500 mt-1">{errors.message}</p>
                  )}
                </div>
                <Button type="submit" variant="interactive" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t.contact.sending : t.contact.sendMessage}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-interactive" />
                  Connect With Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Join our community and stay updated with the latest climate intelligence insights.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" size="icon" asChild className="hover:bg-accent/20 hover:border-accent transition-all">
                    <a href="https://github.com/Ontiomacer" target="_blank" rel="noopener noreferrer" aria-label="GitHub - Tejas Tiwari">
                      <Github className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild className="hover:bg-blue-500/20 hover:border-blue-500 transition-all">
                    <a href="https://www.linkedin.com/in/tejas-tiwari-9ba569360" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn - Tejas Tiwari">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild className="hover:bg-sky-500/20 hover:border-sky-500 transition-all">
                    <a href="https://x.com/_j13394" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) - Tejas Tiwari">
                      <Twitter className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-accent/10 backdrop-blur-sm border-accent/30 shadow-card">
              <CardHeader>
                <CardTitle>Partnership Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We welcome collaborations with research institutions, NGOs, and organizations working towards
                  climate resilience.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-1">•</span>
                    <span>Custom data integration and API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-1">•</span>
                    <span>Regional climate monitoring solutions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-1">•</span>
                    <span>AI model training and customization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

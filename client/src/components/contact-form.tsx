import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactInfo } from "@shared/schema";

interface ContactFormProps {
  contactInfo: ContactInfo;
  onUpdate: (info: ContactInfo) => void;
}

export function ContactForm({ contactInfo, onUpdate }: ContactFormProps) {
  const handleInputChange = (field: keyof ContactInfo) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onUpdate({
      ...contactInfo,
      [field]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Information</h3>
      
      <form className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-neutral-700">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={contactInfo.name || ''}
            onChange={handleInputChange('name')}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-neutral-700">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={contactInfo.email || ''}
            onChange={handleInputChange('email')}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-neutral-700">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone"
            value={contactInfo.phone || ''}
            onChange={handleInputChange('phone')}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="company" className="text-sm font-medium text-neutral-700">Company</Label>
          <Input
            id="company"
            type="text"
            placeholder="Enter company name"
            value={contactInfo.company || ''}
            onChange={handleInputChange('company')}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-neutral-700">Job Title</Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter your role"
            value={contactInfo.title || ''}
            onChange={handleInputChange('title')}
            className="mt-1"
          />
        </div>
      </form>
    </div>
  );
}

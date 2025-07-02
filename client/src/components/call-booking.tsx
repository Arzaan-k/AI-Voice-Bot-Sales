import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BookingInfo, ContactInfo } from "@shared/schema";

interface CallBookingProps {
  bookingInfo: BookingInfo;
  onUpdate: (info: BookingInfo) => void;
  contactInfo: ContactInfo;
  sessionId: string;
}

export function CallBooking({ bookingInfo, onUpdate, contactInfo, sessionId }: CallBookingProps) {
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);

  const bookCallMutation = useMutation({
    mutationFn: async (data: { bookingInfo: BookingInfo; contactInfo: ContactInfo; sessionId: string }) => {
      const response = await apiRequest('POST', '/api/book-call', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Call Booked Successfully!",
        description: "You'll receive a calendar invitation within 5 minutes."
      });
      setIsBooking(false);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsBooking(false);
    }
  });

  const handleBookCall = () => {
    if (!contactInfo.name || !contactInfo.email || !bookingInfo.date || !bookingInfo.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in your contact details and select a preferred date/time.",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);
    bookCallMutation.mutate({ bookingInfo, contactInfo, sessionId });
  };

  const timeSlots = [
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "16:00", label: "4:00 PM" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Schedule Your Call</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="date" className="text-sm font-medium text-neutral-700">Preferred Date</Label>
          <Input
            id="date"
            type="date"
            value={bookingInfo.date || ''}
            onChange={(e) => onUpdate({ ...bookingInfo, date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-neutral-700">Preferred Time</Label>
          <Select value={bookingInfo.time || ''} onValueChange={(time) => onUpdate({ ...bookingInfo, time })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-2">Meeting Type</Label>
          <RadioGroup
            value={bookingInfo.type || ''}
            onValueChange={(type: "video" | "phone") => onUpdate({ ...bookingInfo, type })}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video" />
              <Label htmlFor="video" className="text-sm text-neutral-700">Video Call (Zoom)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="phone" id="phone" />
              <Label htmlFor="phone" className="text-sm text-neutral-700">Phone Call</Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button
          onClick={handleBookCall}
          disabled={isBooking || bookCallMutation.isPending}
          className="w-full bg-accent hover:bg-green-600 text-white py-2.5 px-4 font-medium"
        >
          <CalendarCheck className="mr-2" size={16} />
          <span>{isBooking || bookCallMutation.isPending ? 'Booking...' : 'Book Sales Call'}</span>
        </Button>
        
        <p className="text-xs text-neutral-500 text-center">
          You'll receive a calendar invitation within 5 minutes
        </p>
      </div>
    </div>
  );
}

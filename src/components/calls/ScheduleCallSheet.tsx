import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Video, Phone, Users, Repeat, X } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContacts } from '@/hooks/useContacts';
import { useCalls } from '@/hooks/useCalls';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScheduleCallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

const durationOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

const recurrenceOptions = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

export function ScheduleCallSheet({ open, onOpenChange }: ScheduleCallSheetProps) {
  const { contacts } = useContacts();
  const { scheduleCall } = useCalls();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [callType, setCallType] = useState<'voice' | 'video'>('video');
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [recurrence, setRecurrence] = useState('none');
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInvitee = (userId: string) => {
    setSelectedInvitees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your call',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Date required',
        description: 'Please select a date for your call',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      await scheduleCall(title, scheduledDate, callType, {
        description: description || undefined,
        durationMinutes: parseInt(duration),
        isRecurring: recurrence !== 'none',
        recurrencePattern: recurrence !== 'none' ? recurrence : undefined,
        waitingRoomEnabled: waitingRoom,
        invitees: selectedInvitees,
      });

      toast({
        title: 'Call scheduled',
        description: `Your ${callType} call has been scheduled for ${format(scheduledDate, 'PPp')}`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDate(new Date());
      setTime('10:00');
      setDuration('60');
      setCallType('video');
      setWaitingRoom(true);
      setRecurrence('none');
      setSelectedInvitees([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to schedule',
        description: 'There was an error scheduling your call. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Schedule a Call</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Weekly team sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Call Type */}
            <div className="space-y-2">
              <Label>Call Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={callType === 'video' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 rounded-xl",
                    callType === 'video' && "bg-gradient-primary text-white"
                  )}
                  onClick={() => setCallType('video')}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Video Call
                </Button>
                <Button
                  type="button"
                  variant={callType === 'voice' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 rounded-xl",
                    callType === 'voice' && "bg-gradient-primary text-white"
                  )}
                  onClick={() => setCallType('voice')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Voice Call
                </Button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-xl"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time *</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="rounded-xl">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Repeat
              </Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Waiting Room */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <p className="font-medium">Waiting Room</p>
                <p className="text-sm text-muted-foreground">
                  Participants wait until you admit them
                </p>
              </div>
              <Switch
                checked={waitingRoom}
                onCheckedChange={setWaitingRoom}
              />
            </div>

            {/* Invite Participants */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Invite Participants
              </Label>

              {/* Selected invitees */}
              {selectedInvitees.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedInvitees.map((userId) => {
                    const contact = contacts.find(c => c.contact_user_id === userId);
                    return (
                      <Badge
                        key={userId}
                        variant="secondary"
                        className="pr-1 rounded-full"
                      >
                        {contact?.profile?.display_name || 'Unknown'}
                        <button
                          onClick={() => toggleInvitee(userId)}
                          className="ml-1 p-0.5 rounded-full hover:bg-muted"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Contact list */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contacts.map((contact) => {
                  const isSelected = selectedInvitees.includes(contact.contact_user_id);
                  return (
                    <motion.button
                      key={contact.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleInvitee(contact.contact_user_id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                        isSelected ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {contact.profile?.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium">
                          {contact.nickname || contact.profile?.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{contact.profile?.username}
                        </p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {contacts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No contacts to invite
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Submit Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button
            className="w-full rounded-xl bg-gradient-primary text-white h-12"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Call'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

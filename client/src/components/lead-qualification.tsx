import { Progress } from "@/components/ui/progress";
import { DollarSign, User, Target, Calendar, CheckCircle, Clock, HelpCircle } from "lucide-react";
import type { LeadScore } from "@shared/schema";

interface LeadQualificationProps {
  leadScore: LeadScore;
}

export function LeadQualification({ leadScore }: LeadQualificationProps) {
  const getStatusIcon = (score: number) => {
    if (score >= 7) return <CheckCircle className="text-accent" size={16} />;
    if (score >= 4) return <Clock className="text-amber-500" size={16} />;
    return <HelpCircle className="text-neutral-400" size={16} />;
  };

  const getStatusText = (score: number) => {
    if (score >= 7) return "Qualified";
    if (score >= 4) return "In Progress";
    return "Unknown";
  };

  const criteria = [
    { key: 'budget', label: 'Budget', icon: DollarSign, score: leadScore.budget },
    { key: 'authority', label: 'Authority', icon: User, score: leadScore.authority },
    { key: 'need', label: 'Need', icon: Target, score: leadScore.need },
    { key: 'timeline', label: 'Timeline', icon: Calendar, score: leadScore.timeline },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Lead Qualification</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">Overall Score</span>
          <div className="flex items-center space-x-2">
            <Progress value={leadScore.overall * 10} className="w-20" />
            <span className="text-sm font-semibold text-accent">{leadScore.overall.toFixed(1)}/10</span>
          </div>
        </div>
        
        {/* BANT Criteria */}
        <div className="space-y-3">
          {criteria.map(({ key, label, icon: Icon, score }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon className="text-accent" size={16} />
                <span className="text-sm text-neutral-700">{label}</span>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(score)}
                <span className="text-xs text-neutral-500">{getStatusText(score)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

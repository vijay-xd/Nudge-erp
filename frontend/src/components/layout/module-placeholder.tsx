import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  phase: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  docsLink?: string;
}

export function ModulePlaceholder({
  title,
  description,
  phase,
  icon: Icon,
  features,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={title}
        description={description}
        badge={
          <Badge variant="warning" dot>
            {phase} Planned
          </Badge>
        }
      />

      <Card className="border-slate-200">
        <CardHeader className="text-left pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 mb-2">
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">{title} Module Architecture</CardTitle>
          <CardDescription>
            This enterprise module is scheduled for implementation in <strong>{phase}</strong>. Backend endpoints, state machines, and ledger queues are defined in the schema.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" /> Planned Workflow Capabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feat, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Phase 1 Foundation Active</span>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Return to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

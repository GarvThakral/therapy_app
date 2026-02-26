import React from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export function EmptyState({ headline, subtext, icon, action }: {
  headline: string;
  subtext: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
        {icon || <BookOpen className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />}
      </div>
      <p className="text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px' }}>
        {headline}
      </p>
      <p className="text-muted-foreground text-[14px] max-w-sm">
        {subtext}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

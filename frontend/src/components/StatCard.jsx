import React from 'react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass = 'border-cyber-border text-white',
  iconColorClass = 'text-cyber-primary'
}) => {
  return (
    <div className={`bg-cyber-card border rounded-2xl p-7 md:p-8 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.4)] hover:border-cyber-primary/45 shadow-lg ${colorClass}`}>
      <div className="space-y-2">
        <p className="text-[13px] md:text-sm uppercase font-mono tracking-widest text-cyber-muted/80">{title}</p>
        <h3 className="text-4xl md:text-5xl font-extrabold font-mono tracking-tight leading-none">{value}</h3>
      </div>
      <div className={`p-3.5 bg-cyber-bg rounded-xl border border-cyber-border/80 ${iconColorClass}`}>
        <Icon className="h-7 w-7" />
      </div>
    </div>
  );
};

export default StatCard;

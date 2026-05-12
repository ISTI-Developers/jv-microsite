'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type TabItem = {
  value: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
};

type GTabsProps = {
  items: TabItem[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
};

export default function GTabs({ items, value, onChange, className, listClassName, contentClassName }: GTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange} className={className}>
      <TabsList className={listClassName}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) =>
        item.content ? (
          <TabsContent key={item.value} value={item.value} className={contentClassName}>
            {item.content}
          </TabsContent>
        ) : null
      )}
    </Tabs>
  );
}

'use client';

import * as React from 'react';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';

type Option = {
  value: number;
  label: string;
};

type Props = {
  options: Option[];
  value: number[];
  onChange: (vals: number[]) => void;
  placeholder?: string;
};

export default function JVComboSelect({ options, value, onChange, placeholder = 'Select JV' }: Props) {
  const anchor = useComboboxAnchor();

  return (
    <Combobox multiple items={options} value={value} onValueChange={(vals: number[]) => onChange(vals)}>
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(vals: number[]) => (
            <>
              {vals.map((v) => {
                const opt = options.find((o) => o.value === v);
                if (!opt) return null;

                return <ComboboxChip key={v}>{opt.label}</ComboboxChip>;
              })}
              <ComboboxChipsInput placeholder={placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(item: Option) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

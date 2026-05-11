"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "./button";
import { Input } from "./input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { FormField } from "./form-field";
import { cn } from "@/lib/utils";
import {
  PiggyBank,
  Wallet,
  Home,
  GraduationCap,
  Heart,
  Briefcase,
  Plane,
  Gift,
  Car,
  Utensils,
  ShoppingBag,
  Smartphone,
  Tv,
  Gamepad2,
  Music,
  BookOpen,
  Dumbbell,
  Coffee,
  Pizza,
  HeartPulse,
  Baby,
  PawPrint,
  TreePine,
  Sun,
  Cloud,
  Umbrella,
  Flame,
  Sparkles,
  Star,
  Trophy,
  Target,
  Zap,
  Shield,
  Lock,
  Unlock,
  Key,
  Crown,
  Diamond,
  Gem,
  Coins,
  Banknote,
  CreditCard,
  Building2,
  Factory,
  Store,
  ShoppingCart,
} from "lucide-react";

interface IconPickerProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
  className?: string;
}

const ICONS = [
  { name: "piggy", icon: PiggyBank, label: "Piggy Bank" },
  { name: "wallet", icon: Wallet, label: "Wallet" },
  { name: "home", icon: Home, label: "Home" },
  { name: "education", icon: GraduationCap, label: "Education" },
  { name: "heart", icon: Heart, label: "Health" },
  { name: "work", icon: Briefcase, label: "Work" },
  { name: "travel", icon: Plane, label: "Travel" },
  { name: "gift", icon: Gift, label: "Gift" },
  { name: "car", icon: Car, label: "Car" },
  { name: "food", icon: Utensils, label: "Food" },
  { name: "shopping", icon: ShoppingBag, label: "Shopping" },
  { name: "phone", icon: Smartphone, label: "Phone" },
  { name: "entertainment", icon: Tv, label: "Entertainment" },
  { name: "gaming", icon: Gamepad2, label: "Gaming" },
  { name: "music", icon: Music, label: "Music" },
  { name: "books", icon: BookOpen, label: "Books" },
  { name: "fitness", icon: Dumbbell, label: "Fitness" },
  { name: "coffee", icon: Coffee, label: "Coffee" },
  { name: "pizza", icon: Pizza, label: "Pizza" },
  { name: "medical", icon: HeartPulse, label: "Medical" },
  { name: "baby", icon: Baby, label: "Baby" },
  { name: "pets", icon: PawPrint, label: "Pets" },
  { name: "nature", icon: TreePine, label: "Nature" },
  { name: "weather", icon: Sun, label: "Weather" },
  { name: "cloud", icon: Cloud, label: "Cloud" },
  { name: "umbrella", icon: Umbrella, label: "Umbrella" },
  { name: "fire", icon: Flame, label: "Fire" },
  { name: "sparkles", icon: Sparkles, label: "Sparkles" },
  { name: "star", icon: Star, label: "Star" },
  { name: "trophy", icon: Trophy, label: "Trophy" },
  { name: "target", icon: Target, label: "Target" },
  { name: "zap", icon: Zap, label: "Energy" },
  { name: "shield", icon: Shield, label: "Security" },
  { name: "lock", icon: Lock, label: "Locked" },
  { name: "unlock", icon: Unlock, label: "Unlocked" },
  { name: "key", icon: Key, label: "Key" },
  { name: "crown", icon: Crown, label: "Crown" },
  { name: "diamond", icon: Diamond, label: "Diamond" },
  { name: "gem", icon: Gem, label: "Gem" },
  { name: "coins", icon: Coins, label: "Coins" },
  { name: "banknote", icon: Banknote, label: "Cash" },
  { name: "card", icon: CreditCard, label: "Card" },
  { name: "building", icon: Building2, label: "Building" },
  { name: "factory", icon: Factory, label: "Factory" },
  { name: "store", icon: Store, label: "Store" },
  { name: "cart", icon: ShoppingCart, label: "Cart" },
];

export function IconPicker({
  name,
  label,
  description,
  required,
  hideLabel,
  className,
}: IconPickerProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const errorKey = errors[name]?.message as string | undefined;
  const error = errorKey ? errorKey : undefined;

  return (
    <FormField
      label={label}
      htmlFor={name}
      error={error}
      description={description}
      required={required}
      hideLabel={hideLabel}
      className={className}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <IconPickerContent value={field.value} onChange={field.onChange} />
        )}
      />
    </FormField>
  );
}

interface IconPickerContentProps {
  value: string;
  onChange: (value: string) => void;
}

function IconPickerContent({ value, onChange }: IconPickerContentProps) {
  const [search, setSearch] = React.useState("");

  const filteredIcons = React.useMemo(() => {
    if (!search) return ICONS;
    return ICONS.filter((icon) =>
      icon.label.toLowerCase().includes(search.toLowerCase()) ||
      icon.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
  };

  const selectedIcon = ICONS.find((icon) => icon.name === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 justify-start gap-3 text-base rounded-xl"
          aria-label={selectedIcon ? `Selected icon: ${selectedIcon.label}` : "Select an icon"}
        >
          {selectedIcon ? (
            <selectedIcon.icon className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="flex-1 text-left">
            {selectedIcon ? selectedIcon.label : "Select an icon"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div
          className="grid grid-cols-6 gap-1 p-2 max-h-64 overflow-y-auto"
          role="grid"
          aria-label="Icon picker"
        >
          {filteredIcons.map((icon) => {
            const IconComponent = icon.icon;
            return (
              <button
                key={icon.name}
                type="button"
                onClick={() => handleSelect(icon.name)}
                className={cn(
                  "h-12 w-full flex flex-col items-center justify-center gap-1 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors p-1",
                  value === icon.name && "bg-primary/10 ring-2 ring-primary"
                )}
                aria-label={`Select icon ${icon.label}`}
                aria-selected={value === icon.name}
                role="gridcell"
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-[10px] text-xs text-slate-600 truncate w-full text-center">
                  {icon.label}
                </span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type WeightUnit = "lb" | "kg";

const KG_PER_LB = 0.45359237;

// Weight is always stored in kg (the app's original unit). These helpers
// convert only at the display/edit boundary, rounding to a clean 5lb step
// since that's how plates/dumbbells are actually loaded in pounds.
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  if (unit === "kg") return kg;
  return Math.round(kg / KG_PER_LB / 5) * 5;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  if (unit === "kg") return value;
  return Math.round(value * KG_PER_LB * 100) / 100;
}

export function weightStep(unit: WeightUnit): number {
  return unit === "lb" ? 5 : 1;
}

type UnitsContextValue = { unit: WeightUnit; setUnit: (unit: WeightUnit) => void };

const UnitsContext = createContext<UnitsContextValue | null>(null);

const STORAGE_KEY = "formline-unit";

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<WeightUnit>("lb");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "lb" || stored === "kg") setUnitState(stored);
  }, []);

  function setUnit(next: WeightUnit) {
    setUnitState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return <UnitsContext.Provider value={{ unit, setUnit }}>{children}</UnitsContext.Provider>;
}

export function useUnits(): UnitsContextValue {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within a UnitsProvider");
  return ctx;
}

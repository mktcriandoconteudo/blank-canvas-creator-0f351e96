import { supabase, getWalletClient } from "@/lib/supabase";
import { processTransaction, emitTokens } from "@/lib/economy";

export interface CarData {
  id: string;
  tokenId: string;
  name: string;
  model: string;
  ownerWallet: string;
  speed: number;
  acceleration: number;
  handling: number;
  durability: number;
  engineHealth: number;
  level: number;
  xp: number;
  xpToNext: number;
  attributePoints: number;
  totalKm: number;
  wins: number;
  racesCount: number;
  racesSinceRevision: number;
  lastOilChangeKm: number;
  isRented: boolean;
  rentalRacesRemaining: number;
  licensePlate: string;
  purchasedAt: string;
  fuelTanks: number;
  lastFuelRefill: string; // ISO timestamp
}

export interface GameState {
  cars: CarData[];
  selectedCarId: string | null;
  nitroPoints: number;
  fuelTanks: number;
  lastFuelRefill: string; // ISO date
  walletAddress: string;
}

const DEFAULT_WALLET = "0x7f3a...e1b2";

const XP_PER_WIN = 80;
const XP_PER_LOSS = 25;
const XP_MULTIPLIER = 1.5;
const OIL_CHANGE_INTERVAL_KM = 100;
const RENTAL_NP_WIN = 40;
const RENTAL_NP_LOSS = 10;
export const RENTAL_STAT_PENALTY = 0.8; // -20% stats
const OWNED_NP_WIN = 150;
const OWNED_NP_LOSS = 20;

export const calculateXpToNext = (level: number): number => {
  return Math.round(100 * Math.pow(XP_MULTIPLIER, level - 1));
};

/** Max fuel tanks based on car rarity/model */
export const getMaxFuel = (model: string): number => {
  switch (model) {
    case "legendary": return 7;
    case "rare": return 6;
    default: return 5;
  }
};

export const needsOilChange = (car: CarData): boolean => {
  return (car.totalKm - car.lastOilChangeKm) >= OIL_CHANGE_INTERVAL_KM;
};

export const kmSinceOilChange = (car: CarData): number => {
  return Math.round(car.totalKm - car.lastOilChangeKm);
};

const defaultCar: CarData = {
  id: "car-001",
  tokenId: "#4829",
  name: "Phantom X9",
  model: "legendary",
  ownerWallet: DEFAULT_WALLET,
  speed: 75,
  acceleration: 60,
  handling: 65,
  durability: 80,
  engineHealth: 100,
  level: 1,
  xp: 0,
  xpToNext: 100,
  attributePoints: 0,
  totalKm: 0,
  wins: 0,
  racesCount: 0,
  racesSinceRevision: 0,
  lastOilChangeKm: 0,
  isRented: false,
  rentalRacesRemaining: 0,
  licensePlate: "",
  purchasedAt: new Date().toISOString(),
  fuelTanks: 7, // legendary default
  lastFuelRefill: new Date().toISOString(),
};


// ---- Supabase helpers ----

function mapCarRow(row: any): CarData {
  return {
    id: row.id,
    tokenId: row.token_id,
    name: row.name,
    model: row.model,
    ownerWallet: row.owner_wallet,
    speed: row.speed_base,
    acceleration: row.acceleration_base,
    handling: row.handling_base,
    durability: row.durability,
    engineHealth: row.engine_health,
    level: row.level,
    xp: row.xp,
    xpToNext: row.xp_to_next,
    attributePoints: row.attribute_points,
    totalKm: Number(row.total_km),
    wins: row.wins,
    racesCount: row.races_count,
    racesSinceRevision: row.races_since_revision,
    lastOilChangeKm: Number(row.last_oil_change_km ?? 0),
    isRented: false,
    rentalRacesRemaining: 0,
    licensePlate: row.license_plate ?? "",
    purchasedAt: row.purchased_at ?? new Date().toISOString(),
    fuelTanks: row.fuel_tanks ?? getMaxFuel(row.model ?? "standard"),
    lastFuelRefill: row.last_fuel_refill ?? new Date().toISOString(),
  };
}

export async function ensureUserExists(wallet: string): Promise<void> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (!data) {
    await supabase.from("users").insert({ wallet_address: wallet });
  }
}

export async function ensureCarExists(wallet: string): Promise<void> {
  const { data } = await supabase
    .from("cars")
    .select("id")
    .eq("owner_wallet", wallet)
    .maybeSingle();

  if (!data) {
    await supabase.from("cars").insert({
      token_id: defaultCar.tokenId,
      owner_wallet: wallet,
      name: defaultCar.name,
      model: defaultCar.model,
      speed_base: defaultCar.speed,
      acceleration_base: defaultCar.acceleration,
      handling_base: defaultCar.handling,
      durability: defaultCar.durability,
      engine_health: defaultCar.engineHealth,
      level: defaultCar.level,
      xp: defaultCar.xp,
      xp_to_next: defaultCar.xpToNext,
      attribute_points: defaultCar.attributePoints,
      total_km: defaultCar.totalKm,
      wins: defaultCar.wins,
      races_count: defaultCar.racesCount,
      races_since_revision: defaultCar.racesSinceRevision,
      last_oil_change_km: defaultCar.lastOilChangeKm,
    });
  }
}

export async function loadGameStateFromSupabase(wallet: string = DEFAULT_WALLET): Promise<GameState> {
  await ensureUserExists(wallet);
  await ensureCarExists(wallet);

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", wallet)
    .maybeSingle();

  const { data: carsData } = await supabase
    .from("cars")
    .select("*")
    .eq("owner_wallet", wallet);

  // Load active rentals to flag rented cars
  const { data: rentalsData } = await supabase
    .from("active_rentals")
    .select("car_id, races_remaining")
    .eq("owner_wallet", wallet)
    .eq("is_active", true);

  const rentalMap = new Map<string, number>();
  (rentalsData ?? []).forEach((r: any) => rentalMap.set(r.car_id, r.races_remaining));

  const now = new Date();
  const wc = getWalletClient(wallet);

  const cars = await Promise.all((carsData ?? []).map(async (row: any) => {
    const car = mapCarRow(row);
    if (rentalMap.has(car.id)) {
      car.isRented = true;
      car.rentalRacesRemaining = rentalMap.get(car.id) ?? 0;
    }
    // Per-car 24h fuel refill
    const lastRefill = new Date(car.lastFuelRefill);
    const hoursSinceRefill = (now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60);
    const maxFuel = getMaxFuel(car.model);
    if (hoursSinceRefill >= 24 && car.fuelTanks < maxFuel) {
      car.fuelTanks = maxFuel;
      car.lastFuelRefill = now.toISOString();
      await wc
        .from("cars")
        .update({ fuel_tanks: maxFuel, last_fuel_refill: now.toISOString() })
        .eq("id", car.id);
    }
    return car;
  }));

  const savedCarId = typeof window !== "undefined" ? localStorage.getItem("selectedCarId") : null;
  const validSavedCar = savedCarId && cars.some((c) => c.id === savedCarId);

  return {
    cars,
    selectedCarId: validSavedCar ? savedCarId : (cars[0]?.id ?? null),
    nitroPoints: userData?.nitro_points ?? 500,
    fuelTanks: 0, // deprecated, now per-car
    lastFuelRefill: "",
    walletAddress: wallet,
  };
}

export async function saveCarToSupabase(car: CarData): Promise<void> {
  const wc = getWalletClient(car.ownerWallet);
  await wc
    .from("cars")
    .update({
      speed_base: car.speed,
      acceleration_base: car.acceleration,
      handling_base: car.handling,
      durability: car.durability,
      engine_health: car.engineHealth,
      level: car.level,
      xp: car.xp,
      xp_to_next: car.xpToNext,
      attribute_points: car.attributePoints,
      total_km: car.totalKm,
      wins: car.wins,
      races_count: car.racesCount,
      races_since_revision: car.racesSinceRevision,
      last_oil_change_km: car.lastOilChangeKm,
      fuel_tanks: car.fuelTanks,
      last_fuel_refill: car.lastFuelRefill,
    })
    .eq("id", car.id);
}

export async function saveUserToSupabase(wallet: string, nitroPoints: number, fuelTanks: number): Promise<void> {
  const wc = getWalletClient(wallet);
  await wc
    .from("users")
    .update({
      nitro_points: nitroPoints,
      fuel_tanks: fuelTanks,
    })
    .eq("wallet_address", wallet);
}

export const getSelectedCar = (state: GameState): CarData | undefined => {
  return state.cars.find((c) => c.id === state.selectedCarId);
};

export const addXpToCar = (
  state: GameState,
  carId: string,
  won: boolean,
  rewardMultiplier: number = 1.0,
  raceNumber: number = 1
): { newState: GameState; leveledUp: boolean; newLevel: number; freeNP: number; lockedNP: number } => {
  const xpGain = won ? XP_PER_WIN : XP_PER_LOSS;
  let leveledUp = false;
  let newLevel = 0;

  const newCars = state.cars.map((car) => {
    if (car.id !== carId) return car;

    const updatedCar = { ...car };
    updatedCar.xp += xpGain;
    updatedCar.racesCount += 1;
    updatedCar.racesSinceRevision += 1;
    if (won) updatedCar.wins += 1;
    updatedCar.totalKm += Math.round(8 + (updatedCar.speed / 100) * 7);

    const durabilityReduction = 1 - (updatedCar.durability / 100) * 0.6;
    const baseEngineDmg = won ? 5 : 8;
    const oilOverdue = needsOilChange(updatedCar);
    const oilMultiplier = oilOverdue ? 1.5 : 1;
    updatedCar.engineHealth = Math.max(0, updatedCar.engineHealth - Math.round(baseEngineDmg * durabilityReduction * oilMultiplier));
    updatedCar.durability = Math.max(0, updatedCar.durability - (won ? 1 : 2));

    while (updatedCar.xp >= updatedCar.xpToNext) {
      updatedCar.xp -= updatedCar.xpToNext;
      updatedCar.level += 1;
      updatedCar.xpToNext = calculateXpToNext(updatedCar.level);
      updatedCar.attributePoints += 3;
      leveledUp = true;
      newLevel = updatedCar.level;
    }

    return updatedCar;
  });

  const car = state.cars.find((c) => c.id === carId);
  const health = car?.engineHealth ?? 100;
  const isRented = car?.isRented ?? false;
  const basePoints = isRented
    ? (won ? RENTAL_NP_WIN : RENTAL_NP_LOSS)
    : (won ? OWNED_NP_WIN : OWNED_NP_LOSS);

  // Apply diminishing reward multiplier (anti-bot)
  const earnedPoints = Math.round((basePoints * health * rewardMultiplier) / 100);

  // 60/40 split: 60% free, 40% locked for upgrades
  const freeNP = Math.round(earnedPoints * 0.6);
  const lockedNP = earnedPoints - freeNP;

  // Decrement fuel on the car that raced
  const newCarsWithFuel = newCars.map((c) => {
    if (c.id !== carId) return c;
    return { ...c, fuelTanks: Math.max(0, c.fuelTanks - 1) };
  });

  const newState: GameState = {
    ...state,
    cars: newCarsWithFuel,
    nitroPoints: state.nitroPoints + freeNP, // Only free NP goes to balance
    fuelTanks: 0, // deprecated
  };

  // Persist to Supabase (fire-and-forget)
  const updatedCar = newCarsWithFuel.find((c) => c.id === carId);
  if (updatedCar) saveCarToSupabase(updatedCar);
  saveUserToSupabase(state.walletAddress, newState.nitroPoints, 0);

  // Use split_reward RPC for proper 60/40 + vesting tracking
  supabase.rpc("split_reward" as any, {
    _wallet: state.walletAddress,
    _total_np: earnedPoints,
    _xp: xpGain,
    _source: won ? "race_win" : "race_loss",
  }).then(() => {});

  // Log race for anti-bot tracking
  (supabase.from("daily_race_log" as any) as any).insert({
    wallet_address: state.walletAddress,
    car_id: carId,
    race_number: raceNumber,
    np_earned: earnedPoints,
    xp_earned: xpGain,
    race_duration_ms: 10000,
  }).then(() => {});

  // Emit tokens (respects hard cap, daily limit, decay)
  emitTokens(state.walletAddress, freeNP, won ? "race_win" : "race_loss").catch(() => {});

  return { newState, leveledUp, newLevel, freeNP, lockedNP };
};

export const distributePoint = (
  state: GameState,
  carId: string,
  attribute: "speed" | "acceleration" | "handling" | "durability"
): GameState => {
  const newCars = state.cars.map((car) => {
    if (car.id !== carId || car.attributePoints <= 0) return car;
    return {
      ...car,
      [attribute]: Math.min(car[attribute] + 2, 100),
      attributePoints: car.attributePoints - 1,
    };
  });

  const newState = { ...state, cars: newCars };

  const updatedCar = newCars.find((c) => c.id === carId);
  if (updatedCar) saveCarToSupabase(updatedCar);

  return newState;
};

export const repairCar = (
  state: GameState,
  carId: string,
  cost: number
): GameState | null => {
  if (state.nitroPoints < cost) return null;

  const newCars = state.cars.map((car) => {
    if (car.id !== carId) return car;
    return {
      ...car,
      engineHealth: 100,
      durability: 100,
      racesSinceRevision: 0,
    };
  });

  const newState = {
    ...state,
    cars: newCars,
    nitroPoints: state.nitroPoints - cost,
  };

  const updatedCar = newCars.find((c) => c.id === carId);
  if (updatedCar) saveCarToSupabase(updatedCar);
  saveUserToSupabase(state.walletAddress, newState.nitroPoints, newState.fuelTanks);

  // Try to spend locked NP first (for upgrades), then deflation
  supabase.rpc("spend_locked_np" as any, {
    _wallet: state.walletAddress,
    _amount: Math.min(cost, Math.round(cost * 0.4)), // use up to 40% from locked
    _reason: "car_repair",
  }).then(() => {});

  processTransaction(cost, state.walletAddress, "car_repair").catch(() => {});

  return newState;
};

export const changeOil = (
  state: GameState,
  carId: string,
  cost: number
): GameState | null => {
  if (state.nitroPoints < cost) return null;

  const newCars = state.cars.map((car) => {
    if (car.id !== carId) return car;
    return {
      ...car,
      lastOilChangeKm: car.totalKm,
    };
  });

  const newState = {
    ...state,
    cars: newCars,
    nitroPoints: state.nitroPoints - cost,
  };

  const updatedCar = newCars.find((c) => c.id === carId);
  if (updatedCar) saveCarToSupabase(updatedCar);
  saveUserToSupabase(state.walletAddress, newState.nitroPoints, newState.fuelTanks);

  // Transação deflacionária: 10% burn, 20% reward pool, 70% treasury
  processTransaction(cost, state.walletAddress, "oil_change").catch(() => {});

  return newState;
};

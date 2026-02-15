import { supabase, getWalletClient } from "@/lib/supabase";

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

export const calculateXpToNext = (level: number): number => {
  return Math.round(100 * Math.pow(XP_MULTIPLIER, level - 1));
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

  const cars = (carsData ?? []).map(mapCarRow);

  // Daily fuel refill
  const today = new Date().toISOString().split("T")[0];
  let fuelTanks = userData?.fuel_tanks ?? 5;
  const lastRefill = userData?.last_fuel_refill ?? today;

  if (lastRefill !== today) {
    fuelTanks = 5;
    const wc = getWalletClient(wallet);
    await wc
      .from("users")
      .update({ fuel_tanks: 5, last_fuel_refill: today })
      .eq("wallet_address", wallet);
  }

  return {
    cars,
    selectedCarId: cars[0]?.id ?? null,
    nitroPoints: userData?.nitro_points ?? 500,
    fuelTanks,
    lastFuelRefill: lastRefill,
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
  won: boolean
): { newState: GameState; leveledUp: boolean; newLevel: number } => {
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

    updatedCar.engineHealth = Math.max(0, updatedCar.engineHealth - (won ? 3 : 5));
    updatedCar.durability = Math.max(0, updatedCar.durability - (won ? 2 : 4));

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
  const basePoints = won ? 150 : 20;
  const earnedPoints = Math.round((basePoints * health) / 100);

  const newState: GameState = {
    ...state,
    cars: newCars,
    nitroPoints: state.nitroPoints + earnedPoints,
    fuelTanks: Math.max(0, state.fuelTanks - 1),
  };

  // Persist to Supabase (fire-and-forget)
  const updatedCar = newCars.find((c) => c.id === carId);
  if (updatedCar) saveCarToSupabase(updatedCar);
  saveUserToSupabase(state.walletAddress, newState.nitroPoints, newState.fuelTanks);

  return { newState, leveledUp, newLevel };
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

  return newState;
};

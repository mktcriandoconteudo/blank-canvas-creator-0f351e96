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
}

const STORAGE_KEY = "turbonitro_gamestate";

const XP_PER_WIN = 80;
const XP_PER_LOSS = 25;
const XP_MULTIPLIER = 1.5; // each level needs 1.5x more XP

export const calculateXpToNext = (level: number): number => {
  return Math.round(100 * Math.pow(XP_MULTIPLIER, level - 1));
};

const defaultCar: CarData = {
  id: "car-001",
  tokenId: "#4829",
  name: "Phantom X9",
  model: "legendary",
  ownerWallet: "0x7f3a...e1b2",
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

const defaultState: GameState = {
  cars: [defaultCar],
  selectedCarId: "car-001",
  nitroPoints: 500,
  fuelTanks: 5,
  lastFuelRefill: new Date().toISOString().split("T")[0],
};

export const loadGameState = (): GameState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as GameState;
    }
  } catch (e) {
    console.warn("Failed to load game state", e);
  }
  return { ...defaultState, cars: [{ ...defaultCar }] };
};

export const saveGameState = (state: GameState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save game state", e);
  }
};

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

    // Degrade car
    updatedCar.engineHealth = Math.max(0, updatedCar.engineHealth - (won ? 3 : 5));
    updatedCar.durability = Math.max(0, updatedCar.durability - (won ? 2 : 4));

    // Check level up
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

  // Calculate NitroPoints with ROI formula
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

  saveGameState(newState);
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
  saveGameState(newState);
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
  saveGameState(newState);
  return newState;
};

export const refuelDaily = (state: GameState): GameState => {
  const today = new Date().toISOString().split("T")[0];
  if (state.lastFuelRefill === today) return state;

  const newState = {
    ...state,
    fuelTanks: 5,
    lastFuelRefill: today,
  };
  saveGameState(newState);
  return newState;
};

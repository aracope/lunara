export const mockedMoon = {
  today: jest.fn(async () => ({
    date: "2025-08-23",
    phase: "Full Moon",
    location: { city: "Boise", state: "ID", country: "US" }
  }))
};

export const mockedTarot = {
  daily: jest.fn(async () => ({
    card: { id: 17, name: "The Tower", arcana: "Major Arcana", yes_no: "No" },
    date: "2025-08-23"
  }))
};


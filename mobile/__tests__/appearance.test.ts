/**
 * The theme setters, tested at the boundary that actually broke: the write.
 *
 * Reading the stored value was never the problem — a bundle started with
 * `terrifit.appearance` set to "dark" comes up dark. What broke was that the
 * setter was reachable only through a cover animation's callback, so when the
 * cover stopped being rendered the tap wrote nothing and the screen just sat
 * there. These tests pin the write down on its own, so a change to how the
 * swap is presented cannot quietly disconnect it again.
 */
import { Appearance, DevSettings } from "react-native";
import Storage from "expo-sqlite/kv-store";
import { setAccent, setAppearance } from "@/appearance";
import { ACCENT_KEY, APPEARANCE_KEY, TRANSITION_KEY } from "@/theme";

const store = new Map<string, string>();

let setColorScheme: jest.SpyInstance;
let reload: jest.SpyInstance;
let setItem: jest.SpyInstance;

beforeEach(() => {
  store.clear();
  setItem = jest
    .spyOn(Storage, "setItem")
    .mockImplementation(async (key: string, value: unknown) => {
      // The real signature also accepts an updater function; the setters only
      // ever pass a plain string, and a test that quietly accepted a function
      // would hide it if that changed.
      if (typeof value !== "string") throw new Error(`expected a string for ${key}`);
      store.set(key, value);
    });
  setColorScheme = jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => {});
  reload = jest.spyOn(DevSettings, "reload").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("setAppearance", () => {
  it("stores the mode so the next bundle starts on it", async () => {
    await setAppearance("dark");
    expect(store.get(APPEARANCE_KEY)).toBe("dark");
  });

  it("stores light just as readily as dark", async () => {
    await setAppearance("dark");
    await setAppearance("light");
    expect(store.get(APPEARANCE_KEY)).toBe("light");
  });

  it("hands native chrome back to the OS for system", async () => {
    await setAppearance("system");
    expect(store.get(APPEARANCE_KEY)).toBe("system");
    expect(setColorScheme).toHaveBeenCalledWith(null);
  });

  it("tells native chrome the explicit choice", async () => {
    await setAppearance("light");
    expect(setColorScheme).toHaveBeenCalledWith("light");
  });

  it("flags the swap before reloading, so the new bundle starts covered", async () => {
    await setAppearance("dark");
    expect(store.get(TRANSITION_KEY)).toBe("1");
    expect(reload).toHaveBeenCalled();
  });

  it("writes the value before the reload, not after", async () => {
    // A reload that beat the write would drop the choice on the floor, and the
    // app would come back on the palette the user just tapped away from.
    reload.mockImplementation(() => {
      expect(store.get(APPEARANCE_KEY)).toBe("dark");
    });
    await setAppearance("dark");
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("setAccent", () => {
  it("stores the accent and reloads onto it", async () => {
    await setAccent("ember");
    expect(store.get(ACCENT_KEY)).toBe("ember");
    expect(reload).toHaveBeenCalled();
  });

  it("covers the swap, so the accent change does not flash", async () => {
    await setAccent("ember");
    expect(store.get(TRANSITION_KEY)).toBe("1");
  });

  it("does not touch the appearance mode", async () => {
    await setAppearance("light");
    setItem.mockClear();
    await setAccent("ember");
    expect(setItem).not.toHaveBeenCalledWith(APPEARANCE_KEY, expect.anything());
  });
});

import { fireEvent, render, screen } from "@testing-library/react-native";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { Step1PersonalDetailsScreen } from "../screens/onboarding/Step1PersonalDetailsScreen";
import { useAuthStore } from "../stores/authStore";

jest.mock("../stores/authStore", () => ({
  useAuthStore: jest.fn(),
}));

const mockedUseAuthStore = jest.mocked(useAuthStore);
jest.setTimeout(15000);

const createNavigation = () =>
  ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }) as never;

describe("auth screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows login validation errors", async () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({
        login: jest.fn(),
      } as never),
    );

    render(<LoginScreen navigation={createNavigation()} route={{ key: "Login", name: "Login" }} />);

    fireEvent.press(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Enter a valid email address.", {}, { timeout: 10000 })).toBeTruthy();
  });

  it("blocks sign-up when passwords do not match", async () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({
        register: jest.fn(),
      } as never),
    );

    render(
      <SignUpScreen navigation={createNavigation()} route={{ key: "SignUp", name: "SignUp" }} />,
    );

    fireEvent.changeText(screen.getByTestId("signup-full-name"), "Mo User");
    fireEvent.changeText(screen.getByTestId("signup-email"), "mo@example.com");
    fireEvent.changeText(screen.getByTestId("signup-password"), "password123");
    fireEvent.changeText(screen.getByTestId("signup-confirm-password"), "different123");
    fireEvent.press(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Passwords do not match.", {}, { timeout: 10000 })).toBeTruthy();
  });

  it("requires full name on onboarding step 1", async () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({
        profile: null,
        setProfile: jest.fn(),
        setOnboardingComplete: jest.fn(),
      } as never),
    );

    render(
      <Step1PersonalDetailsScreen
        navigation={createNavigation()}
        route={{ key: "Step1PersonalDetails", name: "Step1PersonalDetails" }}
      />,
    );

    fireEvent.changeText(screen.getByTestId("step1-email"), "mo@example.com");
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Full name is required.", {}, { timeout: 10000 })).toBeTruthy();
  });
});
